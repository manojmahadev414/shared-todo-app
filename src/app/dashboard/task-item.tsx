import { Task, TaskPriority } from "@prisma/client";
import { toggleTask } from "./actions";
import { TaskEditor } from "./task-editor";
import { CheckIcon } from "@/app/icons";
import { SubmitButton } from "@/app/submit-button";

const priorityLabels: Record<TaskPriority, string> = { LOW: "Low", NORMAL: "Normal", HIGH: "High" };

export function TaskItem({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const dueDateValue = task.dueAt ? task.dueAt.toISOString().slice(0, 10) : "";
  return <div className={`task-item ${task.completedAt ? "task-done" : ""}`}>
    <div className="task-row">
      {canEdit ? <form action={toggleTask}><input type="hidden" name="taskId" value={task.id}/><SubmitButton stayEnabled className="task-check" aria-label={task.completedAt ? "Mark task incomplete" : "Complete task"}>{task.completedAt ? <CheckIcon/> : null}</SubmitButton></form> : <span className="task-check static-check" aria-hidden="true">{task.completedAt ? <CheckIcon/> : null}</span>}
      <span className="task-title">{task.title}</span>
      <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span>
      {task.dueAt && <time dateTime={dueDateValue}>{task.dueAt.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}</time>}
      {canEdit && <TaskEditor taskId={task.id} title={task.title} description={task.description ?? ""} dueAt={dueDateValue} priority={task.priority}/>}
    </div>
    {task.description && <p className="task-description">{task.description}</p>}
  </div>;
}
