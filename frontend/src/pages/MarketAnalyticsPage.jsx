import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Download,
  MapPin,
  Sparkles,
  Trophy,
  Waypoints,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function MarketAnalyticsPage({
  jobs,
  analyticsSummary,
  onExportAnalyticsCsv,
}) {
  const summary = analyticsSummary;

  const typeCounts = jobs.reduce((acc, job) => {
    if (!job.type) return acc;

    acc[job.type] = (acc[job.type] || 0) + 1;
    return acc;
  }, {});

  const cityCounts = jobs.reduce((acc, job) => {
    if (!job.city) return acc;

    acc[job.city] = (acc[job.city] || 0) + 1;
    return acc;
  }, {});

  const companyCounts = jobs.reduce((acc, job) => {
    if (!job.company) return acc;

    acc[job.company] = (acc[job.company] || 0) + 1;
    return acc;
  }, {});

  const remoteJobs =
    summary?.remote_jobs ?? typeCounts.Remote ?? 0;

  const hybridJobs =
    summary?.hybrid_jobs ?? typeCounts.Hybrid ?? 0;

  const onsiteJobs =
    summary?.onsite_jobs ?? typeCounts.Onsite ?? 0;

  const typeOptions = [
    ["Remote", remoteJobs],
    ["Hybrid", hybridJobs],
    ["Onsite", onsiteJobs],
  ];

  const mostCommonType =
    [...typeOptions].sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "No data";

  const topCities =
    summary?.top_cities?.length > 0
      ? summary.top_cities.map((item) => [
          item.name,
          item.count,
        ])
      : Object.entries(cityCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

  const topCompanies =
    summary?.top_companies?.length > 0
      ? summary.top_companies.map((item) => [
          item.name,
          item.count,
        ])
      : Object.entries(companyCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

  const topCity = topCities[0]?.[0] || "No data";

  const topCompany =
    topCompanies[0]?.[0] || "No data";

  const topCitiesChartData = topCities.map(
    ([city, count]) => ({
      city,
      jobs: count,
    })
  );

  const topCompaniesChartData = topCompanies.map(
    ([company, count]) => ({
      company,
      jobs: count,
    })
  );

  const totalJobs =
    summary?.total_jobs ?? jobs.length;

  const remoteShare =
    totalJobs > 0
      ? Math.round((remoteJobs / totalJobs) * 100)
      : 0;

  const tooltipStyle = {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    color: "var(--popover-foreground)",
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            <Waypoints className="size-3.5" />
            Market Intelligence
          </Badge>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Market Analytics
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Explore hiring concentration, leading employers,
            work models, locations, and signals from the Mihna
            job-market dataset.
          </p>

          {!analyticsSummary && (
            <p className="mt-2 text-xs text-muted-foreground">
              Loading backend analytics summary...
            </p>
          )}
        </div>

        <Button
          variant="outline"
          onClick={onExportAnalyticsCsv}
        >
          <Download className="size-4" />
          Export analytics
        </Button>
      </section>

      {/* Intelligence highlights */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightMetric
          title="Dominant Work Model"
          value={mostCommonType}
          description="Most common job type"
          icon={BriefcaseBusiness}
        />

        <InsightMetric
          title="Leading City"
          value={topCity}
          description="Highest concentration of jobs"
          icon={MapPin}
        />

        <InsightMetric
          title="Leading Employer"
          value={topCompany}
          description="Most active company"
          icon={Building2}
        />

        <InsightMetric
          title="Market Dataset"
          value={totalJobs}
          description="Jobs analyzed"
          icon={BarChart3}
        />
      </section>

      {/* Market insight banner */}
      <Card className="overflow-hidden">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>

              <div>
                <p className="text-sm font-medium">
                  Current market signal
                </p>

                {totalJobs === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    There is not enough job data to generate a
                    market signal yet.
                  </p>
                ) : (
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {mostCommonType}
                    </span>{" "}
                    is currently the most common work model.
                    The strongest location in the dataset is{" "}
                    <span className="font-medium text-foreground">
                      {topCity}
                    </span>
                    , while{" "}
                    <span className="font-medium text-foreground">
                      {topCompany}
                    </span>{" "}
                    has the highest posting volume.
                  </p>
                )}
              </div>
            </div>

            {totalJobs > 0 && (
              <div className="shrink-0 rounded-xl border bg-background/70 px-5 py-3 backdrop-blur">
                <p className="text-xs text-muted-foreground">
                  Remote share
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {remoteShare}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        <AnalyticsChart
          title="Top hiring cities"
          description="Cities with the highest job volume in the current dataset."
        >
          {topCitiesChartData.length === 0 ? (
            <EmptyChart message="No city data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={topCitiesChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 20,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                />

                <XAxis
                  dataKey="city"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />

                <Tooltip contentStyle={tooltipStyle} />

                <Bar
                  dataKey="jobs"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </AnalyticsChart>

        <AnalyticsChart
          title="Most active employers"
          description="Companies contributing the largest number of job postings."
        >
          {topCompaniesChartData.length === 0 ? (
            <EmptyChart message="No company data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={topCompaniesChartData}
                layout="vertical"
                margin={{
                  top: 10,
                  right: 20,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--border)"
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="company"
                  width={100}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />

                <Tooltip contentStyle={tooltipStyle} />

                <Bar
                  dataKey="jobs"
                  fill="#8b5cf6"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </AnalyticsChart>
      </section>

      {/* Rankings and salary examples */}
      <section className="grid gap-4 lg:grid-cols-3">
        <RankingCard
          title="Top Cities"
          description="Highest job concentration"
          icon={MapPin}
          items={topCities.map(([city, count]) => ({
            label: city,
            value: count,
          }))}
        />

        <RankingCard
          title="Top Companies"
          description="Highest posting volume"
          icon={Trophy}
          items={topCompanies.map(([company, count]) => ({
            label: company,
            value: count,
          }))}
        />

        <SalaryCard jobs={jobs} />
      </section>

      {/* Work model */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Work model distribution
          </CardTitle>

          <CardDescription>
            Compare remote, hybrid, and onsite demand.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {typeOptions.map(([type, count]) => {
              const percentage =
                totalJobs > 0
                  ? Math.round((count / totalJobs) * 100)
                  : 0;

              return (
                <div
                  key={type}
                  className="rounded-xl border bg-muted/20 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      {type}
                    </span>

                    <Badge variant="secondary">
                      {percentage}%
                    </Badge>
                  </div>

                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {count}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    opportunities
                  </p>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          percentage,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InsightMetric({
  title,
  value,
  description,
  icon: Icon,
}) {
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>

            <p className="mt-2 truncate text-2xl font-semibold tracking-tight">
              {value}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsChart({
  title,
  description,
  children,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title}
        </CardTitle>

        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>{children}</CardContent>
    </Card>
  );
}

function RankingCard({
  title,
  description,
  icon: Icon,
  items,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>

        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data available.
          </p>
        ) : (
          <div className="divide-y">
            {items.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>

                  <span className="truncate text-sm">
                    {item.label || "Unknown"}
                  </span>
                </div>

                <Badge
                  variant="secondary"
                  className="shrink-0"
                >
                  {item.value}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SalaryCard({ jobs }) {
  const salaryJobs = jobs
    .filter((job) => job.salary)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BriefcaseBusiness className="size-4 text-primary" />
          Salary Examples
        </CardTitle>

        <CardDescription>
          Salary information from recent listings.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {salaryJobs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No salary data available.
          </p>
        ) : (
          <div className="divide-y">
            {salaryJobs.map((job) => (
              <div
                key={job.id}
                className="py-3 first:pt-0 last:pb-0"
              >
                <p className="truncate text-sm font-medium">
                  {job.title}
                </p>

                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {job.company || "Unknown company"}
                </p>

                <p className="mt-1 text-sm font-semibold text-primary">
                  {job.salary}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed">
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

export default MarketAnalyticsPage;