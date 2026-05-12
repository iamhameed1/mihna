function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-box">M</div>
        <div>
          <h2>Mihna</h2>
          <p>Job Intelligence</p>
        </div>
      </div>

      <nav className="nav">
        <button
          className={page === "home" ? "active" : ""}
          onClick={() => setPage("home")}
        >
          Home
        </button>

        <button
          className={page === "saved" ? "active" : ""}
          onClick={() => setPage("saved")}
        >
          Saved Jobs
        </button>

        <button
          className={page === "dashboard" ? "active" : ""}
          onClick={() => setPage("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={page === "analytics" ? "active" : ""}
          onClick={() => setPage("analytics")}
        >
          Market Analytics
        </button>

        <button
          className={page === "add-job" ? "active" : ""}
          onClick={() => setPage("add-job")}
        >
          Add Job
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;