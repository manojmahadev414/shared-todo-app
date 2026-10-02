"use client";

import { useEffect, useRef, useState } from "react";
import { deleteTask } from "./actions";

export function DeleteTaskForm({ taskId }: { taskId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isConfirming) return;
    cancelButtonRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsConfirming(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isConfirming]);

  return <>
    <div className="delete-task-form"><button type="button" className="delete-task-button" onClick={() => setIsConfirming(true)}>Delete task</button></div>
    {isConfirming && <div className="confirmation-overlay">
      <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby={`delete-title-${taskId}`} aria-describedby={`delete-description-${taskId}`}>
        <span className="confirmation-icon" aria-hidden="true">!</span>
        <h2 id={`delete-title-${taskId}`}>Delete this task?</h2>
        <p id={`delete-description-${taskId}`}>This task will be permanently removed from the list.</p>
        <div className="confirmation-actions">
          <button ref={cancelButtonRef} type="button" className="cancel-delete-button" onClick={() => setIsConfirming(false)}>Cancel</button>
          <form action={deleteTask}><input type="hidden" name="taskId" value={taskId}/><button className="confirm-delete-button">Delete task</button></form>
        </div>
      </section>
    </div>}
  </>;
}
