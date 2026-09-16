import { localizeMessage } from "@/i18n";
import { localizeLocation, localizeWorkType } from "@/i18n/jobs";
import { useTranslation } from "react-i18next";
import { t, formatNumber, locale } from "@/i18n";
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
  useTranslation();
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
          name: localizeWorkType(item.name),
          value: item.count,
        }))
      : [
          { name: t("Remote"), value: remoteJobs },
          { name: t("Hybrid"), value: hybridJobs },
          { name: t("Onsite"), value: onsiteJobs },
        ];

  const sourceChartData =
    summary?.jobs_by_source?.length > 0
      ? summary.jobs_by_source.map((item) => ({
          name:
            item.name === "manual"
              ? t("Manual")
              : item.name,
          value: item.count,
        }))
      : [
          { name: t("Manual"), value: manualJobs },
          { name: "Remotive", value: remotiveJobs },
        ];

  const topCitiesFromSummary =
    summary?.top_cities || [];

  const topCompaniesFromSummary =
    summary?.top_companies || [];

  const cityChartData =
    topCitiesFromSummary.length > 0
      ? topCitiesFromSummary.map((item) => ({
          city: localizeLocation(item.name),
          jobs: item.count,
        }))
      : Object.entries(cityCounts).map(
          ([city, count]) => ({
            city: localizeLocation(city),
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
            <BarChart3 className="size-3.5" />{t("Analytics Overview")}</Badge>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("Dashboard")}</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t("Monitor job-market activity, hiring patterns, sources, locations, and workforce trends.")}</p>

          {!analyticsSummary && (
            <p className="mt-2 text-xs text-muted-foreground">{t("Loading backend analytics summary...")}</p>
          )}
        </div>

        <Button
          variant="outline"
          onClick={onExportAnalyticsCsv}
        >
          <Download className="size-4" />{t("Export analytics")}</Button>
      </section>

      {/* Primary metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("Total Jobs")}
          value={totalJobs}
          description={t("Tracked opportunities")}
          icon={BriefcaseBusiness}
        />

        <MetricCard
          title={t("Companies")}
          value={totalCompanies}
          description={t("Unique employers")}
          icon={Building2}
        />

        <MetricCard
          title={t("Remote Jobs")}
          value={remoteJobs}
          description={t("Remote opportunities")}
          icon={Globe2}
        />

        <MetricCard
          title={t("Hybrid Jobs")}
          value={hybridJobs}
          description={t("Hybrid opportunities")}
          icon={Network}
        />
      </section>

      {/* Source metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title={t("Company Posts")}
          value={manualJobs}
          description={t("Manually published jobs")}
          icon={Building2}
          compact
        />

        <MetricCard
          title="Remotive"
          value={remotiveJobs}
          description={t("Imported through API")}
          icon={Radio}
          compact
        />

        <MetricCard
          title={t("Platform Sources")}
          value={platformJobs}
          description={t("External-source jobs")}
          icon={TrendingUp}
          compact
        />
      </section>

      {/* Charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title={t("Jobs by work type")}
          description={t("Distribution across remote, hybrid and onsite roles.")}
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

              <Tooltip formatter={(value, name) => [formatNumber(value), name]} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>

          <ChartLegend data={typeChartData} />
        </ChartCard>

        <ChartCard
          title={t("Jobs by city")}
          description={t("Locations with the highest number of opportunities.")}
        >
          {cityChartData.length === 0 ? (
            <EmptyChart message={t("No city data yet.")} />
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

                <YAxis tickFormatter={formatNumber}
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />

                <Tooltip formatter={(value, name) => [formatNumber(value), name]} contentStyle={tooltipStyle} />

                <Bar
                  name={t("Total Jobs")} dataKey="jobs"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={t("Jobs by source")}
          description={t("Compare direct company listings with imported jobs.")}
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

              <Tooltip formatter={(value, name) => [formatNumber(value), name]} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>

          <ChartLegend data={sourceChartData} />
        </ChartCard>

        <ChartCard
          title={t("Jobs added over time")}
          description={t("Track how the Mihna dataset grows over time.")}
        >
          {dateChartData.length === 0 ? (
            <EmptyChart message={t("No date data yet.")} />
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
                  dataKey="date" tickFormatter={(value) => new Intl.DateTimeFormat(locale(), { month: "short", day: "numeric" }).format(new Date(value))}
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis tickFormatter={formatNumber}
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />

                <Tooltip formatter={(value, name) => [formatNumber(value), name]} contentStyle={tooltipStyle} />

                <Line
                  type="monotone"
                  name={t("Total Jobs")} dataKey="jobs"
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
          title={t("Jobs by type")}
          description={t("Current work arrangement distribution.")}
          items={typeChartData.map((item) => ({
            label: item.name,
            value: item.value,
          }))}
          icon={BriefcaseBusiness}
        />

        <RankingCard
          title={t("Top cities")}
          description={t("Leading job-market locations.")}
          items={cityChartData.slice(0, 8).map((item) => ({
            label: item.city,
            value: item.jobs,
          }))}
          icon={MapPin}
        />

        <RankingCard
          title={t("Top companies")}
          description={t("Employers with the most opportunities.")}
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
  useTranslation();
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
              {typeof value === "number" ? formatNumber(value) : value}
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
  useTranslation();
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
  useTranslation();
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
            {formatNumber(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ message }) {
  useTranslation();
  return (
    <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed">
      <p className="text-sm text-muted-foreground">
        {localizeMessage(message)}
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
  useTranslation();
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
          <p className="py-8 text-center text-sm text-muted-foreground">{t("No data available.")}</p>
        ) : (
          <div className="divide-y">
            {items.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                    {formatNumber(index + 1)}
                  </span>

                  <span className="truncate text-sm">
                    {item.label || t("Unknown")}
                  </span>
                </div>

                <Badge
                  variant="secondary"
                  className="shrink-0"
                >
                  {formatNumber(item.value)}
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