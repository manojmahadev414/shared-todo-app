import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { TaskItem } from "@/app/dashboard/task-item";
import { WorkspaceHeader } from "@/app/dashboard/workspace-header";

type View = "today" | "upcoming";

function dateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function DueTaskView({ view }: { view: View }) {
  const user = await requireUser();
  const timeZone = process.env.APP_TIME_ZONE || "Asia/Kolkata";
  const todayKey = dateKey(new Date(), timeZone);
  const tasks = await prisma.task.findMany({
    where: {
      completedAt: null,
      dueAt: { not: null },
      list: { OR: [{ ownerId: user.id }, { memberships: { some: { userId: user.id } } }] },
    },
    include: {
      list: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          memberships: { where: { userId: user.id }, select: { role: true } },
        },
      },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });

  const filtered = tasks.filter((task) => {
    const key = task.dueAt!.toISOString().slice(0, 10);
    return view === "today" ? key <= todayKey : key > todayKey;
  });
  const groups = view === "today"
    ? [
        { key: "overdue", title: "Overdue", tasks: filtered.filter((task) => task.dueAt!.toISOString().slice(0, 10) < todayKey) },
        { key: "today", title: "Due today", tasks: filtered.filter((task) => task.dueAt!.toISOString().slice(0, 10) === todayKey) },
      ].filter((group) => group.tasks.length > 0)
    : [...new Set(filtered.map((task) => task.dueAt!.toISOString().slice(0, 10)))].map((key) => ({
        key,
        title: new Date(`${key}T12:00:00.000Z`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }),
        tasks: filtered.filter((task) => task.dueAt!.toISOString().slice(0, 10) === key),
      }));

  const count = filtered.length;
  const title = view === "today" ? "Today" : "Upcoming";
  const intro = view === "today"
    ? "Overdue tasks and tasks due today, across your shared lists."
    : "Open tasks due after today, across your shared lists.";

  return <main className="dashboard-shell"><WorkspaceHeader userId={user.id} name={user.name} active={view}/>
    <section className="due-tasks-heading"><p className="eyebrow">YOUR TASKS</p><h1>{title}</h1><p className="intro">{intro}</p><p className="due-task-count">{count} open {count === 1 ? "task" : "tasks"}</p></section>
    {groups.length === 0 ? <section className="invitation-empty due-task-empty"><span aria-hidden="true">✓</span><h2>{view === "today" ? "Nothing due today" : "Nothing coming up"}</h2><p>{view === "today" ? "You’re clear of overdue and due-today tasks." : "Add a due date to a task and it’ll show up here."}</p></section> : <div className="due-task-groups">{groups.map((group) => <section className="due-task-group" key={group.key}><header><h2>{group.title}</h2><span>{group.tasks.length}</span></header><div className="due-task-list">{group.tasks.map((task) => {
      const membership = task.list.memberships[0];
      const canEdit = task.list.ownerId === user.id || membership?.role === "EDITOR";
      return <article className="due-task-row" key={task.id}><div className="due-task-list-name">{task.list.name}</div><TaskItem task={task} canEdit={canEdit}/></article>;
    })}</div></section>)}</div>}
  </main>;
}
