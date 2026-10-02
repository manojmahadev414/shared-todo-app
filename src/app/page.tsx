export default function Home() {
  return (
    <main className="page-shell">
      <section className="welcome-card" aria-labelledby="welcome-title">
        <div className="brand-mark" aria-hidden="true">✓</div>
        <p className="eyebrow">YOUR SHARED SPACE</p>
        <h1 id="welcome-title">Make room for<br />what matters.</h1>
        <p className="intro">A thoughtful home for your tasks and the people you plan with.</p>
        <div className="actions">
          <a className="button button-primary" href="/sign-in">Sign in</a>
          <a className="button button-secondary" href="/sign-up">Create an account</a>
        </div>
        <p className="note">Your lists stay private until you choose to share them.</p>
      </section>
      <aside className="visual-panel" aria-label="A preview of a shared task list">
        <div className="sun"></div>
        <div className="floating-note note-one"><span className="check checked">✓</span><span>Pick up groceries</span><small>Today</small></div>
        <div className="floating-note note-two"><span className="check"></span><span>Plan the weekend</span><small>Sat</small></div>
        <div className="floating-note note-three"><span className="check"></span><span>Call the plumber</span><small>Tomorrow</small></div>
        <div className="avatar-stack" aria-label="Shared with friends"><span>M</span><span>A</span><span>+1</span></div>
        <p className="visual-caption">Little things, together.</p>
      </aside>
    </main>
  );
}
