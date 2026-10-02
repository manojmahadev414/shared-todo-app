"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTask } from "./actions";
import { DeleteTaskForm } from "./delete-task-form";

type Priority = "LOW" | "NORMAL" | "HIGH";
type TaskValues = { title: string; description: string; dueAt: string; priority: Priority };

export function TaskEditor({ taskId, title, description, dueAt, priority }: {
  taskId: string;
  title: string;
  description: string;
  dueAt: string;
  priority: Priority;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const savedValues = useRef<TaskValues>({ title, description, dueAt, priority });
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [outsideClickBlocked, setOutsideClickBlocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      if (hasUnsavedChanges) setOutsideClickBlocked(true);
      else setIsOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (hasUnsavedChanges) setOutsideClickBlocked(true);
      else setIsOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [hasUnsavedChanges, isOpen]);

  function updateDirtyState() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const saved = savedValues.current;
    const dirty = String(data.get("title") ?? "") !== saved.title
      || String(data.get("description") ?? "") !== saved.description
      || String(data.get("dueAt") ?? "") !== saved.dueAt
      || String(data.get("priority") ?? "NORMAL") !== saved.priority;
    setHasUnsavedChanges(dirty);
    if (!dirty) setOutsideClickBlocked(false);
  }

  function restoreSavedValues() {
    const form = formRef.current;
    if (!form) return;
    const saved = savedValues.current;
    (form.elements.namedItem("title") as HTMLInputElement).value = saved.title;
    (form.elements.namedItem("description") as HTMLTextAreaElement).value = saved.description;
    (form.elements.namedItem("dueAt") as HTMLInputElement).value = saved.dueAt;
    (form.elements.namedItem("priority") as HTMLSelectElement).value = saved.priority;
  }

  function discardChanges() {
    restoreSavedValues();
    setHasUnsavedChanges(false);
    setOutsideClickBlocked(false);
    setError("");
    setIsOpen(false);
  }

  async function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await updateTask(data);
      savedValues.current = {
        title: String(data.get("title") ?? "").trim(),
        description: String(data.get("description") ?? "").trim(),
        dueAt: String(data.get("dueAt") ?? ""),
        priority: String(data.get("priority") ?? "NORMAL") as Priority,
      };
      setHasUnsavedChanges(false);
      setOutsideClickBlocked(false);
      setIsOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save task changes.");
    } finally {
      setIsSaving(false);
    }
  }

  return <div className="task-edit-control" ref={rootRef}>
    <button type="button" className="task-menu-button" aria-expanded={isOpen} aria-controls={`task-editor-${taskId}`} onClick={() => {
      if (isOpen) {
        if (hasUnsavedChanges) setOutsideClickBlocked(true);
        else setIsOpen(false);
      } else {
        setError("");
        setOutsideClickBlocked(false);
        setIsOpen(true);
      }
    }}>Edit</button>
    {isOpen && <div id={`task-editor-${taskId}`} className={`task-editor ${outsideClickBlocked ? "task-editor-blocked" : ""}`}>
      {outsideClickBlocked && <p className="unsaved-warning" role="alert">You have unsaved changes. Save or discard them before closing.</p>}
      <form ref={formRef} onSubmit={saveChanges} onChange={updateDirtyState} className="task-edit-form">
        <input type="hidden" name="taskId" value={taskId}/>
        <label>Title<input name="title" defaultValue={title} maxLength={200} required/></label>
        <label>Description<textarea name="description" defaultValue={description} maxLength={5000} rows={3}/></label>
        <div className="task-edit-fields"><label>Due date<input type="date" name="dueAt" defaultValue={dueAt}/></label><label>Priority<select name="priority" defaultValue={priority}><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option></select></label></div>
        {error && <p className="task-save-error" role="alert">{error}</p>}
        <div className="task-editor-actions"><button className="button button-primary save-task-button" disabled={isSaving}>{isSaving ? "Saving…" : "Save changes"}</button><button type="button" className="discard-task-button" onClick={discardChanges}>Discard changes</button></div>
      </form>
      <DeleteTaskForm taskId={taskId}/>
    </div>}
  </div>;
}
