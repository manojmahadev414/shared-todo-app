"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="auth-page" />}><VerifyEmailForm /></Suspense>;
}

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    const result = await authClient.sendVerificationEmail({ email, callbackURL: "/" });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Could not send the verification email.");
    else setMessage("If this address has an account that needs verification, a link is on its way.");
  }

  return <main className="auth-page"><Link href="/" className="back-link">← Shared To-Do</Link><section className="auth-card"><p className="eyebrow">CHECK YOUR INBOX</p><h1>Verify your<br/>email.</h1><p className="intro">We’ll send a link to confirm your address. The link expires after one hour.</p><form onSubmit={submit} className="auth-form"><label>Email address<input name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>{message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? "Sending…" : "Send verification link"}</button></form><div className="auth-switch"><Link href="/sign-in">Back to sign in</Link></div></section></main>;
}
