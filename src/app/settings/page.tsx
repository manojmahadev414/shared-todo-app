import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ProfileMenu } from "@/app/dashboard/profile-menu";
import { AccountSettingsForm } from "./account-settings-form";

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, username: true, email: true, emailVerified: true } });
  if (!user) notFound();

  return <main className="dashboard-shell profile-shell"><header className="dashboard-header"><Link href="/dashboard" className="dashboard-brand"><span className="brand-mark small-mark">✓</span> Shared To-Do</Link><div className="user-area"><Link href="/dashboard" className="dashboard-nav-icon" aria-label="My lists" title="My lists"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg></Link><ProfileMenu name={user.name}/></div></header><section className="profile-heading"><p className="eyebrow">YOUR ACCOUNT</p><h1>Account settings</h1><p className="intro">Manage your profile, email address, and password.</p></section><AccountSettingsForm name={user.name} username={user.username ?? ""} email={user.email} emailVerified={user.emailVerified} /></main>;
}
