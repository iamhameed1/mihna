import { useTranslation } from "react-i18next";
import { t, formatNumber } from "@/i18n";
import {
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Globe2,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import JobCard from "../components/JobCard";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function HomePage({
  jobs,
  searchTerm,
  typeFilter,
  setTypeFilter,
  locationFilter,
  setLocationFilter,
  sourceFilter,
  setSourceFilter,
  dateRangeFilter,
  setDateRangeFilter,
  sortOption,
  setSortOption,
  savedJobs,
  onToggleSaveJob,
  onDeleteJob,
  onStartEditJob,
  currentUser,
  onOpenJobDetails,
  currentPage,
  totalPages,
  totalJobs,
  onChangePage,
  pageSize,
  onChangePageSize,
  onClearFilters,
  onExportJobsCsv,
}) {
  useTranslation();
  const filteredJobs = jobs;

  const activeFilters = [];

  if (searchTerm) {
    activeFilters.push(t("Search: {{term}}", { term: searchTerm }));
  }

  if (typeFilter !== "All") {
    activeFilters.push(t(typeFilter));
  }

  if (locationFilter !== "All") {
    activeFilters.push(t(locationFilter));
  }

  if (sourceFilter !== "All") {
    activeFilters.push(
      sourceFilter === "manual" ? t("Manual") : "Remotive"
    );
  }

  if (dateRangeFilter !== "All") {
    activeFilters.push(
      dateRangeFilter === "7d"
        ? t("Last 7 days")
        : t("Last 30 days")
    );
  }

  if (sortOption !== "newest") {
    const labels = {
      oldest: t("Oldest first"),
      company_az: t("Company A–Z"),
      title_az: t("Title A–Z"),
    };

    activeFilters.push(labels[sortOption]);
  }

  const uniqueCompanies = new Set(
    jobs.map((job) => job.company).filter(Boolean)
  ).size;

  const remoteJobs = jobs.filter(
    (job) => job.type?.toLowerCase() === "remote"
  ).length;

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border bg-card sm:rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />

        <div className="relative px-4 py-5 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <Badge
            variant="secondary"
            className="mb-3 text-[10px] sm:text-xs"
          >{t("Job Market Intelligence")}</Badge>

          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-5xl">{t("Find your next opportunity.")}</h1>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground sm:mt-3 sm:text-sm sm:leading-6 lg:text-base">{t("Discover opportunities from multiple sources and use real job market data to understand where the industry is moving.")}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:mt-5 sm:text-sm">
            <div className="flex items-center gap-1.5">
              <BriefcaseBusiness className="size-3.5 text-primary sm:size-4" />
              <span>{t("{{count}} opportunities", { count: totalJobs })}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-primary sm:size-4" />
              <span>{t("{{count}} companies", { count: uniqueCompanies })}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Globe2 className="size-3.5 text-primary sm:size-4" />
              <span>{t("Remote & global")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <MetricCard
          title={t("Total Jobs")}
          value={totalJobs}
          description={t("Available")}
          icon={BriefcaseBusiness}
        />

        <MetricCard
          title={t("Companies")}
          value={uniqueCompanies}
          description={t("Current page")}
          icon={Building2}
        />

        <MetricCard
          title={t("Showing")}
          value={filteredJobs.length}
          description={t("Page {{page}}", { page: currentPage })}
          icon={Filter}
        />

        <MetricCard
          title={t("Remote")}
          value={remoteJobs}
          description={t("Current page")}
          icon={Globe2}
        />
      </section>

      {/* Filters */}
      <Card className="rounded-xl">
        <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <SlidersHorizontal className="size-4 sm:size-5" />{t("Refine opportunities")}</CardTitle>

              <CardDescription className="mt-1 text-xs sm:text-sm">{t("Narrow the job market using the filters below.")}</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onClearFilters}
              >
                <RotateCcw className="size-3.5" />{t("Clear")}</Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onExportJobsCsv}
              >
                <Download className="size-3.5" />{t("Export CSV")}</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <FilterSelect
              label={t("Work type")}
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={[
                ["All", t("All types")],
                ["Onsite", t("Onsite")],
                ["Hybrid", t("Hybrid")],
                ["Remote", t("Remote")],
              ]}
            />

            <FilterSelect
              label={t("Location")}
              value={locationFilter}
              onValueChange={setLocationFilter}
              options={[
                ["All", t("All locations")],
                ["USA", t("USA")],
                ["Worldwide", t("Worldwide")],
                ["Saudi Arabia", t("Saudi Arabia")],
              ]}
            />

            <FilterSelect
              label={t("Source")}
              value={sourceFilter}
              onValueChange={setSourceFilter}
              options={[
                ["All", t("All sources")],
                ["manual", t("Manual")],
                ["remotive", "Remotive"],
              ]}
            />

            <FilterSelect
              label={t("Date posted")}
              value={dateRangeFilter}
              onValueChange={setDateRangeFilter}
              options={[
                ["All", t("All time")],
                ["7d", t("Last 7 days")],
                ["30d", t("Last 30 days")],
              ]}
            />

            <FilterSelect
              label={t("Sort")}
              value={sortOption}
              onValueChange={setSortOption}
              options={[
                ["newest", t("Newest first")],
                ["oldest", t("Oldest first")],
                ["company_az", t("Company A–Z")],
                ["title_az", t("Title A–Z")],
              ]}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {activeFilters.length === 0 ? (
                <span className="text-xs text-muted-foreground sm:text-sm">{t("No additional filters applied")}</span>
              ) : (
                <>
                  <span className="me-1 text-xs text-muted-foreground sm:text-sm">{t("Active:")}</span>

                  {activeFilters.map((filter) => (
                    <Badge
                      key={filter}
                      variant="secondary"
                      className="text-[10px] sm:text-xs"
                    >
                      {filter}
                    </Badge>
                  ))}
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted-foreground sm:text-sm">{t("Per page")}</span>

              <Select
                value={String(pageSize)}
                onValueChange={(value) =>
                  onChangePageSize(Number(value))
                }
              >
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs */}
      <section>
        <div className="mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl lg:text-2xl">{t("Latest opportunities")}</h2>

            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{t("Browse jobs matching your current filters.")}</p>
          </div>

          <div className="text-xs text-muted-foreground sm:text-sm">
            {totalJobs === 0
              ? t("No jobs")
              : t("{{shown}} shown · {{total}} total", { shown: filteredJobs.length, total: totalJobs })}
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex min-h-48 flex-col items-center justify-center p-6 text-center sm:min-h-64">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted sm:size-12">
                <BriefcaseBusiness className="size-4 text-muted-foreground sm:size-5" />
              </div>

              <h3 className="mt-3 text-sm font-semibold sm:mt-4">{t("No opportunities found")}</h3>

              <p className="mt-1 max-w-sm text-xs text-muted-foreground sm:text-sm">{t("Try changing your search or removing some filters.")}</p>

              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onClearFilters}
              >
                <RotateCcw className="size-4" />{t("Reset filters")}</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                savedJobs={savedJobs}
                onToggleSaveJob={onToggleSaveJob}
                onDeleteJob={onDeleteJob}
                onStartEditJob={onStartEditJob}
                currentUser={currentUser}
                onOpenJobDetails={onOpenJobDetails}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pagination */}
      <section className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground sm:text-sm">{t("Page")}{" "}
          <span className="font-medium text-foreground">
            {formatNumber(currentPage)}
          </span>{" "}{t("of")}{" "}
          <span className="font-medium text-foreground">
            {formatNumber(Math.max(totalPages, 1))}
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              disabled={currentPage === 1}
              onClick={() => onChangePage(currentPage - 1)}
            >
              <ChevronLeft className="size-4" />{t("Previous")}</Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              disabled={currentPage === totalPages}
              onClick={() => onChangePage(currentPage + 1)}
            >{t("Next")}<ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </section>
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
    <Card className="rounded-xl">
      <CardContent className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs lg:text-sm">
              {title}
            </p>

            <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
              {typeof value === "number" ? formatNumber(value) : value}
            </p>

            <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">
              {description}
            </p>
          </div>

          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-9 lg:size-10">
            <Icon className="size-4 lg:size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}) {
  useTranslation();
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-muted-foreground sm:text-xs">
        {label}
      </label>

      <Select
        value={typeof value === "number" ? formatNumber(value) : value}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="h-9 w-full text-xs sm:text-sm">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default HomePage;