"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const data = new FormData(event.currentTarget);
    const result = await authClient.signUp.email({ name: String(data.get("name")), email: String(data.get("email")), password: String(data.get("password")), username: String(data.get("username")), callbackURL: "/" });
    setBusy(false); if (result.error) setError(result.error.message ?? "Could not create account."); else router.push("/");
  }
  async function signUpWithGoogle() {
    setError("");
    const result = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    if (result.error) setError(result.error.message ?? "Google sign-in is not configured yet.");
  }
  return <main className="auth-page"><Link href="/" className="back-link">← Shared To-Do</Link><section className="auth-card"><p className="eyebrow">GET STARTED</p><h1>A little more<br/>in sync.</h1><p className="intro">Create an account to start your own list and share it when you’re ready.</p><button type="button" className="button button-secondary google-button" onClick={signUpWithGoogle}>Continue with Google</button><div className="divider"><span>or use email</span></div><form onSubmit={submit} className="auth-form"><label>Your name<input name="name" autoComplete="name" required /></label><label>Username<input name="username" autoComplete="username" minLength={3} maxLength={32} required /><span className="field-hint">Friends can use this to invite you.</span></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>{error && <p className="form-error">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button></form><div className="auth-switch">Already have an account? <Link href="/sign-in">Sign in</Link></div></section></main>;
}
