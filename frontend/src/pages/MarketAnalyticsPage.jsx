function MarketAnalyticsPage({ jobs }) {
  const typeCounts = jobs.reduce((acc, job) => {
    acc[job.type] = (acc[job.type] || 0) + 1;
    return acc;
  }, {});

  const cityCounts = jobs.reduce((acc, job) => {
    acc[job.city] = (acc[job.city] || 0) + 1;
    return acc;
  }, {});

  const companyCounts = jobs.reduce((acc, job) => {
    acc[job.company] = (acc[job.company] || 0) + 1;
    return acc;
  }, {});

  const mostCommonType =
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "No data";

  const topCity =
    Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "No data";

  const topCompany =
    Object.entries(companyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "No data";

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <>
      <div className="page-title">
        <p>Market Intelligence</p>
        <h1>Market Analytics</h1>
        <span>Understand job market trends based on jobs stored in Mihna.</span>
      </div>

      <div className="cards">
        <div className="card">
          <p>Most Common Type</p>
          <h2>{mostCommonType}</h2>
          <span>Based on current jobs</span>
        </div>

        <div className="card">
          <p>Top City</p>
          <h2>{topCity}</h2>
          <span>Highest job count</span>
        </div>

        <div className="card">
          <p>Top Company</p>
          <h2>{topCompany}</h2>
          <span>Most posted jobs</span>
        </div>

        <div className="card">
          <p>Total Market Data</p>
          <h2>{jobs.length}</h2>
          <span>Jobs analyzed</span>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-box">
          <h2>Top Cities</h2>

          {topCities.length === 0 ? (
            <p className="empty-mini">No city data yet.</p>
          ) : (
            topCities.map(([city, count]) => (
              <div className="analytics-row" key={city}>
                <span>{city}</span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>

        <div className="analytics-box">
          <h2>Top Companies</h2>

          {topCompanies.length === 0 ? (
            <p className="empty-mini">No company data yet.</p>
          ) : (
            topCompanies.map(([company, count]) => (
              <div className="analytics-row" key={company}>
                <span>{company}</span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>

        <div className="analytics-box">
          <h2>Salary Examples</h2>

          {jobs.length === 0 ? (
            <p className="empty-mini">No salary data yet.</p>
          ) : (
            jobs.slice(0, 5).map((job) => (
              <div className="analytics-row" key={job.id}>
                <span>{job.title}</span>
                <strong>{job.salary}</strong>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="market-summary">
        <h2>Market Summary</h2>

        {jobs.length === 0 ? (
          <p>No job data yet. Add jobs first to generate market insights.</p>
        ) : (
          <p>
            Mihna analyzed {jobs.length} jobs. The most common work type is{" "}
            <strong>{mostCommonType}</strong>. The strongest city in the current
            data is <strong>{topCity}</strong>, and the company with the most
            postings is <strong>{topCompany}</strong>.
          </p>
        )}
      </div>
    </>
  );
}

export default MarketAnalyticsPage;