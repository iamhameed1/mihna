function JobCard({
  job,
  savedJobs = [],
  onToggleSaveJob,
  onDeleteJob,
  onStartEditJob,
  showSaveButton = true,
  showEditButton = true,
  showDeleteButton = true,
  removeMode = false,
}) {
  const isSaved = savedJobs.some((savedJob) => savedJob.id === job.id);

  return (
    <div className="job-card">
      <div>
        <h3>{job.title}</h3>
        <p>{job.company}</p>
        <span>
          {job.city}, {job.country} • {job.type}
        </span>
      </div>

      <div className="job-side">
        <strong>{job.salary}</strong>

        {showSaveButton && (
          <button
            className={isSaved ? "save-btn saved" : "save-btn"}
            onClick={() => onToggleSaveJob(job)}
          >
            {removeMode ? "Remove" : isSaved ? "Saved" : "Save Job"}
          </button>
        )}

        <a href={job.link} target="_blank" rel="noreferrer">
          View Job
        </a>

        {showEditButton && (
          <button className="edit-btn" onClick={() => onStartEditJob(job)}>
            Edit
          </button>
        )}

        {showDeleteButton && (
          <button className="delete-btn" onClick={() => onDeleteJob(job.id)}>
            Delete
          </button>
        )}
      </div>

      <p className="job-description">{job.description}</p>
    </div>
  );
}

export default JobCard;