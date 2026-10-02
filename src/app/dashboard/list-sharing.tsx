"use client";

import { useEffect, useRef, useState } from "react";
import { changeMemberRole, revokeInvitation, sendInvitation } from "@/app/sharing/actions";
import { RemoveMemberButton } from "./remove-member-button";

type Role = "OWNER" | "EDITOR" | "VIEWER";
type Member = { id: string; role: Role; user: { name: string; username: string } };
type PendingInvitation = { id: string; role: Role; expiresAt: Date; recipient: { name: string; username: string } };

export function ListSharing({ listId, members, invitations }: {
  listId: string;
  members: Member[];
  invitations: PendingInvitation[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelId = `list-sharing-${listId}`;

  useEffect(() => {
    if (!isOpen || !contentRef.current) return;
    const content = contentRef.current;
    const observer = new ResizeObserver(() => setPanelHeight(content.scrollHeight));
    observer.observe(content);
    setPanelHeight(content.scrollHeight);
    return () => observer.disconnect();
  }, [isOpen, members.length, invitations.length]);

  function togglePanel() {
    if (isOpen) {
      const visibleHeight = panelRef.current?.getBoundingClientRect().height ?? panelHeight;
      setPanelHeight(visibleHeight);
      requestAnimationFrame(() => {
        setPanelHeight(0);
        setIsOpen(false);
      });
    } else {
      setIsOpen(true);
      requestAnimationFrame(() => setPanelHeight(contentRef.current?.scrollHeight ?? 0));
    }
  }

  return <section className="sharing-panel">
    <button type="button" className="sharing-toggle" aria-expanded={isOpen} aria-controls={panelId} onClick={togglePanel}>
      <span>Share and members</span><span className="sharing-count">{members.length + invitations.length}</span><span className={`sharing-chevron ${isOpen ? "sharing-chevron-open" : ""}`} aria-hidden="true"/>
    </button>
    <div id={panelId} ref={panelRef} className="sharing-content" aria-hidden={!isOpen} inert={!isOpen} style={{ height: `${panelHeight}px` }}>
      <div ref={contentRef} className="sharing-content-inner">
        <form action={sendInvitation} className="invite-form">
          <input type="hidden" name="listId" value={listId}/>
          <label>Invite by username<input name="username" placeholder="username" minLength={3} maxLength={32} required/></label>
          <div className="invite-controls"><label>Access<select name="role" defaultValue="VIEWER"><option value="VIEWER">Viewer</option><option value="EDITOR">Editor</option></select></label><button className="button button-primary invite-submit">Send invite</button></div>
        </form>

        {members.length > 0 && <div className="sharing-section"><h3>Members</h3>{members.map((member) => <div className="member-row" key={member.id}>
          <div className="member-identity"><strong>{member.user.name}</strong><span>@{member.user.username}</span></div>
          <form action={changeMemberRole} className="member-role-form"><input type="hidden" name="listId" value={listId}/><input type="hidden" name="memberId" value={member.id}/><select aria-label={`Access for ${member.user.username}`} name="role" defaultValue={member.role}><option value="VIEWER">Viewer</option><option value="EDITOR">Editor</option></select><button>Save</button></form>
          <RemoveMemberButton listId={listId} memberId={member.id} name={member.user.name} username={member.user.username}/>
        </div>)}</div>}

        {invitations.length > 0 && <div className="sharing-section"><h3>Pending invitations</h3>{invitations.map((invitation) => <div className="pending-invite-row" key={invitation.id}><div><strong>@{invitation.recipient.username}</strong><span>{invitation.role === "EDITOR" ? "Editor" : "Viewer"} · expires {invitation.expiresAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></div><form action={revokeInvitation}><input type="hidden" name="listId" value={listId}/><input type="hidden" name="invitationId" value={invitation.id}/><button className="remove-member-button">Revoke</button></form></div>)}</div>}
      </div>
    </div>
  </section>;
}
