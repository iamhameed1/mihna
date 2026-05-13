function cleanHtml(html) {
  if (!html) return "";

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  return tempDiv.textContent || tempDiv.innerText || "";
}

function JobDetailsPage({
  job,
  currentUser,
  savedJobs,
  onToggleSaveJob,
  onDeleteJob,
  onStartEditJob,
  setPage,
}) {
  if (!job) {
    return (
      <div className="error-box">
        <p>Job not found.</p>
        <button onClick={() => setPage("home")}>Back Home</button>
      </div>
    );
  }

  const isSaved = savedJobs.some((savedJob) => savedJob.id === job.id);
  const isCompanyOwner =
    currentUser?.role === "company" && job.owner_id === currentUser.id;

  const cleanDescription = cleanHtml(job.description);

  return (
    <>
      <button className="back-btn" onClick={() => setPage("home")}>
        ← Back to jobs
      </button>

      <div className="job-details">
        <div className="job-details-header">
          <div>
            <p className="job-source">
              {job.source ? `Source: ${job.source}` : "Company Post"}
            </p>

            <h1>{job.title}</h1>

            <p>
              {job.company} • {job.city}, {job.country} • {job.type}
            </p>
          </div>

          <div className="job-details-actions">
            <strong>{job.salary}</strong>

            {currentUser?.role !== "company" && (
              <button
                className={isSaved ? "save-btn saved" : "save-btn"}
                onClick={() => onToggleSaveJob(job)}
              >
                {isSaved ? "Saved" : "Save Job"}
              </button>
            )}

            {isCompanyOwner && (
              <>
                <button className="edit-btn" onClick={() => onStartEditJob(job)}>
                  Edit
                </button>

                <button className="delete-btn" onClick={() => onDeleteJob(job.id)}>
                  Delete
                </button>
              </>
            )}

            <a href={job.link} target="_blank" rel="noreferrer">
              Apply / View Original
            </a>
          </div>
        </div>

        <div className="job-details-section">
          <h2>Job Description</h2>
          <p>{cleanDescription}</p>
        </div>
      </div>
    </>
  );
}

export default JobDetailsPage;