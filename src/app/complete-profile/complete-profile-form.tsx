"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function CompleteProfileForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const username = String(data.get("username") ?? "").trim();
    if (!/^[a-zA-Z0-9_.]{3,32}$/.test(username)) {
      setBusy(false);
      setError("Use 3–32 letters, numbers, dots, or underscores.");
      return;
    }

    const result = await authClient.updateUser({ username });
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? "That username is unavailable. Try another one.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return <form onSubmit={submit} className="auth-form"><label>Username<input name="username" autoComplete="username" minLength={3} maxLength={32} pattern="[A-Za-z0-9_.]{3,32}" autoFocus required /><span className="field-hint">Letters, numbers, dots, and underscores are allowed.</span></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Continue to your lists"}</button></form>;
}
