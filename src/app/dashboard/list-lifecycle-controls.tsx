"use client";

import { useEffect, useRef, useState } from "react";
import { deleteList, leaveList, transferListOwnership } from "./actions";

type Member = { id: string; userId: string; user: { name: string; username: string | null } };

export function ListLifecycleControls({ listId, listName, isOwner, isDefault, members }: {
  listId: string;
  listName: string;
  isOwner: boolean;
  isDefault: boolean;
  members: Member[];
}) {
  const [dialog, setDialog] = useState<"transfer" | "leave" | "delete" | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const eligibleMembers = members;

  useEffect(() => {
    if (!dialog) return;
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDialog(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialog]);

  const headingId = `list-lifecycle-title-${listId}`;
  const descriptions = {
    transfer: "Ownership will move to the selected member. You will remain an editor, and pending invitations will be revoked.",
    leave: "You will lose access to this list and its tasks.",
    delete: "This permanently deletes the list, its tasks, and its memberships.",
  };
  const titles = { transfer: "Transfer ownership?", leave: `Leave ${listName}?`, delete: `Delete ${listName}?` };
  const confirmLabels = { transfer: "Transfer ownership", leave: "Leave list", delete: "Delete list" };
  const actions = { transfer: transferListOwnership, leave: leaveList, delete: deleteList };

  return <>
    <div className="list-lifecycle-controls">
      {isOwner && !isDefault ? <>
        {eligibleMembers.length > 0 && <form action={transferListOwnership} className="list-transfer-form">
          <input type="hidden" name="listId" value={listId}/>
          <label>Transfer ownership<select name="memberId" value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} required aria-label={`Transfer ownership of ${listName}`}>
            <option value="" disabled>Choose a member</option>
            {eligibleMembers.map((member) => <option value={member.id} key={member.id}>{member.user.username ? `@${member.user.username}` : member.user.name}</option>)}
          </select></label>
          <button type="button" className="list-action-button" disabled={!selectedMemberId} onClick={() => setDialog("transfer")}>Transfer</button>
        </form>}
        <button type="button" className="list-action-button list-danger-action" onClick={() => setDialog("delete")}>Delete list</button>
      </> : !isOwner && <button type="button" className="list-action-button list-danger-action" onClick={() => setDialog("leave")}>Leave list</button>}
      {isOwner && isDefault && <p className="list-lifecycle-note">Your default list cannot be transferred or deleted.</p>}
    </div>
    {dialog && <div className="confirmation-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
      <section className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby={headingId}>
        <span className="confirmation-icon" aria-hidden="true">!</span>
        <h2 id={headingId}>{titles[dialog]}</h2>
        <p>{descriptions[dialog]}</p>
        <div className="confirmation-actions">
          <button ref={cancelRef} type="button" className="cancel-delete-button" onClick={() => setDialog(null)}>Cancel</button>
          <form action={actions[dialog]}>
            <input type="hidden" name="listId" value={listId}/>
            {dialog === "transfer" && <input type="hidden" name="memberId" value={selectedMemberId}/>}
            <button className="confirm-delete-button">{confirmLabels[dialog]}</button>
          </form>
        </div>
      </section>
    </div>}
  </>;
}
