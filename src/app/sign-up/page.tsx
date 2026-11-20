import { googleSignInEnabled } from "@/lib/auth";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return <SignUpForm googleEnabled={googleSignInEnabled} />;
}
