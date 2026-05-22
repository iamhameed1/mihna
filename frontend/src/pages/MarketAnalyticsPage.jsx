import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function MarketAnalyticsPage({ jobs, analyticsSummary, onExportAnalyticsCsv }) {
  const summary = analyticsSummary;

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

  const remoteJobs = summary?.remote_jobs ?? typeCounts.Remote ?? 0;
  const hybridJobs = summary?.hybrid_jobs ?? typeCounts.Hybrid ?? 0;
  const onsiteJobs = summary?.onsite_jobs ?? typeCounts.Onsite ?? 0;

  const typeOptions = [
    ["Remote", remoteJobs],
    ["Hybrid", hybridJobs],
    ["Onsite", onsiteJobs],
  ];

  const mostCommonType =
    typeOptions.sort((a, b) => b[1] - a[1])[0]?.[0] || "No data";

  const topCities =
    summary?.top_cities?.length > 0
      ? summary.top_cities.map((item) => [item.name, item.count])
      : Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

  const topCompanies =
    summary?.top_companies?.length > 0
      ? summary.top_companies.map((item) => [item.name, item.count])
      : Object.entries(companyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

  const topCity = topCities[0]?.[0] || "No data";
  const topCompany = topCompanies[0]?.[0] || "No data";

  const topCitiesChartData = topCities.map(([city, count]) => ({
    city,
    jobs: count,
  }));

  const topCompaniesChartData = topCompanies.map(([company, count]) => ({
    company,
    jobs: count,
  }));

  const totalJobs = summary?.total_jobs ?? jobs.length;

  return (
    <>
      <div className="page-title">
        <p>Market Intelligence</p>
        <h1>Market Analytics</h1>
        <span>Understand job market trends based on jobs stored in Mihna.</span>
      </div>
      <div className="company-actions">
        <button className="export-csv-btn" onClick={onExportAnalyticsCsv}>
          Export Analytics CSV
        </button>
      </div>
      {!analyticsSummary && (
        <p className="empty-mini">Loading backend analytics summary...</p>
      )}

      <div className="cards">
        <div className="card">
          <p>Most Common Type</p>
          <h2>{mostCommonType}</h2>
          <span>Based on all backend jobs</span>
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
          <h2>{totalJobs}</h2>
          <span>Jobs analyzed</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-box">
          <h2>Top Cities Chart</h2>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topCitiesChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="jobs" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Top Companies Chart</h2>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topCompaniesChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="company" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="jobs" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
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

        {totalJobs === 0 ? (
          <p>No job data yet. Add jobs first to generate market insights.</p>
        ) : (
          <p>
            Mihna analyzed {totalJobs} jobs. The most common work type is{" "}
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