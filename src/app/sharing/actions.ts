"use server";

import { InvitationStatus, ListRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

async function requireListOwner(listId: string, userId: string) {
  const list = await prisma.taskList.findUnique({ where: { id: listId }, select: { id: true, ownerId: true } });
  if (!list || list.ownerId !== userId) throw new Error("Only the list owner can manage invitations and members.");
  return list;
}

function parseMemberRole(value: FormDataEntryValue | null): ListRole {
  const role = String(value ?? "VIEWER");
  if (role !== ListRole.EDITOR && role !== ListRole.VIEWER) throw new Error("Choose editor or viewer access.");
  return role as ListRole;
}

function refreshSharingViews() {
  revalidatePath("/dashboard");
  revalidatePath("/invitations");
}

export async function sendInvitation(formData: FormData) {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  const username = String(formData.get("username") ?? "").trim().replace(/^@/, "").toLowerCase();
  const role = parseMemberRole(formData.get("role"));
  if (!listId || !/^[a-zA-Z0-9_.]{3,32}$/.test(username)) throw new Error("Enter a valid username.");
  const list = await requireListOwner(listId, user.id);
  const recipient = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!recipient) throw new Error("No account was found for that username.");
  if (recipient.id === user.id) throw new Error("You already own this list.");

  const membership = await prisma.listMember.findUnique({ where: { listId_userId: { listId, userId: recipient.id } }, select: { id: true } });
  if (membership) throw new Error("That person already has access to this list.");

  const now = new Date();
  const pending = await prisma.invitation.findFirst({
    where: { listId, recipientId: recipient.id, status: InvitationStatus.PENDING },
    select: { id: true, expiresAt: true },
  });
  if (pending && pending.expiresAt > now) throw new Error("An invitation is already pending for that person.");
  if (pending) {
    await prisma.invitation.update({ where: { id: pending.id }, data: { status: InvitationStatus.EXPIRED, respondedAt: now } });
  }

  await prisma.invitation.create({
    data: {
      listId: list.id,
      senderId: user.id,
      recipientId: recipient.id,
      role,
      status: InvitationStatus.PENDING,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  refreshSharingViews();
}

export async function acceptInvitation(formData: FormData) {
  const user = await requireUser();
  const invitationId = String(formData.get("invitationId") ?? "");
  if (!invitationId) throw new Error("Invitation not found.");
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findFirst({
      where: { id: invitationId, recipientId: user.id, status: InvitationStatus.PENDING },
    });
    if (!invitation) return "missing" as const;
    if (invitation.expiresAt <= now) {
      await tx.invitation.update({ where: { id: invitation.id }, data: { status: InvitationStatus.EXPIRED, respondedAt: now } });
      return "expired" as const;
    }
    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, recipientId: user.id, status: InvitationStatus.PENDING, expiresAt: { gt: now } },
      data: { status: InvitationStatus.ACCEPTED, respondedAt: now },
    });
    if (claimed.count !== 1) return "missing" as const;
    await tx.listMember.upsert({
      where: { listId_userId: { listId: invitation.listId, userId: user.id } },
      create: { listId: invitation.listId, userId: user.id, role: invitation.role },
      update: {},
    });
    return "accepted" as const;
  });
  refreshSharingViews();
  if (result === "expired") throw new Error("This invitation has expired.");
  if (result !== "accepted") throw new Error("This invitation is no longer available.");
}

export async function declineInvitation(formData: FormData) {
  const user = await requireUser();
  const invitationId = String(formData.get("invitationId") ?? "");
  if (!invitationId) throw new Error("Invitation not found.");
  const now = new Date();
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, recipientId: user.id, status: InvitationStatus.PENDING },
    select: { id: true, expiresAt: true },
  });
  if (!invitation) throw new Error("This invitation is no longer available.");
  const status = invitation.expiresAt <= now ? InvitationStatus.EXPIRED : InvitationStatus.DECLINED;
  const changed = await prisma.invitation.updateMany({
    where: { id: invitation.id, recipientId: user.id, status: InvitationStatus.PENDING },
    data: { status, respondedAt: now },
  });
  if (changed.count !== 1) throw new Error("This invitation is no longer available.");
  refreshSharingViews();
}

export async function changeMemberRole(formData: FormData) {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const role = parseMemberRole(formData.get("role"));
  await requireListOwner(listId, user.id);
  const member = await prisma.listMember.findFirst({ where: { id: memberId, listId }, select: { id: true } });
  if (!member) throw new Error("List member not found.");
  await prisma.listMember.update({ where: { id: member.id }, data: { role } });
  refreshSharingViews();
}

export async function removeListMember(formData: FormData) {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  await requireListOwner(listId, user.id);
  const member = await prisma.listMember.findFirst({ where: { id: memberId, listId }, select: { id: true } });
  if (!member) throw new Error("List member not found.");
  await prisma.listMember.delete({ where: { id: member.id } });
  refreshSharingViews();
}

export async function revokeInvitation(formData: FormData) {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  const invitationId = String(formData.get("invitationId") ?? "");
  await requireListOwner(listId, user.id);
  const revoked = await prisma.invitation.updateMany({
    where: { id: invitationId, listId, status: InvitationStatus.PENDING },
    data: { status: InvitationStatus.REVOKED, respondedAt: new Date() },
  });
  if (revoked.count !== 1) throw new Error("This invitation is no longer pending.");
  refreshSharingViews();
}
