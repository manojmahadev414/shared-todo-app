import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const password = "Onboarding-e2e-Password-123!";
const createdEmails: string[] = [];

async function createAccount(options: { username?: string } = {}) {
  const email = `e2e-${randomUUID()}@example.test`;
  await auth.api.signUpEmail({
    body: { name: "Google Test User", email, password, ...(options.username ? { username: options.username } : {}) },
  });
  await prisma.user.update({ where: { email }, data: { emailVerified: true } });
  createdEmails.push(email);
  return { email, password };
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/auth/sign-in/email"));
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const response = await responsePromise;
  if (!response.ok()) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Sign-in API returned ${response.status()}: ${body.message ?? body.code ?? "unknown error"}`);
  }
  await page.waitForURL((url) => url.pathname === "/");
  await page.goto("/dashboard");
}

test.afterEach(async () => {
  const emails = createdEmails.splice(0);
  const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  for (const user of users) {
    await prisma.taskList.deleteMany({ where: { ownerId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("requires an unauthenticated visitor to sign in before username onboarding", async ({ page }) => {
  await page.goto("/complete-profile");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("sends an account without a username through onboarding and saves the chosen username", async ({ page }) => {
  const user = await createAccount();
  await signIn(page, user.email);

  await expect(page).toHaveURL(/\/complete-profile$/);
  await page.getByLabel("Username").fill("google_friendly.1");
  await page.getByRole("button", { name: "Continue to your lists" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Good to see you, Google." })).toBeVisible();
  await expect.poll(async () => (await prisma.user.findUnique({ where: { email: user.email }, select: { username: true } }))?.username).toBe("google_friendly.1");
});

test("does not let the user continue with a username already in use", async ({ page }) => {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
  const existingUsername = `reserved_${suffix}`;
  const existing = await createAccount({ username: existingUsername });
  const incomplete = await createAccount();
  await signIn(page, incomplete.email);

  await expect(page).toHaveURL(/\/complete-profile$/);
  await page.getByLabel("Username").fill(existingUsername);
  await page.getByRole("button", { name: "Continue to your lists" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/complete-profile$/);
  expect(existing.email).not.toBe(incomplete.email);
});

test("rejects usernames outside the allowed format", async ({ page }) => {
  const user = await createAccount();
  await signIn(page, user.email);

  const username = page.getByLabel("Username");
  await username.fill("has spaces");
  await page.getByRole("button", { name: "Continue to your lists" }).click();

  await expect(page).toHaveURL(/\/complete-profile$/);
  await expect(username).toHaveJSProperty("validity.valid", false);
});

test("does not interrupt an account that already has a username", async ({ page }) => {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
  const user = await createAccount({ username: `known_${suffix}` });
  await signIn(page, user.email);

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Good to see you, Google." })).toBeVisible();
});
