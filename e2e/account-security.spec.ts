import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { capturedMailCount, waitForAuthLink } from "./mail";

const initialPassword = "Security-e2e-Password-123!";
const createdUserIds: string[] = [];

async function createVerifiedAccount() {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const email = `e2e-security-${suffix}@example.test`;
  const username = `secure_${suffix}`;
  await auth.api.signUpEmail({ body: { name: "Security Test", email, password: initialPassword, username } });
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: true }, select: { id: true } });
  createdUserIds.push(user.id);
  return { email, password: initialPassword };
}

async function signIn(page: Page, email: string, password = initialPassword) {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
}

test.afterEach(async () => {
  const userIds = createdUserIds.splice(0);
  for (const userId of userIds) {
    await prisma.taskList.deleteMany({ where: { ownerId: userId } });
    await prisma.user.delete({ where: { id: userId } });
  }
});

test("sign-up sends an email verification link and verifies the account", async ({ page }) => {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const email = `e2e-signup-${suffix}@example.test`;

  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill("Verification Test");
  await page.getByLabel("Username").fill(`verify_${suffix}`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(initialPassword);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(new RegExp(`/verify-email\\?email=${encodeURIComponent(email)}`));
  const created = await prisma.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
  createdUserIds.push(created.id);

  await expect(page.getByRole("heading", { name: "Verify your email." })).toBeVisible();
  await expect.poll(async () => (await prisma.user.findUnique({ where: { email }, select: { emailVerified: true } }))?.emailVerified).toBe(false);

  const link = await waitForAuthLink(email, "/api/auth/verify-email?token=");
  await page.goto(link);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect.poll(async () => (await prisma.user.findUnique({ where: { email }, select: { emailVerified: true } }))?.emailVerified).toBe(true);
});

test("password recovery sends a reset link and accepts the new password", async ({ page }) => {
  const user = await createVerifiedAccount();
  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("a password reset link is on its way");

  const link = await waitForAuthLink(user.email, "/api/auth/reset-password/");
  await page.goto(link);
  const newPassword = "Recovered-e2e-Password-456!";
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirm new password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByRole("status")).toContainText("Your password has been changed");

  await signIn(page, user.email, newPassword);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Good to see you, Security." })).toBeVisible();
});

test("account settings update profile, verify an email change, and change the password", async ({ page }) => {
  const user = await createVerifiedAccount();
  await signIn(page, user.email);
  await page.goto("/settings");

  await page.getByLabel("Your name").fill("Updated Security User");
  await page.getByLabel("Username").fill(`updated_${randomUUID().replaceAll("-", "").slice(0, 10)}`);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status")).toContainText("Your profile has been updated");
  await expect.poll(async () => (await prisma.user.findUnique({ where: { email: user.email }, select: { name: true } }))?.name).toBe("Updated Security User");

  const newEmail = `e2e-changed-${randomUUID().replaceAll("-", "").slice(0, 12)}@example.test`;
  const previousInboxCount = await capturedMailCount(user.email);
  await page.getByLabel("New email address").fill(newEmail);
  await page.getByRole("button", { name: "Change email" }).click();
  await expect(page.getByText("Check your current inbox", { exact: false })).toBeVisible();
  await expect.poll(async () => (await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } }))?.id).toBeTruthy();

  const approvalLink = await waitForAuthLink(user.email, "/api/auth/verify-email?token=", previousInboxCount);
  await page.goto(approvalLink);
  const verificationLink = await waitForAuthLink(newEmail, "/api/auth/verify-email?token=");
  await page.goto(verificationLink);
  await expect(page).toHaveURL(/\/settings$/);
  await expect.poll(async () => (await prisma.user.findUnique({ where: { email: newEmail }, select: { emailVerified: true } }))?.emailVerified).toBe(true);

  const newPassword = "Settings-e2e-Password-456!";
  await page.getByLabel("Current password").fill(initialPassword);
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirm new password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Other sessions have been signed out", { exact: false })).toBeVisible();
  await page.getByLabel("Open account menu").click();
  await page.getByRole("button", { name: "Sign out" }).click();

  await signIn(page, newEmail, newPassword);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Good to see you, Updated." })).toBeVisible();
});

test("invalid and expired password reset links explain how to recover", async ({ page }) => {
  await page.goto("/reset-password?error=INVALID_TOKEN");
  await expect(page.locator(".form-error[role=alert]")).toContainText("invalid or has expired");
  await expect(page.getByRole("link", { name: "Request another reset link" })).toHaveAttribute("href", "/forgot-password");
});
