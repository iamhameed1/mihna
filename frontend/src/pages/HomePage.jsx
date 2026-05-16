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
  savedJobs,
  onToggleSaveJob,
  onDeleteJob,
  onStartEditJob,
  currentUser,
  onOpenJobDetails,
}) {

  const filteredJobs = jobs;

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
          <h2>{jobs.length}</h2>
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
    </>
  );
}

export default HomePage;