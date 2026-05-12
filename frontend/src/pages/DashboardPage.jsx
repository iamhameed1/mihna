function DashboardPage({ jobs }) {
  const totalJobs = jobs.length;
  const totalCompanies = new Set(jobs.map((job) => job.company)).size;

  const remoteJobs = jobs.filter((job) => job.type === "Remote").length;
  const hybridJobs = jobs.filter((job) => job.type === "Hybrid").length;
  const onsiteJobs = jobs.filter((job) => job.type === "Onsite").length;

  const cityCounts = jobs.reduce((acc, job) => {
    acc[job.city] = (acc[job.city] || 0) + 1;
    return acc;
  }, {});

  const companyCounts = jobs.reduce((acc, job) => {
    acc[job.company] = (acc[job.company] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="page-title">
        <p>Analytics Overview</p>
        <h1>Dashboard</h1>
        <span>
          This dashboard summarizes jobs collected from company posts and API
          sources.
        </span>
      </div>

      <div className="cards">
        <div className="card">
          <p>Total Jobs</p>
          <h2>{totalJobs}</h2>
          <span>Stored in PostgreSQL</span>
        </div>

        <div className="card">
          <p>Companies</p>
          <h2>{totalCompanies}</h2>
          <span>Unique companies</span>
        </div>

        <div className="card">
          <p>Remote Jobs</p>
          <h2>{remoteJobs}</h2>
          <span>Remote opportunities</span>
        </div>

        <div className="card">
          <p>Hybrid Jobs</p>
          <h2>{hybridJobs}</h2>
          <span>Hybrid opportunities</span>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-box">
          <h2>Jobs by Type</h2>

          <div className="analytics-row">
            <span>Remote</span>
            <strong>{remoteJobs}</strong>
          </div>

          <div className="analytics-row">
            <span>Hybrid</span>
            <strong>{hybridJobs}</strong>
          </div>

          <div className="analytics-row">
            <span>Onsite</span>
            <strong>{onsiteJobs}</strong>
          </div>
        </div>

        <div className="analytics-box">
          <h2>Jobs by City</h2>

          {Object.keys(cityCounts).length === 0 ? (
            <p className="empty-mini">No city data yet.</p>
          ) : (
            Object.entries(cityCounts).map(([city, count]) => (
              <div className="analytics-row" key={city}>
                <span>{city}</span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>

        <div className="analytics-box">
          <h2>Jobs by Company</h2>

          {Object.keys(companyCounts).length === 0 ? (
            <p className="empty-mini">No company data yet.</p>
          ) : (
            Object.entries(companyCounts).map(([company, count]) => (
              <div className="analytics-row" key={company}>
                <span>{company}</span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default DashboardPage;