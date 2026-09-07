import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Download,
  Globe2,
  MapPin,
  Network,
  Radio,
  TrendingUp,
} from "lucide-react";

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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function DashboardPage({
  jobs,
  analyticsSummary,
  onExportAnalyticsCsv,
}) {
  const summary = analyticsSummary;

  const totalJobs = summary?.total_jobs ?? jobs.length;

  const manualJobs =
    summary?.manual_jobs ??
    jobs.filter((job) => !job.source).length;

  const remotiveJobs =
    summary?.remotive_jobs ??
    jobs.filter((job) => job.source === "remotive").length;

  const platformJobs =
    summary?.platform_jobs ??
    jobs.filter((job) => job.source).length;

  const remoteJobs =
    summary?.remote_jobs ??
    jobs.filter((job) => job.type === "Remote").length;

  const hybridJobs =
    summary?.hybrid_jobs ??
    jobs.filter((job) => job.type === "Hybrid").length;

  const onsiteJobs =
    summary?.onsite_jobs ??
    jobs.filter((job) => job.type === "Onsite").length;

  const totalCompanies =
    summary?.total_companies ??
    new Set(
      jobs.map((job) => job.company).filter(Boolean)
    ).size;

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
          name:
            item.name === "manual"
              ? "Manual"
              : item.name,
          value: item.count,
        }))
      : [
          { name: "Manual", value: manualJobs },
          { name: "Remotive", value: remotiveJobs },
        ];

  const topCitiesFromSummary =
    summary?.top_cities || [];

  const topCompaniesFromSummary =
    summary?.top_companies || [];

  const cityChartData =
    topCitiesFromSummary.length > 0
      ? topCitiesFromSummary.map((item) => ({
          city: item.name,
          jobs: item.count,
        }))
      : Object.entries(cityCounts).map(
          ([city, count]) => ({
            city,
            jobs: count,
          })
        );

  const companyChartData =
    topCompaniesFromSummary.length > 0
      ? topCompaniesFromSummary.map((item) => ({
          company: item.name,
          jobs: item.count,
        }))
      : Object.entries(companyCounts).map(
          ([company, count]) => ({
            company,
            jobs: count,
          })
        );

  const dateChartData =
    summary?.jobs_by_date?.length > 0
      ? summary.jobs_by_date.map((item) => ({
          date: item.date,
          jobs: item.count,
        }))
      : [];

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
            <BarChart3 className="size-3.5" />
            Analytics Overview
          </Badge>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Monitor job-market activity, hiring patterns,
            sources, locations, and workforce trends.
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

      {/* Primary metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Jobs"
          value={totalJobs}
          description="Tracked opportunities"
          icon={BriefcaseBusiness}
        />

        <MetricCard
          title="Companies"
          value={totalCompanies}
          description="Unique employers"
          icon={Building2}
        />

        <MetricCard
          title="Remote Jobs"
          value={remoteJobs}
          description="Remote opportunities"
          icon={Globe2}
        />

        <MetricCard
          title="Hybrid Jobs"
          value={hybridJobs}
          description="Hybrid opportunities"
          icon={Network}
        />
      </section>

      {/* Source metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Company Posts"
          value={manualJobs}
          description="Manually published jobs"
          icon={Building2}
          compact
        />

        <MetricCard
          title="Remotive"
          value={remotiveJobs}
          description="Imported through API"
          icon={Radio}
          compact
        />

        <MetricCard
          title="Platform Sources"
          value={platformJobs}
          description="External-source jobs"
          icon={TrendingUp}
          compact
        />
      </section>

      {/* Charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Jobs by work type"
          description="Distribution across remote, hybrid and onsite roles."
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeChartData}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={100}
                paddingAngle={3}
              >
                {typeChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={
                      [
                        "#3b82f6",
                        "#8b5cf6",
                        "#f59e0b",
                      ][index % 3]
                    }
                  />
                ))}
              </Pie>

              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>

          <ChartLegend data={typeChartData} />
        </ChartCard>

        <ChartCard
          title="Jobs by city"
          description="Locations with the highest number of opportunities."
        >
          {cityChartData.length === 0 ? (
            <EmptyChart message="No city data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={cityChartData.slice(0, 8)}
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
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />

                <YAxis
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
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
        </ChartCard>

        <ChartCard
          title="Jobs by source"
          description="Compare direct company listings with imported jobs."
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceChartData}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={100}
                paddingAngle={3}
              >
                {sourceChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={
                      ["#8b5cf6", "#06b6d4", "#3b82f6"][
                        index % 3
                      ]
                    }
                  />
                ))}
              </Pie>

              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>

          <ChartLegend data={sourceChartData} />
        </ChartCard>

        <ChartCard
          title="Jobs added over time"
          description="Track how the Mihna dataset grows over time."
        >
          {dateChartData.length === 0 ? (
            <EmptyChart message="No date data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={dateChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />

                <Tooltip contentStyle={tooltipStyle} />

                <Line
                  type="monotone"
                  dataKey="jobs"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* Rankings */}
      <section className="grid gap-4 lg:grid-cols-3">
        <RankingCard
          title="Jobs by type"
          description="Current work arrangement distribution."
          items={typeChartData.map((item) => ({
            label: item.name,
            value: item.value,
          }))}
          icon={BriefcaseBusiness}
        />

        <RankingCard
          title="Top cities"
          description="Leading job-market locations."
          items={cityChartData.slice(0, 8).map((item) => ({
            label: item.city,
            value: item.jobs,
          }))}
          icon={MapPin}
        />

        <RankingCard
          title="Top companies"
          description="Employers with the most opportunities."
          items={companyChartData
            .slice(0, 8)
            .map((item) => ({
              label: item.company,
              value: item.jobs,
            }))}
          icon={Building2}
        />
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  compact = false,
}) {
  return (
    <Card>
      <CardContent
        className={compact ? "p-5" : "p-5 sm:p-6"}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>

            <p
              className={
                compact
                  ? "mt-2 text-2xl font-semibold tracking-tight"
                  : "mt-2 text-3xl font-semibold tracking-tight"
              }
            >
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

function ChartCard({
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

      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

function ChartLegend({ data }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2">
      {data.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <span className="size-2 rounded-full bg-primary" />
          <span>{item.name}</span>
          <span className="font-medium text-foreground">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed">
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function RankingCard({
  title,
  description,
  items,
  icon: Icon,
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

export default DashboardPage;