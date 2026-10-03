import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireUser(options: { allowIncompleteProfile?: boolean } = {}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if (!options.allowIncompleteProfile && !session.user.username) redirect("/complete-profile");
  return session.user;
}
