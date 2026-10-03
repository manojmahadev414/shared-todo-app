import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { WorkspaceHeader } from "@/app/dashboard/workspace-header";
import { AccountSettingsForm } from "./account-settings-form";

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, username: true, email: true, emailVerified: true } });
  if (!user) notFound();

  return <main className="dashboard-shell profile-shell"><WorkspaceHeader userId={sessionUser.id} name={user.name} active="account"/><section className="profile-heading"><p className="eyebrow">YOUR ACCOUNT</p><h1>Account settings</h1><p className="intro">Manage your profile, email address, and password.</p></section><AccountSettingsForm name={user.name} username={user.username ?? ""} email={user.email} emailVerified={user.emailVerified} /></main>;
}
