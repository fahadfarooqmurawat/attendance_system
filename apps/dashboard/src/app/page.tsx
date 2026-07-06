const modules = [
  "My attendance",
  "Team attendance",
  "Manual requests",
  "Approvals",
  "Enrollment",
  "Reports"
];

export default function Home() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Attendance System</h1>
          <p className="muted">Dashboard scaffold for employees, managers, and HR.</p>
        </div>
      </header>

      <section className="panel-grid" aria-label="Dashboard modules">
        {modules.map((module) => (
          <article className="panel" key={module}>
            <h2>{module}</h2>
            <p className="muted">Placeholder route and workflow boundary.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
