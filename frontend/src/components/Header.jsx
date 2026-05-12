function Header({
  searchTerm,
  setSearchTerm,
  currentUser,
  onLogout,
  setPage,
  theme,
  onToggleTheme,
}) {
  return (
    <header className="header">
      <input
        type="text"
        placeholder="Search jobs, companies, city..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      <div className="header-actions">
        <button onClick={onToggleTheme}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        {currentUser ? (
          <>
            <span className="user-badge">
              {currentUser.name} • {currentUser.role}
            </span>

            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => setPage("login")}>Login</button>
            <button onClick={() => setPage("register")}>Register</button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;