import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ProfileMenu } from "@/app/dashboard/profile-menu";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, username: true, displayUsername: true, email: true, image: true, createdAt: true },
  });
  if (!user) notFound();

  const joinedDate = user.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const initial = user.name.trim().charAt(0).toUpperCase();

  return <main className="dashboard-shell profile-shell">
    <header className="dashboard-header"><Link href="/dashboard" className="dashboard-brand"><span className="brand-mark small-mark">✓</span> Shared To-Do</Link><div className="user-area"><Link href="/dashboard" className="dashboard-nav-icon" aria-label="My lists" title="My lists"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg></Link><ProfileMenu name={user.name}/></div></header>
    <section className="profile-heading"><p className="eyebrow">YOUR ACCOUNT</p><h1>Profile</h1><p className="intro">Your account details in one place.</p></section>
    <section className="profile-card" aria-label="Your profile details">
      <div className="profile-identity">
        <div className="profile-avatar">{user.image ? <Image src={user.image} alt={`${user.name}'s avatar`} width={104} height={104} unoptimized/> : <span>{initial || "?"}</span>}</div>
        <div><p className="eyebrow">PROFILE</p><h2>{user.name}</h2><p className="profile-username">@{user.displayUsername || user.username}</p></div>
      </div>
      <dl className="profile-details">
        <div><dt>Name</dt><dd>{user.name}</dd></div>
        <div><dt>Username</dt><dd>@{user.displayUsername || user.username}</dd></div>
        <div><dt>Email address</dt><dd>{user.email}</dd></div>
        <div><dt>Date joined</dt><dd><time dateTime={user.createdAt.toISOString()}>{joinedDate}</time></dd></div>
      </dl>
    </section>
  </main>;
}
