import Link from "next/link";
import { InvitationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { acceptInvitation, declineInvitation } from "@/app/sharing/actions";
import { SignOutButton } from "@/app/dashboard/sign-out-button";

export default async function InvitationsPage() {
  const user = await requireUser();
  const invitations = await prisma.invitation.findMany({
    where: { recipientId: user.id, status: InvitationStatus.PENDING },
    include: { list: { select: { name: true } }, sender: { select: { name: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();

  return <main className="dashboard-shell">
    <header className="dashboard-header"><Link href="/dashboard" className="dashboard-brand"><span className="brand-mark small-mark">✓</span> Shared To-Do</Link><div className="user-area"><Link href="/dashboard" className="back-link">My lists</Link><span>{user.name}</span><SignOutButton /></div></header>
    <section className="invitations-heading"><p className="eyebrow">SHARED WITH YOU</p><h1>Invitations</h1><p className="intro">Lists you join will show up on your dashboard after you accept.</p></section>
    {invitations.length === 0 ? <section className="invitation-empty"><span aria-hidden="true">✉</span><h2>You’re all caught up</h2><p>New list invitations will appear here.</p></section> : <section className="invitation-list" aria-label="Pending invitations">{invitations.map((invitation) => {
      const expired = invitation.expiresAt <= now;
      const roleLabel = invitation.role === "EDITOR" ? "Can edit tasks" : "Can view tasks";
      return <article className={`invitation-card ${expired ? "invitation-expired" : ""}`} key={invitation.id}>
        <div className="invitation-avatar" aria-hidden="true">{invitation.sender.name.slice(0, 1).toUpperCase()}</div>
        <div className="invitation-copy"><p><strong>{invitation.sender.name}</strong> <span>@{invitation.sender.username}</span> invited you to</p><h2>{invitation.list.name}</h2><small>{roleLabel} · Expires {invitation.expiresAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></div>
        {expired ? <span className="expired-label">Expired</span> : <div className="invitation-actions"><form action={declineInvitation}><input type="hidden" name="invitationId" value={invitation.id}/><button className="decline-invitation">Decline</button></form><form action={acceptInvitation}><input type="hidden" name="invitationId" value={invitation.id}/><button className="button button-primary accept-invitation">Accept</button></form></div>}
      </article>;
    })}</section>}
  </main>;
}
