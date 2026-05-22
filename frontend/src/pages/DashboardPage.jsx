import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function DashboardPage({ jobs, analyticsSummary }) {
  const summary = analyticsSummary;

  const totalJobs = summary?.total_jobs ?? jobs.length;
  const manualJobs = summary?.manual_jobs ?? jobs.filter((job) => !job.source).length;
  const remotiveJobs =
    summary?.remotive_jobs ?? jobs.filter((job) => job.source === "remotive").length;
  const platformJobs =
    summary?.platform_jobs ?? jobs.filter((job) => job.source).length;
  const remoteJobs =
    summary?.remote_jobs ?? jobs.filter((job) => job.type === "Remote").length;
  const hybridJobs =
    summary?.hybrid_jobs ?? jobs.filter((job) => job.type === "Hybrid").length;
  const onsiteJobs =
    summary?.onsite_jobs ?? jobs.filter((job) => job.type === "Onsite").length;
  const totalCompanies =
    summary?.total_companies ?? new Set(jobs.map((job) => job.company)).size;


  const cityCounts = jobs.reduce((acc, job) => {
    acc[job.city] = (acc[job.city] || 0) + 1;
    return acc;
  }, {});

  const companyCounts = jobs.reduce((acc, job) => {
    acc[job.company] = (acc[job.company] || 0) + 1;
    return acc;
  }, {});

  const typeChartData =
    summary?.jobs_by_type?.length > 0
      ? summary.jobs_by_type.map((item) => ({
        name: item.name,
        value: item.count,
      }))
      : [
        { name: "Remote", value: remoteJobs },
        { name: "Hybrid", value: hybridJobs },
        { name: "Onsite", value: onsiteJobs },
      ];

  const sourceChartData =
    summary?.jobs_by_source?.length > 0
      ? summary.jobs_by_source.map((item) => ({
        name: item.name === "manual" ? "Manual" : item.name,
        value: item.count,
      }))
      : [
        { name: "Manual", value: manualJobs },
        { name: "Remotive", value: remotiveJobs },
      ];

  const topCitiesFromSummary = summary?.top_cities || [];
  const topCompaniesFromSummary = summary?.top_companies || [];

  const cityChartData =
    topCitiesFromSummary.length > 0
      ? topCitiesFromSummary.map((item) => ({
        city: item.name,
        jobs: item.count,
      }))
      : Object.entries(cityCounts).map(([city, count]) => ({
        city,
        jobs: count,
      }));

  const companyChartData =
    topCompaniesFromSummary.length > 0
      ? topCompaniesFromSummary.map((item) => ({
        company: item.name,
        jobs: item.count,
      }))
      : Object.entries(companyCounts).map(([company, count]) => ({
        company,
        jobs: count,
      }));

  const dateChartData =
    summary?.jobs_by_date?.length > 0
      ? summary.jobs_by_date.map((item) => ({
        date: item.date,
        jobs: item.count,
      }))
      : [];

  return (
    <>
      <div className="page-title">
        <p>Analytics Overview</p>
        <h1>Dashboard</h1>
        {!analyticsSummary && (
          <p className="empty-mini">Loading backend analytics summary...</p>
        )}
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
      <div className="cards source-cards">
        <div className="card">
          <p>Manual Jobs</p>
          <h2>{manualJobs}</h2>
          <span>Posted by companies</span>
        </div>

        <div className="card">
          <p>Remotive Jobs</p>
          <h2>{remotiveJobs}</h2>
          <span>Imported from API</span>
        </div>

        <div className="card">
          <p>Platform Jobs</p>
          <h2>{platformJobs}</h2>
          <span>External source jobs</span>
        </div>
      </div>
      <div className="charts-grid">
        <div className="chart-box">
          <h2>Jobs by Work Type</h2>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={typeChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {typeChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={["#3b82f6", "#22c55e", "#f59e0b"][index]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Jobs by City</h2>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cityChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="jobs" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Jobs by Source</h2>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={sourceChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {sourceChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={["#8b5cf6", "#06b6d4"][index]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box">
          <h2>Jobs Added Over Time</h2>

          {dateChartData.length === 0 ? (
            <p className="empty-mini">No date data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dateChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="jobs" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="analytics-grid">
        <div className="analytics-box">
          <h2>Jobs by Type</h2>

          {typeChartData.map((item) => (
            <div className="analytics-row" key={item.name}>
              <span>{item.name}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <div className="analytics-box">
          <h2>Top Cities</h2>

          {cityChartData.length === 0 ? (
            <p className="empty-mini">No city data yet.</p>
          ) : (
            cityChartData.map((item) => (
              <div className="analytics-row" key={item.city}>
                <span>{item.city}</span>
                <strong>{item.jobs}</strong>
              </div>
            ))
          )}
        </div>

        <div className="analytics-box">
          <h2>Top Companies</h2>

          {companyChartData.length === 0 ? (
            <p className="empty-mini">No company data yet.</p>
          ) : (
            companyChartData.map((item) => (
              <div className="analytics-row" key={item.company}>
                <span>{item.company}</span>
                <strong>{item.jobs}</strong>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default DashboardPage;