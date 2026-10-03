import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createList, createTask } from "./actions";
import { ListSharing } from "./list-sharing";
import { MasonryGrid } from "./masonry-grid";
import { TaskItem } from "./task-item";
import { ListLifecycleControls } from "./list-lifecycle-controls";
import { WorkspaceHeader } from "./workspace-header";

function NewTaskForm({ listId, listName }: { listId: string; listName: string }) {
  return <form action={createTask} className="new-task-form"><input type="hidden" name="listId" value={listId}/><div className="new-task-main"><input name="title" placeholder="Add a task…" aria-label={`Add task to ${listName}`} maxLength={200} required/><button aria-label="Add task">+</button></div><details className="task-extra-fields"><summary>Description, due date, priority</summary><label>Description<textarea name="description" maxLength={5000} rows={2} placeholder="Add a little more detail"/></label><div className="task-edit-fields"><label>Due date<input type="date" name="dueAt"/></label><label>Priority<select name="priority" defaultValue="NORMAL"><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option></select></label></div></details></form>;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const lists = await prisma.taskList.findMany({
    where: { OR: [{ ownerId: user.id }, { memberships: { some: { userId: user.id } } }] },
    include: {
      tasks: { orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }] },
      memberships: { include: { user: { select: { name: true, username: true } } } },
      invitations: { where: { status: "PENDING", expiresAt: { gt: now } }, include: { recipient: { select: { name: true, username: true } } }, orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  const openCount = lists.reduce((total, list) => total + list.tasks.filter((task) => !task.completedAt).length, 0);
  return <main className="dashboard-shell">
    <WorkspaceHeader userId={user.id} name={user.name} active="lists"/>
    <section className="dashboard-heading"><div><p className="eyebrow">YOUR SPACE</p><h1>Good to see you, {user.name.split(" ")[0]}.</h1><p className="intro">{openCount ? `You have ${openCount} open ${openCount === 1 ? "task" : "tasks"} across your lists.` : "Everything is caught up. Add a task when you’re ready."}</p></div><form action={createList} className="new-list-form"><input name="name" aria-label="New list name" placeholder="Name a new list" maxLength={100} required /><button className="button button-primary">Add list</button></form></section>
    {lists.length === 0 ? <p className="empty-state">Your lists will appear here.</p> : <MasonryGrid>{lists.map((list) => {
      const role = list.ownerId === user.id ? "OWNER" : list.memberships.find((member) => member.userId === user.id)?.role ?? "VIEWER";
      const canEdit = role === "OWNER" || role === "EDITOR";
      const remaining = list.tasks.filter((task) => !task.completedAt).length;
      return <article className="list-card" key={list.id}><header className="list-card-header"><div><h2>{list.name}</h2><p>{remaining} open · {role.toLowerCase()}</p></div><span className="list-dot" aria-hidden="true"></span></header><div className="task-list">{list.tasks.length === 0 && <p className="list-empty">Nothing here yet.</p>}{list.tasks.map((task) => <TaskItem key={task.id} task={task} canEdit={canEdit}/>)}</div>{canEdit && <NewTaskForm listId={list.id} listName={list.name}/>} {role === "OWNER" && <ListSharing listId={list.id} members={list.memberships} invitations={list.invitations}/>}<ListLifecycleControls listId={list.id} listName={list.name} isOwner={role === "OWNER"} isDefault={list.isDefault} members={list.memberships}/></article>;
    })}</MasonryGrid>}
  </main>;
}
