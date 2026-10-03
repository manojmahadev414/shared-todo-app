import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const password = "Task-views-e2e-Password-123!";
const createdEmails: string[] = [];

function dateKey(offsetDays: number) {
  const timeZone = process.env.APP_TIME_ZONE || "Asia/Kolkata";
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const date = new Date(Date.UTC(Number(get("year")), Number(get("month")) - 1, Number(get("day")) + offsetDays, 12));
  return date.toISOString().slice(0, 10);
}

async function seedTasks() {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const email = `e2e-views-${suffix}@example.test`;
  const username = `views_${suffix}`;
  await auth.api.signUpEmail({ body: { name: "Task Views", email, password, username } });
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: true }, select: { id: true } });
  const list = await prisma.taskList.findFirstOrThrow({ where: { ownerId: user.id, isDefault: true }, select: { id: true } });
  await prisma.task.createMany({ data: [
    { listId: list.id, creatorId: user.id, title: "Overdue task", dueAt: new Date(`${dateKey(-1)}T12:00:00.000Z`) },
    { listId: list.id, creatorId: user.id, title: "Due today task", dueAt: new Date(`${dateKey(0)}T12:00:00.000Z`) },
    { listId: list.id, creatorId: user.id, title: "Tomorrow task", dueAt: new Date(`${dateKey(1)}T12:00:00.000Z`) },
    { listId: list.id, creatorId: user.id, title: "No due date task" },
    { listId: list.id, creatorId: user.id, title: "Completed today task", dueAt: new Date(`${dateKey(0)}T12:00:00.000Z`), completedAt: new Date() },
  ] });
  createdEmails.push(email);
  return { email, listId: list.id };
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
}

test.afterEach(async () => {
  const emails = createdEmails.splice(0);
  const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  for (const user of users) {
    await prisma.taskList.deleteMany({ where: { ownerId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("Today includes overdue and due-today open tasks only", async ({ page }) => {
  const user = await seedTasks();
  await signIn(page, user.email);
  await page.goto("/today");

  await expect(page.getByRole("heading", { name: "Overdue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Due today" })).toBeVisible();
  await expect(page.getByText("Overdue task", { exact: true })).toBeVisible();
  await expect(page.getByText("Due today task", { exact: true })).toBeVisible();
  await expect(page.getByText("Tomorrow task", { exact: true })).toHaveCount(0);
  await expect(page.getByText("No due date task", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Completed today task", { exact: true })).toHaveCount(0);
});

test("Upcoming includes future open tasks and completing a task removes it from the view", async ({ page }) => {
  const user = await seedTasks();
  await signIn(page, user.email);
  await page.goto("/upcoming");

  await expect(page.getByRole("heading", { name: "Upcoming" })).toBeVisible();
  await expect(page.getByText("Tomorrow task", { exact: true })).toBeVisible();
  await expect(page.getByText("Overdue task", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Due today task", { exact: true })).toHaveCount(0);
  await expect(page.getByText("No due date task", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Completed today task", { exact: true })).toHaveCount(0);

  await page.getByRole("article").filter({ hasText: "Tomorrow task" }).getByRole("button", { name: "Complete task" }).click();
  await expect(page.getByText("Tomorrow task", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Nothing coming up")).toBeVisible();
});

test("Today and Upcoming routes require an authenticated session", async ({ page }) => {
  await page.goto("/today");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/upcoming");
  await expect(page).toHaveURL(/\/sign-in$/);
});
