import Link from "next/link";
import { InvitationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ProfileMenu } from "./profile-menu";

type ActivePage = "lists" | "today" | "upcoming" | "invitations" | "account";

export async function WorkspaceHeader({ userId, name, active }: { userId: string; name: string; active: ActivePage }) {
  const pendingInvitations = await prisma.invitation.count({
    where: { recipientId: userId, status: InvitationStatus.PENDING, expiresAt: { gt: new Date() } },
  });

  return <header className="workspace-header">
    <Link href="/dashboard" className="dashboard-brand"><span className="brand-mark small-mark">✓</span><span>Shared To-Do</span></Link>
    <nav className="workspace-nav" aria-label="Workspace">
      <Link href="/dashboard" aria-current={active === "lists" ? "page" : undefined}>My lists</Link>
      <Link href="/today" aria-current={active === "today" ? "page" : undefined}>Today</Link>
      <Link href="/upcoming" aria-current={active === "upcoming" ? "page" : undefined}>Upcoming</Link>
    </nav>
    <div className="workspace-actions">
      <Link href="/invitations" className={`invitation-link ${active === "invitations" ? "invitation-link-active" : ""}`} aria-label={pendingInvitations > 0 ? `Invitations, ${pendingInvitations} pending` : "Invitations"} title="Invitations">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
        {pendingInvitations > 0 && <span>{pendingInvitations}</span>}
      </Link>
      <ProfileMenu name={name}/>
    </div>
  </header>;
}
