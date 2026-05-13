function cleanHtml(html) {
  if (!html) return "";

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  return tempDiv.textContent || tempDiv.innerText || "";
}

function createSummary(description, maxLength = 180) {
  const cleanText = cleanHtml(description);

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  return cleanText.slice(0, maxLength) + "...";
}

function JobCard({
  job,
  savedJobs = [],
  onToggleSaveJob,
  onDeleteJob,
  onStartEditJob,
  onOpenJobDetails,
  currentUser,
  showSaveButton = true,
  showEditButton = true,
  showDeleteButton = true,
  removeMode = false,
}) {
  const isSaved = savedJobs.some((savedJob) => savedJob.id === job.id);
  const isCompanyOwner =
    currentUser?.role === "company" && job.owner_id === currentUser.id;

  return (
    <div className="job-card">
      <div className="job-main" onClick={() => onOpenJobDetails(job)}>
        <h3>{job.title}</h3>
        <p>{job.company}</p>
        <span>
          {job.city}, {job.country} • {job.type}
        </span>

        <p className="job-description">{createSummary(job.description)}</p>
      </div>

      <div className="job-side">
        <strong>{job.salary}</strong>

        {showSaveButton && currentUser?.role !== "company" && (
          <button
            className={isSaved ? "save-btn saved" : "save-btn"}
            onClick={() => onToggleSaveJob(job)}
          >
            {removeMode ? "Remove" : isSaved ? "Saved" : "Save Job"}
          </button>
        )}

        <button className="details-btn" onClick={() => onOpenJobDetails(job)}>
          View Details
        </button>

        {showEditButton && isCompanyOwner && (
          <button className="edit-btn" onClick={() => onStartEditJob(job)}>
            Edit
          </button>
        )}

        {showDeleteButton && isCompanyOwner && (
          <button className="delete-btn" onClick={() => onDeleteJob(job.id)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default JobCard;