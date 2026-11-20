/** Readable messages for the `?error=` codes Better Auth adds when a Google sign-in fails. */
const messages: Record<string, string> = {
  account_not_linked: "An account with this Google email already exists but its email isn’t verified yet. Open the verification link we emailed you (you can resend it from the sign-in page), then Continue with Google will connect to it.",
  access_denied: "Google sign-in was cancelled.",
  email_doesn_t_match: "That Google account uses a different email address than this TheDoList account.",
  account_already_linked_to_different_user: "That Google account is already connected to a different TheDoList account.",
};

export function googleSignInErrorMessage(code: string | string[] | undefined): string {
  if (typeof code !== "string" || !code) return "";
  return messages[code] ?? "Google sign-in didn’t complete. Please try again, or use your email and password.";
}
