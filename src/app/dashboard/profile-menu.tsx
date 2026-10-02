import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export function ProfileMenu({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return <details className="profile-menu">
    <summary className="profile-nav-link" aria-label="Open account menu" title="Account menu"><span>{initial}</span></summary>
    <nav className="profile-menu-dropdown" aria-label="Account">
      <Link href="/profile">View profile</Link>
      <Link href="/settings">Settings</Link>
      <div className="profile-menu-signout"><SignOutButton /></div>
    </nav>
  </details>;
}
