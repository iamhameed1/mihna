function Header({ searchTerm, setSearchTerm }) {
  return (
    <header className="header">
      <input
        type="text"
        placeholder="Search jobs, companies, city..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      <div className="header-actions">
        <button>Dark Mode</button>
        <button>Logout</button>
      </div>
    </header>
  );
}

export default Header;