import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@/app/icons";

export const metadata: Metadata = { title: "Privacy policy · TheDoList" };

const CONTACT_EMAIL = "manojmahadev6000@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="auth-page legal-page">
      <Link href="/" className="back-link"><ArrowLeftIcon />TheDoList</Link>
      <article className="auth-card legal-card">
        <h1>Privacy policy</h1>
        <p className="intro">Last updated November 20, 2026. TheDoList is a small personal project for organizing task lists with friends.</p>

        <h2>What we store</h2>
        <ul>
          <li><strong>Account details:</strong> your name, email address, username and, if you sign in with Google, your Google profile picture URL.</li>
          <li><strong>Sign-in data:</strong> a hashed password if you sign up with email, or the account ID and tokens Google returns if you use Google sign-in. Sessions record the IP address and browser user agent they were created from.</li>
          <li><strong>Your content:</strong> the lists, tasks, descriptions, due dates and priorities you create, list memberships, and invitations you send or receive.</li>
        </ul>

        <h2>Google sign-in</h2>
        <p>When you choose Continue with Google, we request only your basic profile (name and picture), email address and OpenID identifier. We use them solely to create and sign in to your TheDoList account. We do not access your Gmail, Drive, contacts or any other Google data.</p>

        <h2>How it is used and shared</h2>
        <p>Your data is used only to run the app: signing you in, showing your lists, and letting people you invite see the lists you share with them. Other members of a shared list can see your name and username. We do not sell your data, show ads or use third-party analytics.</p>
        <p>The app is hosted on Vercel and its database on Prisma Postgres (United States). Verification and password-reset emails are sent through Gmail.</p>

        <h2>Deleting your data</h2>
        <p>To delete your account and everything in it, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address you signed up with. You can also revoke TheDoList&apos;s access in your Google Account under Security → Third-party connections.</p>

        <h2>Contact</h2>
        <p>Questions about this policy: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </article>
    </main>
  );
}
