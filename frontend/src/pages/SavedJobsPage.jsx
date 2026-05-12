import JobCard from "../components/JobCard";

function SavedJobsPage({ savedJobs, onToggleSaveJob }) {
  return (
    <>
      <div className="page-title">
        <p>Job Finder Area</p>
        <h1>Saved Jobs</h1>
        <span>Jobs saved by the job finder will appear here.</span>
      </div>

      <div className="jobs-section">
        {savedJobs.length === 0 ? (
          <p className="empty-message">No saved jobs yet.</p>
        ) : (
          <div className="jobs-list">
            {savedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                savedJobs={savedJobs}
                onToggleSaveJob={onToggleSaveJob}
                showEditButton={false}
                showDeleteButton={false}
                removeMode={true}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default SavedJobsPage;