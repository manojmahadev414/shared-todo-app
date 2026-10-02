"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    const data = new FormData(event.currentTarget);
    const result = await authClient.requestPasswordReset({ email: String(data.get("email")), redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Could not request a password reset.");
    else setMessage("If an account uses this address, a password reset link is on its way.");
  }

  return <main className="auth-page"><Link href="/sign-in" className="back-link">← Sign in</Link><section className="auth-card"><p className="eyebrow">ACCOUNT RECOVERY</p><h1>Forgot your<br/>password?</h1><p className="intro">Enter your account email and we’ll send a reset link if it matches an account.</p><form onSubmit={submit} className="auth-form"><label>Email address<input name="email" type="email" autoComplete="email" required /></label>{message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button></form><div className="auth-switch"><Link href="/verify-email">Need a verification link?</Link></div></section></main>;
}
