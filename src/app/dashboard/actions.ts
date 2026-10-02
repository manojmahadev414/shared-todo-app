"use server";

import { revalidatePath } from "next/cache";
import { TaskPriority } from "@prisma/client";
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
  revalidatePath("/dashboard");
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
  revalidatePath("/dashboard");
}

export async function deleteTask(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, listId: true } });
  if (!task) throw new Error("Task not found.");
  await requireTaskEditor(task.listId, user.id);
  await prisma.task.delete({ where: { id: task.id } });
  revalidatePath("/dashboard");
}

export async function toggleTask(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, listId: true, completedAt: true } });
  if (!task) throw new Error("Task not found.");
  await requireTaskEditor(task.listId, user.id);
  await prisma.task.update({ where: { id: task.id }, data: { completedAt: task.completedAt ? null : new Date() } });
  revalidatePath("/dashboard");
}

export async function createList(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 100) throw new Error("Enter a list name up to 100 characters.");
  await prisma.taskList.create({ data: { name, ownerId: user.id } });
  revalidatePath("/dashboard");
}
