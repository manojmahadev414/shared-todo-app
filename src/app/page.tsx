import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CheckIcon } from "@/app/icons";

export default function Home() {
  return home();
}

async function home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");
  return (
    <main className="page-shell" aria-labelledby="welcome-title">
      <div className="hero-top">
        <div className="brand-mark" aria-hidden="true"><CheckIcon/></div>
        <span className="hero-brand">Shared To-Do</span>
        <nav className="hero-nav" aria-label="Account">
          <a href="/sign-in">Sign in</a>
          <a className="hero-nav-cta" href="/sign-up">Create an account</a>
        </nav>
      </div>
      <h1 id="welcome-title" className="hero-title">Make room<br />for what<br /><span className="hero-accent">matters.</span></h1>
      <div className="hero-row">
        <section className="welcome-card">
          <p className="intro">A thoughtful home for your tasks and the people you plan with.</p>
          <div className="actions">
            <a className="button button-primary" href="/sign-in">Sign in</a>
            <a className="button button-secondary" href="/sign-up">Create an account</a>
          </div>
          <p className="note">Your lists stay private until you choose to share them.</p>
        </section>
        <aside className="visual-panel" aria-label="A preview of a shared task list">
          <div className="sun"></div>
          <div className="floating-note note-one"><span className="check checked"><CheckIcon/></span><span>Pick up groceries</span><small>Today</small></div>
          <div className="floating-note note-two"><span className="check"></span><span>Plan the weekend</span><small>Sat</small></div>
          <div className="floating-note note-three"><span className="check"></span><span>Call the plumber</span><small>Tomorrow</small></div>
          <div className="avatar-stack" aria-label="Shared with friends"><span>M</span><span>A</span><span>+1</span></div>
          <p className="visual-caption">Little things, together.</p>
        </aside>
      </div>
    </main>
  );
}
