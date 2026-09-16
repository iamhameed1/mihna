import { localizeMessage } from "@/i18n";
import { useTranslation } from "react-i18next";
import { t, locale, formatNumber } from "@/i18n";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  RefreshCw,
  RotateCcw,
  ServerCog,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function IngestionLogsPage({
  logs,
  onRefreshLogs,
}) {
  useTranslation();
  const totalRuns = logs.length;

  const successfulRuns = logs.filter(
    (log) => log.status === "success"
  ).length;

  const failedRuns = logs.filter(
    (log) => log.status === "failed"
  ).length;

  const runningRuns = logs.filter(
    (log) => log.status !== "success" && log.status !== "failed"
  ).length;

  const totalAdded = logs.reduce(
    (sum, log) => sum + (log.added_count || 0),
    0
  );

  const totalSkipped = logs.reduce(
    (sum, log) => sum + (log.skipped_count || 0),
    0
  );

  const successRate =
    totalRuns > 0
      ? Math.round((successfulRuns / totalRuns) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Heading */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            <Database className="size-3.5" />{t("Data Pipeline")}</Badge>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("Data Ingestion")}</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t("Monitor external job imports, pipeline executions, deduplication, and ingestion health.")}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onRefreshLogs}
        >
          <RefreshCw className="size-4" />{t("Refresh Logs")}</Button>
      </section>

      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title={t("Total Runs")}
          value={totalRuns}
          description={t("Pipeline executions")}
          icon={ServerCog}
        />

        <MetricCard
          title={t("Successful")}
          value={successfulRuns}
          description={t("{{rate}} success rate", { rate: formatNumber(successRate / 100, { style: "percent" }) })}
          icon={CheckCircle2}
        />

        <MetricCard
          title={t("Failed")}
          value={failedRuns}
          description={t("Runs needing attention")}
          icon={AlertTriangle}
        />

        <MetricCard
          title={t("Jobs Added")}
          value={totalAdded}
          description={t("Imported records")}
          icon={Database}
        />

        <MetricCard
          title={t("Duplicates")}
          value={totalSkipped}
          description={t("Existing jobs skipped")}
          icon={RotateCcw}
        />
      </section>

      {/* Pipeline status */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={[
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  failedRuns > 0
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary",
                ].join(" ")}
              >
                {failedRuns > 0 ? (
                  <AlertTriangle className="size-5" />
                ) : (
                  <CheckCircle2 className="size-5" />
                )}
              </div>

              <div>
                <p className="font-medium">
                  {totalRuns === 0
                    ? t("No pipeline activity yet")
                    : failedRuns > 0
                      ? t("Pipeline requires attention")
                      : t("Pipeline is healthy")}
                </p>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {totalRuns === 0
                    ? t("Import jobs from an external source to begin tracking ingestion activity.")
                    : failedRuns > 0
                      ? t("Failed runs: {{count}}. Review the execution history below for details.", { count: failedRuns })
                      : t("Successful runs: {{count}}. Jobs added: {{added}}.", { count: successfulRuns, added: totalAdded })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  failedRuns > 0
                    ? "destructive"
                    : "secondary"
                }
              >
                {failedRuns > 0
                  ? t("{{count}} failed", { count: failedRuns })
                  : t("Healthy")}
              </Badge>

              {runningRuns > 0 && (
                <Badge variant="outline">
                  <Clock3 className="size-3" />
                  {t("{{count}} running", { count: runningRuns })}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution history */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-lg">{t("Execution History")}</CardTitle>

              <CardDescription className="mt-1">{t("Recent external data-ingestion runs and their results.")}</CardDescription>
            </div>

            {totalRuns > 0 && (
              <Badge variant="outline">
                {t("{{count}} runs", { count: totalRuns })}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {logs.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <Database className="size-6 text-muted-foreground" />
              </div>

              <h3 className="mt-5 font-semibold">{t("No ingestion logs yet")}</h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t("Pipeline executions will appear here after external jobs are imported into Mihna.")}</p>
            </div>
          ) : (
            <>
              {/* Desktop/tablet table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[950px] text-start text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="px-3 py-3 font-medium">{t("Run")}</th>

                      <th className="px-3 py-3 font-medium">{t("Source")}</th>

                      <th className="px-3 py-3 font-medium">{t("Status")}</th>

                      <th className="px-3 py-3 text-end font-medium">{t("Added")}</th>

                      <th className="px-3 py-3 text-end font-medium">{t("Skipped")}</th>

                      <th className="px-3 py-3 font-medium">{t("Started")}</th>

                      <th className="px-3 py-3 font-medium">{t("Finished")}</th>

                      <th className="px-3 py-3 font-medium">{t("Error")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b transition-colors last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-3 py-4 font-medium">
                          #{log.id}
                        </td>

                        <td className="px-3 py-4">
                          <span className="capitalize">
                            {log.source || t("Unknown")}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <StatusBadge status={log.status} />
                        </td>

                        <td className="px-3 py-4 text-end font-medium">
                          {log.added_count || 0}
                        </td>

                        <td className="px-3 py-4 text-end text-muted-foreground">
                          {log.skipped_count || 0}
                        </td>

                        <td className="whitespace-nowrap px-3 py-4 text-xs text-muted-foreground">
                          {formatDate(log.started_at)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-4 text-xs text-muted-foreground">
                          {log.finished_at
                            ? formatDate(log.finished_at)
                            : "—"}
                        </td>

                        <td className="max-w-56 px-3 py-4">
                          {log.error_message ? (
                            <span
                              className="block truncate text-xs text-destructive"
                              title={localizeMessage(log.error_message)}
                            >
                              {localizeMessage(log.error_message)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{t("Run #")}{log.id}
                        </p>

                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                          {log.source || t("Unknown source")}
                        </p>
                      </div>

                      <StatusBadge status={log.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <SmallMetric
                        label={t("Added")}
                        value={log.added_count || 0}
                      />

                      <SmallMetric
                        label={t("Skipped")}
                        value={log.skipped_count || 0}
                      />
                    </div>

                    <div className="mt-4 space-y-2 border-t pt-4 text-xs">
                      <LogDetail
                        label={t("Started")}
                        value={formatDate(log.started_at)}
                      />

                      <LogDetail
                        label={t("Finished")}
                        value={
                          log.finished_at
                            ? formatDate(log.finished_at)
                            : "—"
                        }
                      />
                    </div>

                    {log.error_message && (
                      <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-xs leading-5 text-destructive">
                        {localizeMessage(log.error_message)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}) {
  useTranslation();
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {typeof value === "number" ? formatNumber(value) : value}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  useTranslation();
  if (status === "success") {
    return (
      <Badge
        variant="secondary"
        className="gap-1.5"
      >
        <CheckCircle2 className="size-3" />{t("Success")}</Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge
        variant="destructive"
        className="gap-1.5"
      >
        <AlertTriangle className="size-3" />{t("Failed")}</Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1.5"
    >
      <Clock3 className="size-3" />
      {status || t("Running")}
    </Badge>
  );
}

function SmallMetric({ label, value }) {
  useTranslation();
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
    </div>
  );
}

function LogDetail({ label, value }) {
  useTranslation();
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="text-end">
        {typeof value === "number" ? formatNumber(value) : value}
      </span>
    </div>
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return t("Unknown");
  }

  return date.toLocaleString(locale());
}

export default IngestionLogsPage;