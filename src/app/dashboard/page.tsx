import Link from "next/link";
import { Task, TaskPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createList, createTask, toggleTask } from "./actions";
import { SignOutButton } from "./sign-out-button";
import { TaskEditor } from "./task-editor";
import { ListSharing } from "./list-sharing";
import { MasonryGrid } from "./masonry-grid";

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
};

function TaskItem({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const dueDateValue = task.dueAt ? task.dueAt.toISOString().slice(0, 10) : "";
  return <div className={`task-item ${task.completedAt ? "task-done" : ""}`}>
    <div className="task-row">
      {canEdit ? <form action={toggleTask}><input type="hidden" name="taskId" value={task.id}/><button className="task-check" aria-label={task.completedAt ? "Mark task incomplete" : "Complete task"}>{task.completedAt ? "✓" : ""}</button></form> : <span className="task-check static-check" aria-hidden="true">{task.completedAt ? "✓" : ""}</span>}
      <span className="task-title">{task.title}</span>
      <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span>
      {task.dueAt && <time dateTime={dueDateValue}>{task.dueAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>}
      {canEdit && <TaskEditor taskId={task.id} title={task.title} description={task.description ?? ""} dueAt={dueDateValue} priority={task.priority}/>}
    </div>
    {task.description && <p className="task-description">{task.description}</p>}
  </div>;
}

function NewTaskForm({ listId, listName }: { listId: string; listName: string }) {
  return <form action={createTask} className="new-task-form"><input type="hidden" name="listId" value={listId}/><div className="new-task-main"><input name="title" placeholder="Add a task…" aria-label={`Add task to ${listName}`} maxLength={200} required/><button aria-label="Add task">+</button></div><details className="task-extra-fields"><summary>Description, due date, priority</summary><label>Description<textarea name="description" maxLength={5000} rows={2} placeholder="Add a little more detail"/></label><div className="task-edit-fields"><label>Due date<input type="date" name="dueAt"/></label><label>Priority<select name="priority" defaultValue="NORMAL"><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option></select></label></div></details></form>;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const [lists, pendingInvitationCount] = await Promise.all([prisma.taskList.findMany({
    where: { OR: [{ ownerId: user.id }, { memberships: { some: { userId: user.id } } }] },
    include: {
      tasks: { orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }] },
      memberships: { include: { user: { select: { name: true, username: true } } } },
      invitations: { where: { status: "PENDING", expiresAt: { gt: now } }, include: { recipient: { select: { name: true, username: true } } }, orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  }), prisma.invitation.count({ where: { recipientId: user.id, status: "PENDING", expiresAt: { gt: now } } })]);
  const openCount = lists.reduce((total, list) => total + list.tasks.filter((task) => !task.completedAt).length, 0);
  return <main className="dashboard-shell">
    <header className="dashboard-header"><Link href="/" className="dashboard-brand"><span className="brand-mark small-mark">✓</span> Shared To-Do</Link><div className="user-area"><Link href="/invitations" className="invitation-link">Invitations{pendingInvitationCount > 0 && <span>{pendingInvitationCount}</span>}</Link><Link href="/profile" className="profile-nav-link" aria-label="Open profile" title="Profile"><span>{user.name.trim().charAt(0).toUpperCase() || "?"}</span></Link><SignOutButton /></div></header>
    <section className="dashboard-heading"><div><p className="eyebrow">YOUR SPACE</p><h1>Good to see you, {user.name.split(" ")[0]}.</h1><p className="intro">{openCount ? `You have ${openCount} open ${openCount === 1 ? "task" : "tasks"} across your lists.` : "Everything is caught up. Add a task when you’re ready."}</p></div><form action={createList} className="new-list-form"><input name="name" aria-label="New list name" placeholder="Name a new list" maxLength={100} required /><button className="button button-primary">Add list</button></form></section>
    {lists.length === 0 ? <p className="empty-state">Your lists will appear here.</p> : <MasonryGrid>{lists.map((list) => {
      const role = list.ownerId === user.id ? "OWNER" : list.memberships.find((member) => member.userId === user.id)?.role ?? "VIEWER";
      const canEdit = role === "OWNER" || role === "EDITOR";
      const remaining = list.tasks.filter((task) => !task.completedAt).length;
      return <article className="list-card" key={list.id}><header className="list-card-header"><div><h2>{list.name}</h2><p>{remaining} open · {role.toLowerCase()}</p></div><span className="list-dot" aria-hidden="true"></span></header><div className="task-list">{list.tasks.length === 0 && <p className="list-empty">Nothing here yet.</p>}{list.tasks.map((task) => <TaskItem key={task.id} task={task} canEdit={canEdit}/>)}</div>{canEdit && <NewTaskForm listId={list.id} listName={list.name}/>} {role === "OWNER" && <ListSharing listId={list.id} members={list.memberships} invitations={list.invitations}/>}</article>;
    })}</MasonryGrid>}
  </main>;
}
