"use client";

import { useEffect, useRef, useState } from "react";
import { removeListMember } from "@/app/sharing/actions";

export function RemoveMemberButton({ listId, memberId, name, username }: {
  listId: string;
  memberId: string;
  name: string;
  username: string;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isConfirming) return;
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsConfirming(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isConfirming]);

  const titleId = `remove-member-title-${memberId}`;
  const descriptionId = `remove-member-description-${memberId}`;

  return <>
    <button type="button" className="remove-member-button" aria-label={`Remove ${username}`} onClick={() => setIsConfirming(true)}>Remove</button>
    {isConfirming && <div className="confirmation-overlay">
      <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <span className="confirmation-icon" aria-hidden="true">!</span>
        <h2 id={titleId}>Remove {name}?</h2>
        <p id={descriptionId}>@{username} will lose access to this list and its tasks.</p>
        <div className="confirmation-actions">
          <button ref={cancelRef} type="button" className="cancel-delete-button" onClick={() => setIsConfirming(false)}>Keep member</button>
          <form action={removeListMember}><input type="hidden" name="listId" value={listId}/><input type="hidden" name="memberId" value={memberId}/><button className="confirm-delete-button">Remove member</button></form>
        </div>
      </section>
    </div>}
  </>;
}
