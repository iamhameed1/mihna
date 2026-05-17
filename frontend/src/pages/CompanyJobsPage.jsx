import JobCard from "../components/JobCard";

function CompanyJobsPage({
  companyJobs,
  currentUser,
  onDeleteJob,
  onStartEditJob,
  onOpenJobDetails,
  onFetchRemotiveJobs,
}) {
  return (
    <>
      <div className="page-title">
        <p>Company Area</p>
        <h1>My Company Jobs</h1>
        <span>
          Manage only jobs manually posted by your company. Imported jobs from external
          APIs are shown on Home as platform jobs.
        </span>
      </div>

      <div className="company-actions">
        <button className="submit-btn" onClick={onFetchRemotiveJobs}>
          Import Remotive Jobs to Platform
        </button>

        <p className="company-note">
          Imported jobs are read-only platform jobs and will appear on Home, not in My
          Company Jobs.
        </p>
      </div>

      <div className="jobs-section">
        {companyJobs.length === 0 ? (
          <p className="empty-message">
            Your company has not manually posted any jobs yet. Imported Remotive jobs are
            platform jobs and do not appear here.
          </p>
        ) : (
          <div className="jobs-list">
            {companyJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                currentUser={currentUser}
                onDeleteJob={onDeleteJob}
                onStartEditJob={onStartEditJob}
                showSaveButton={false}
                onOpenJobDetails={onOpenJobDetails}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default CompanyJobsPage;