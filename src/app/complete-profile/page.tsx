import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { CompleteProfileForm } from "./complete-profile-form";

export default async function CompleteProfilePage() {
  const user = await requireUser({ allowIncompleteProfile: true });
  if (user.username) redirect("/dashboard");

  return <main className="auth-page"><Link href="/" className="back-link">← Shared To-Do</Link><section className="auth-card"><p className="eyebrow">ONE LAST STEP</p><h1>Choose your<br/>username.</h1><p className="intro">Your username helps friends find you when they invite you to a shared list.</p><CompleteProfileForm /></section></main>;
}
