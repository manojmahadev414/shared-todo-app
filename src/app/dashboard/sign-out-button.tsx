"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return <button className="sign-out" onClick={async () => { await authClient.signOut(); router.push("/"); }}>Sign out</button>;
}
