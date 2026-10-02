"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="auth-page" />}><ResetPasswordForm /></Suspense>;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState(() => searchParams.has("error") || !searchParams.has("token") ? "This reset link is invalid or has expired. Request a new one to continue." : "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("confirmPassword"))) { setError("The passwords do not match."); return; }
    setBusy(true);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Could not reset the password. Request a new link and try again.");
    else setMessage("Your password has been changed. You can now sign in.");
  }

  return <main className="auth-page"><Link href="/sign-in" className="back-link">← Sign in</Link><section className="auth-card"><p className="eyebrow">ACCOUNT RECOVERY</p><h1>Choose a new<br/>password.</h1><p className="intro">Use at least 8 characters for your new password.</p>{!message && <form onSubmit={submit} className="auth-form"><label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required disabled={!token} /></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required disabled={!token} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy || !token}>{busy ? "Updating…" : "Update password"}</button></form>}{message && <p className="form-success" role="status">{message}</p>}<div className="auth-switch"><Link href="/forgot-password">Request another reset link</Link></div></section></main>;
}
