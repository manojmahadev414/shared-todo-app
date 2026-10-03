"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const data = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({ email: String(data.get("email")), password: String(data.get("password")), callbackURL: "/" });
    setBusy(false); if (result.error) setError(result.error.message ?? "Could not sign in."); else router.push("/");
  }
  async function signInWithGoogle() {
    setError("");
    const result = await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
    if (result.error) setError(result.error.message ?? "Google sign-in is not configured yet.");
  }
  return <main className="auth-page"><Link href="/" className="back-link">← Shared To-Do</Link><section className="auth-card"><p className="eyebrow">WELCOME BACK</p><h1>Pick up where<br/>you left off.</h1><p className="intro">Sign in to see what needs your attention.</p><button type="button" className="button button-secondary google-button" onClick={signInWithGoogle}>Continue with Google</button><div className="divider"><span>or use email</span></div><form onSubmit={submit} className="auth-form"><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><div className="auth-inline-links"><Link href="/forgot-password">Forgot password?</Link><Link href="/verify-email">Resend verification email</Link></div>{error && <p className="form-error">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form><div className="auth-switch">New here? <Link href="/sign-up">Create an account</Link></div></section></main>;
}
