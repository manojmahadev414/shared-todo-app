"use server";

import { revalidatePath } from "next/cache";
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

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!listId || !title || title.length > 200) throw new Error("Enter a task title up to 200 characters.");
  await requireTaskEditor(listId, user.id);
  await prisma.task.create({ data: { listId, creatorId: user.id, title } });
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
