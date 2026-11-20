import { googleSignInEnabled } from "@/lib/auth";
import { googleSignInErrorMessage } from "@/lib/oauth-errors";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { error } = await searchParams;
  return <SignInForm googleEnabled={googleSignInEnabled} initialError={googleSignInErrorMessage(error)} />;
}
