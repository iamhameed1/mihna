import JobCard from "../components/JobCard";

function HomePage({
  jobs,
  searchTerm,
  typeFilter,
  setTypeFilter,
  locationFilter,
  setLocationFilter,
  sourceFilter,
  setSourceFilter,
  dateRangeFilter,
  setDateRangeFilter,
  sortOption,
  setSortOption,
  savedJobs,
  onToggleSaveJob,
  onDeleteJob,
  onStartEditJob,
  currentUser,
  onOpenJobDetails,
  currentPage,
  totalPages,
  totalJobs,
  onChangePage,
  pageSize,
  onChangePageSize,
  onClearFilters,
}) {

  const filteredJobs = jobs;
  const activeFilters = [];

  if (searchTerm) {
    activeFilters.push(`Search: ${searchTerm}`);
  }

  if (typeFilter !== "All") {
    activeFilters.push(typeFilter);
  }

  if (locationFilter !== "All") {
    activeFilters.push(locationFilter);
  }

  if (sourceFilter !== "All") {
    activeFilters.push(sourceFilter === "manual" ? "Manual" : "Remotive");
  }

  if (dateRangeFilter !== "All") {
    activeFilters.push(
      dateRangeFilter === "7d" ? "Last 7 Days" : "Last 30 Days"
    );
  }

  if (sortOption !== "newest") {
    const sortLabels = {
      oldest: "Oldest First",
      company_az: "Company A-Z",
      title_az: "Title A-Z",
    };

    activeFilters.push(sortLabels[sortOption]);
  }
  return (
    <>
      <div className="page-title">
        <p>Welcome back</p>
        <h1>Find jobs and understand the market</h1>
        <span>
          Mihna collects jobs from APIs and company posts, then turns them into
          useful market analytics.
        </span>
      </div>

      <div className="cards">
        <div className="card">
          <p>Total Jobs</p>
          <h2>{totalJobs}</h2>
          <span>From PostgreSQL</span>
        </div>

        <div className="card">
          <p>Companies</p>
          <h2>{new Set(jobs.map((job) => job.company)).size}</h2>
          <span>Unique companies</span>
        </div>

        <div className="card">
          <p>Showing</p>
          <h2>{filteredJobs.length}</h2>
          <span>After filters</span>
        </div>

        <div className="card">
          <p>Remote Jobs</p>
          <h2>{jobs.filter((job) => job.type === "Remote").length}</h2>
          <span>Work from anywhere</span>
        </div>
      </div>

      <div className="filter-section">
        <button
          className={typeFilter === "All" ? "active-filter" : ""}
          onClick={() => setTypeFilter("All")}
        >
          All
        </button>

        <button
          className={typeFilter === "Onsite" ? "active-filter" : ""}
          onClick={() => setTypeFilter("Onsite")}
        >
          Onsite
        </button>

        <button
          className={typeFilter === "Hybrid" ? "active-filter" : ""}
          onClick={() => setTypeFilter("Hybrid")}
        >
          Hybrid
        </button>

        <button
          className={typeFilter === "Remote" ? "active-filter" : ""}
          onClick={() => setTypeFilter("Remote")}
        >
          Remote
        </button>
      </div>

      <div className="filter-section">
        <button
          className={locationFilter === "All" ? "active-filter" : ""}
          onClick={() => setLocationFilter("All")}
        >
          All Locations
        </button>

        <button
          className={locationFilter === "USA" ? "active-filter" : ""}
          onClick={() => setLocationFilter("USA")}
        >
          USA
        </button>

        <button
          className={locationFilter === "Worldwide" ? "active-filter" : ""}
          onClick={() => setLocationFilter("Worldwide")}
        >
          Worldwide
        </button>

        <button
          className={locationFilter === "Saudi Arabia" ? "active-filter" : ""}
          onClick={() => setLocationFilter("Saudi Arabia")}
        >
          Saudi Arabia
        </button>
      </div>

      <div className="filter-section">
        <button
          className={sourceFilter === "All" ? "active-filter" : ""}
          onClick={() => setSourceFilter("All")}
        >
          All Sources
        </button>

        <button
          className={sourceFilter === "manual" ? "active-filter" : ""}
          onClick={() => setSourceFilter("manual")}
        >
          Manual
        </button>

        <button
          className={sourceFilter === "remotive" ? "active-filter" : ""}
          onClick={() => setSourceFilter("remotive")}
        >
          Remotive
        </button>
      </div>

      <div className="filter-section">
        <button
          className={dateRangeFilter === "All" ? "active-filter" : ""}
          onClick={() => setDateRangeFilter("All")}
        >
          All Time
        </button>

        <button
          className={dateRangeFilter === "7d" ? "active-filter" : ""}
          onClick={() => setDateRangeFilter("7d")}
        >
          Last 7 Days
        </button>

        <button
          className={dateRangeFilter === "30d" ? "active-filter" : ""}
          onClick={() => setDateRangeFilter("30d")}
        >
          Last 30 Days
        </button>
      </div>
      <div className="filter-section">
        <button
          className={sortOption === "newest" ? "active-filter" : ""}
          onClick={() => setSortOption("newest")}
        >
          Newest First
        </button>

        <button
          className={sortOption === "oldest" ? "active-filter" : ""}
          onClick={() => setSortOption("oldest")}
        >
          Oldest First
        </button>

        <button
          className={sortOption === "company_az" ? "active-filter" : ""}
          onClick={() => setSortOption("company_az")}
        >
          Company A-Z
        </button>

        <button
          className={sortOption === "title_az" ? "active-filter" : ""}
          onClick={() => setSortOption("title_az")}
        >
          Title A-Z
        </button>
      </div>
      <div className="active-filters-box">
        {activeFilters.length === 0 ? (
          <span>Showing all jobs</span>
        ) : (
          <>
            <span>Active filters:</span>

            <div className="active-filter-tags">
              {activeFilters.map((filter) => (
                <strong key={filter}>{filter}</strong>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="filter-actions">
        <button className="clear-filters-btn" onClick={onClearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="page-size-control">
        <label>Jobs per page:</label>

        <select
          value={pageSize}
          onChange={(event) => onChangePageSize(Number(event.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="jobs-section">
        <h2>Latest Jobs</h2>

        {filteredJobs.length === 0 ? (
          <p className="empty-message">No jobs found.</p>
        ) : (
          <div className="jobs-list">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                savedJobs={savedJobs}
                onToggleSaveJob={onToggleSaveJob}
                onDeleteJob={onDeleteJob}
                onStartEditJob={onStartEditJob}
                currentUser={currentUser}
                onOpenJobDetails={onOpenJobDetails}
              />
            ))}
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => onChangePage(currentPage - 1)}
          >
            Previous
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => onChangePage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

export default HomePage;