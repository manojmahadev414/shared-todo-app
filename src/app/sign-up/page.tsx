import { googleSignInEnabled } from "@/lib/auth";
import { googleSignInErrorMessage } from "@/lib/oauth-errors";
import { SignUpForm } from "./sign-up-form";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { error } = await searchParams;
  return <SignUpForm googleEnabled={googleSignInEnabled} initialError={googleSignInErrorMessage(error)} />;
}
