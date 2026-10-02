import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createList, createTask, toggleTask } from "./actions";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const user = await requireUser();
  const lists = await prisma.taskList.findMany({
    where: { OR: [{ ownerId: user.id }, { memberships: { some: { userId: user.id } } }] },
    include: {
      tasks: { orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }] },
      memberships: { where: { userId: user.id }, select: { role: true } },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  const openCount = lists.reduce((total, list) => total + list.tasks.filter((task) => !task.completedAt).length, 0);
  return <main className="dashboard-shell">
    <header className="dashboard-header"><Link href="/" className="dashboard-brand"><span className="brand-mark small-mark">✓</span> Shared To-Do</Link><div className="user-area"><span>{user.name}</span><SignOutButton /></div></header>
    <section className="dashboard-heading"><div><p className="eyebrow">YOUR SPACE</p><h1>Good to see you, {user.name.split(" ")[0]}.</h1><p className="intro">{openCount ? `You have ${openCount} open ${openCount === 1 ? "task" : "tasks"} across your lists.` : "Everything is caught up. Add a task when you’re ready."}</p></div><form action={createList} className="new-list-form"><input name="name" aria-label="New list name" placeholder="Name a new list" maxLength={100} required /><button className="button button-primary">Add list</button></form></section>
    {lists.length === 0 ? <p className="empty-state">Your lists will appear here.</p> : <section className="list-grid" aria-label="Your task lists">{lists.map((list) => {
      const role = list.ownerId === user.id ? "OWNER" : list.memberships[0]?.role ?? "VIEWER";
      const canEdit = role === "OWNER" || role === "EDITOR";
      const remaining = list.tasks.filter((task) => !task.completedAt).length;
      return <article className="list-card" key={list.id}><header className="list-card-header"><div><h2>{list.name}</h2><p>{remaining} open · {role.toLowerCase()}</p></div><span className="list-dot" aria-hidden="true"></span></header><div className="task-list">{list.tasks.length === 0 && <p className="list-empty">Nothing here yet.</p>}{list.tasks.map((task) => <div className={`task-row ${task.completedAt ? "task-done" : ""}`} key={task.id}>{canEdit ? <form action={toggleTask}><input type="hidden" name="taskId" value={task.id}/><button className="task-check" aria-label={task.completedAt ? "Mark task incomplete" : "Complete task"}>{task.completedAt ? "✓" : ""}</button></form> : <span className="task-check static-check">{task.completedAt ? "✓" : ""}</span>}<span>{task.title}</span>{task.dueAt && <time>{task.dueAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>}</div>)}</div>{canEdit && <form action={createTask} className="new-task-form"><input type="hidden" name="listId" value={list.id}/><input name="title" placeholder="Add a task…" aria-label={`Add task to ${list.name}`} maxLength={200} required/><button aria-label="Add task">+</button></form>}</article>;
    })}</section>}
  </main>;
}
