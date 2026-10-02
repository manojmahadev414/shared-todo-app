"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

type AccountSettingsFormProps = { name: string; username: string; email: string; emailVerified: boolean };

export function AccountSettingsForm({ name, username, email, emailVerified }: AccountSettingsFormProps) {
  const [profileMessage, setProfileMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("profile"); setError(""); setProfileMessage("");
    const data = new FormData(event.currentTarget);
    const result = await authClient.updateUser({ name: String(data.get("name")), username: String(data.get("username")) });
    setBusy("");
    if (result.error) setError(result.error.message ?? "Could not update your profile.");
    else setProfileMessage("Your profile has been updated.");
  }

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("email"); setError(""); setEmailMessage("");
    const data = new FormData(event.currentTarget);
    const result = await authClient.changeEmail({ newEmail: String(data.get("email")), callbackURL: "/settings" });
    setBusy("");
    if (result.error) setError(result.error.message ?? "Could not start the email change.");
    else setEmailMessage("Check your current inbox to approve the change. We’ll then ask you to verify the new address.");
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("password"); setError(""); setPasswordMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const newPassword = String(data.get("newPassword"));
    if (newPassword !== String(data.get("confirmPassword"))) { setBusy(""); setError("The new passwords do not match."); return; }
    const result = await authClient.changePassword({ currentPassword: String(data.get("currentPassword")), newPassword, revokeOtherSessions: true });
    setBusy("");
    if (result.error) setError(result.error.message ?? "Could not change your password.");
    else { setPasswordMessage("Your password has been changed. Other sessions have been signed out."); form.reset(); }
  }

  return <div className="settings-sections">
    {error && <p className="form-error settings-error" role="alert">{error}</p>}
    <section className="settings-card"><div className="settings-card-heading"><h2>Profile details</h2><p>Update the name and username shown to people you share lists with.</p></div><form onSubmit={updateProfile} className="settings-form"><label>Your name<input name="name" autoComplete="name" defaultValue={name} minLength={1} maxLength={100} required /></label><label>Username<input name="username" autoComplete="username" defaultValue={username} minLength={3} maxLength={32} required /><span className="field-hint">Friends can use this to invite you.</span></label>{profileMessage && <p className="form-success" role="status">{profileMessage}</p>}<button className="button button-primary" disabled={busy !== ""}>{busy === "profile" ? "Saving…" : "Save profile"}</button></form></section>
    <section className="settings-card"><div className="settings-card-heading"><h2>Email address</h2><p>Current email: <strong>{email}</strong> · {emailVerified ? <span className="verified-label">Verified</span> : <span className="unverified-label">Not verified</span>}</p></div><form onSubmit={changeEmail} className="settings-form"><label>New email address<input name="email" type="email" autoComplete="email" defaultValue={email} required /></label>{emailMessage && <p className="form-success" role="status">{emailMessage}</p>}<button className="button button-primary" disabled={busy !== ""}>{busy === "email" ? "Sending…" : "Change email"}</button></form></section>
    <section className="settings-card"><div className="settings-card-heading"><h2>Password</h2><p>Change your password. Other signed-in devices will be signed out.</p></div><form onSubmit={changePassword} className="settings-form"><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label><label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={8} required /></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>{passwordMessage && <p className="form-success" role="status">{passwordMessage}</p>}<button className="button button-primary" disabled={busy !== ""}>{busy === "password" ? "Updating…" : "Update password"}</button></form></section>
  </div>;
}
