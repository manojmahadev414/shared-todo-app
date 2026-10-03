"use server";

import { revalidatePath } from "next/cache";
import { ListRole, TaskPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

async function requireTaskEditor(listId: string, userId: string) {
  const list = await prisma.taskList.findUnique({
    where: { id: listId },
    select: { ownerId: true, memberships: { where: { userId }, select: { role: true } } },
  });
  if (!list || (list.ownerId !== userId && !list.memberships.some((member) => member.role === "EDITOR"))) {
    throw new Error("You do not have permission to change tasks in this list.");
  }
}

function parseDueDate(value: FormDataEntryValue | null) {
  const date = String(value ?? "").trim();
  if (!date) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Choose a valid due date.");
  const parsed = new Date(`${date}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error("Choose a valid due date.");
  }
  return parsed;
}

function parsePriority(value: FormDataEntryValue | null): TaskPriority {
  const priority = String(value ?? "NORMAL");
  if (!Object.values(TaskPriority).includes(priority as TaskPriority)) {
    throw new Error("Choose a valid priority.");
  }
  return priority as TaskPriority;
}

function parseTaskTitle(value: FormDataEntryValue | null) {
  const title = String(value ?? "").trim();
  if (!title || title.length > 200) throw new Error("Enter a task title up to 200 characters.");
  return title;
}

function parseDescription(value: FormDataEntryValue | null) {
  const description = String(value ?? "").trim();
  if (description.length > 5000) throw new Error("Description must be 5,000 characters or fewer.");
  return description || null;
}

function refreshTaskViews() {
  revalidatePath("/dashboard");
  revalidatePath("/today");
  revalidatePath("/upcoming");
}

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  if (!listId) throw new Error("Choose a list for this task.");
  await requireTaskEditor(listId, user.id);
  await prisma.task.create({
    data: {
      listId,
      creatorId: user.id,
      title: parseTaskTitle(formData.get("title")),
      description: parseDescription(formData.get("description")),
      dueAt: parseDueDate(formData.get("dueAt")),
      priority: parsePriority(formData.get("priority")),
    },
  });
  refreshTaskViews();
}

export async function updateTask(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) throw new Error("Task not found.");
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, listId: true } });
  if (!task) throw new Error("Task not found.");
  await requireTaskEditor(task.listId, user.id);
  await prisma.task.update({
    where: { id: task.id },
    data: {
      title: parseTaskTitle(formData.get("title")),
      description: parseDescription(formData.get("description")),
      dueAt: parseDueDate(formData.get("dueAt")),
      priority: parsePriority(formData.get("priority")),
    },
  });
  refreshTaskViews();
}

export async function deleteTask(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, listId: true } });
  if (!task) throw new Error("Task not found.");
  await requireTaskEditor(task.listId, user.id);
  await prisma.task.delete({ where: { id: task.id } });
  refreshTaskViews();
}

export async function toggleTask(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, listId: true, completedAt: true } });
  if (!task) throw new Error("Task not found.");
  await requireTaskEditor(task.listId, user.id);
  await prisma.task.update({ where: { id: task.id }, data: { completedAt: task.completedAt ? null : new Date() } });
  refreshTaskViews();
}

export async function createList(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 100) throw new Error("Enter a list name up to 100 characters.");
  await prisma.taskList.create({ data: { name, ownerId: user.id } });
  revalidatePath("/dashboard");
}

function refreshListViews() {
  revalidatePath("/dashboard");
  revalidatePath("/today");
  revalidatePath("/upcoming");
  revalidatePath("/invitations");
}

export async function transferListOwnership(formData: FormData) {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  if (!listId || !memberId) throw new Error("Choose a member to own this list.");

  await prisma.$transaction(async (tx) => {
    const list = await tx.taskList.findUnique({ where: { id: listId }, select: { id: true, ownerId: true, isDefault: true } });
    if (!list || list.ownerId !== user.id) throw new Error("Only the list owner can transfer ownership.");
    if (list.isDefault) throw new Error("Your default list cannot be transferred.");
    const member = await tx.listMember.findFirst({ where: { id: memberId, listId }, select: { userId: true } });
    if (!member || member.userId === user.id) throw new Error("Choose a current member of this list.");

    await tx.taskList.update({ where: { id: listId }, data: { ownerId: member.userId } });
    await tx.listMember.delete({ where: { id: memberId } });
    await tx.listMember.upsert({
      where: { listId_userId: { listId, userId: user.id } },
      create: { listId, userId: user.id, role: ListRole.EDITOR },
      update: { role: ListRole.EDITOR },
    });
    await tx.invitation.updateMany({
      where: { listId, status: "PENDING" },
      data: { status: "REVOKED", respondedAt: new Date() },
    });
  });
  refreshListViews();
}

export async function leaveList(formData: FormData) {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  if (!listId) throw new Error("Choose a list to leave.");

  await prisma.$transaction(async (tx) => {
    const list = await tx.taskList.findUnique({ where: { id: listId }, select: { ownerId: true } });
    if (!list) throw new Error("List not found.");
    if (list.ownerId === user.id) throw new Error("Transfer ownership before leaving your list.");
    const membership = await tx.listMember.findUnique({ where: { listId_userId: { listId, userId: user.id } }, select: { id: true } });
    if (!membership) throw new Error("You are not a member of this list.");
    await tx.listMember.delete({ where: { id: membership.id } });
  });
  refreshListViews();
}

export async function deleteList(formData: FormData) {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  if (!listId) throw new Error("Choose a list to delete.");

  await prisma.$transaction(async (tx) => {
    const list = await tx.taskList.findUnique({ where: { id: listId }, select: { ownerId: true, isDefault: true } });
    if (!list || list.ownerId !== user.id) throw new Error("Only the list owner can delete it.");
    if (list.isDefault) throw new Error("Your default list cannot be deleted.");
    await tx.taskList.delete({ where: { id: listId } });
  });
  refreshListViews();
}
