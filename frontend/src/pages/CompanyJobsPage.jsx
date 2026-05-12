import JobCard from "../components/JobCard";

function CompanyJobsPage({
  companyJobs,
  currentUser,
  onDeleteJob,
  onStartEditJob,
}) {
  return (
    <>
      <div className="page-title">
        <p>Company Area</p>
        <h1>My Company Jobs</h1>
        <span>Manage jobs posted by your company account.</span>
      </div>

      <div className="jobs-section">
        {companyJobs.length === 0 ? (
          <p className="empty-message">Your company has not posted any jobs yet.</p>
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
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default CompanyJobsPage;