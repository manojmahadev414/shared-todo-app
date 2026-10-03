import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const password = "Lifecycle-e2e-Password-123!";
const createdUserIds: string[] = [];
const createdListIds: string[] = [];

async function createAccount(prefix: string) {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const email = `e2e-${prefix}-${suffix}@example.test`;
  await auth.api.signUpEmail({ body: { name: `${prefix} Person`, email, password, username: `${prefix}_${suffix}` } });
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: true }, select: { id: true, name: true, username: true } });
  createdUserIds.push(user.id);
  return { ...user, email };
}

async function createSharedList() {
  const owner = await createAccount("owner");
  const member = await createAccount("member");
  const list = await prisma.taskList.create({ data: { ownerId: owner.id, name: "Lifecycle Test List" } });
  createdListIds.push(list.id);
  const membership = await prisma.listMember.create({ data: { listId: list.id, userId: member.id, role: "VIEWER" } });
  await prisma.task.create({ data: { listId: list.id, creatorId: owner.id, title: "Lifecycle task" } });
  return { owner, member, list, membership };
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
}

test.afterEach(async () => {
  const listIds = createdListIds.splice(0);
  await prisma.taskList.deleteMany({ where: { id: { in: listIds } } });
  const userIds = createdUserIds.splice(0);
  await prisma.taskList.deleteMany({ where: { ownerId: { in: userIds } } });
  for (const id of userIds) await prisma.user.delete({ where: { id } }).catch(() => undefined);
});

test("owner transfers a custom list to a member and remains an editor", async ({ page }) => {
  const { owner, member, list, membership } = await createSharedList();
  const pendingRecipient = await createAccount("invitee");
  await prisma.invitation.create({ data: { listId: list.id, senderId: owner.id, recipientId: pendingRecipient.id, expiresAt: new Date(Date.now() + 86_400_000) } });
  await signIn(page, owner.email);
  await page.goto("/dashboard");
  const card = page.getByRole("article").filter({ hasText: "Lifecycle Test List" });
  await card.getByLabel("Transfer ownership of Lifecycle Test List").selectOption(membership.id);
  await card.getByRole("button", { name: "Transfer", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("You will remain an editor");
  await dialog.getByRole("button", { name: "Transfer ownership" }).click();

  await expect.poll(async () => (await prisma.taskList.findUnique({ where: { id: list.id }, select: { ownerId: true } }))?.ownerId).toBe(member.id);
  await expect.poll(async () => (await prisma.listMember.findUnique({ where: { listId_userId: { listId: list.id, userId: owner.id } }, select: { role: true } }))?.role).toBe("EDITOR");
  await expect.poll(() => prisma.listMember.findUnique({ where: { listId_userId: { listId: list.id, userId: member.id } } })).toBeNull();
  await expect.poll(async () => (await prisma.invitation.findFirst({ where: { listId: list.id }, select: { status: true } }))?.status).toBe("REVOKED");
  await expect(card.getByRole("button", { name: "Delete list" })).toHaveCount(0);
});

test("member leaves a list after confirmation", async ({ page }) => {
  const { member, list } = await createSharedList();
  await signIn(page, member.email);
  await page.goto("/dashboard");
  const card = page.getByRole("article").filter({ hasText: "Lifecycle Test List" });
  await card.getByRole("button", { name: "Leave list" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("You will lose access");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Leave list" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Leave list" }).click();

  await expect.poll(async () => await prisma.listMember.count({ where: { listId: list.id, userId: member.id } })).toBe(0);
  await expect(page.getByRole("article").filter({ hasText: "Lifecycle Test List" })).toHaveCount(0);
  await expect(await prisma.taskList.findUnique({ where: { id: list.id }, select: { id: true } })).not.toBeNull();
});

test("owner deletes a custom list and its tasks after confirmation", async ({ page }) => {
  const { owner, list } = await createSharedList();
  await signIn(page, owner.email);
  await page.goto("/dashboard");
  const card = page.getByRole("article").filter({ hasText: "Lifecycle Test List" });
  await expect(card.getByRole("button", { name: "Delete list" })).toBeVisible();
  await expect(page.getByRole("article").filter({ hasText: "My Tasks" }).getByRole("button", { name: "Delete list" })).toHaveCount(0);
  await card.getByRole("button", { name: "Delete list" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("permanently deletes the list, its tasks, and its memberships");
  await dialog.getByRole("button", { name: "Delete list" }).click();

  await expect.poll(async () => await prisma.taskList.count({ where: { id: list.id } })).toBe(0);
  await expect.poll(async () => await prisma.task.count({ where: { listId: list.id } })).toBe(0);
  await expect(page.getByRole("article").filter({ hasText: "Lifecycle Test List" })).toHaveCount(0);
});

test("list lifecycle actions require authentication", async ({ page }) => {
  await page.goto("/today");
  await expect(page).toHaveURL(/\/sign-in$/);
});
