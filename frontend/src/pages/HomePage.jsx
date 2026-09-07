import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Globe2,
  MapPin,
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
  const filteredJobs = jobs;

  const activeFilters = [];

  if (searchTerm) {
    activeFilters.push(`Search: ${searchTerm}`);
  }

  if (typeFilter !== "All") {
    activeFilters.push(typeFilter);
  }

  if (locationFilter !== "All") {
    activeFilters.push(locationFilter);
  }

  if (sourceFilter !== "All") {
    activeFilters.push(
      sourceFilter === "manual" ? "Manual" : "Remotive"
    );
  }

  if (dateRangeFilter !== "All") {
    activeFilters.push(
      dateRangeFilter === "7d" ? "Last 7 days" : "Last 30 days"
    );
  }

  if (sortOption !== "newest") {
    const labels = {
      oldest: "Oldest first",
      company_az: "Company A–Z",
      title_az: "Title A–Z",
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
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />

        <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <Badge variant="secondary" className="mb-4">
            Job Market Intelligence
          </Badge>

          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Find your next opportunity.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Discover opportunities from multiple sources and use real job
              market data to understand where the industry is moving.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="size-4 text-primary" />
              <span>{totalJobs} opportunities</span>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              <span>{uniqueCompanies} companies on this page</span>
            </div>

            <div className="flex items-center gap-2">
              <Globe2 className="size-4 text-primary" />
              <span>Remote & global roles</span>
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Jobs"
          value={totalJobs}
          description="Available opportunities"
          icon={BriefcaseBusiness}
        />

        <MetricCard
          title="Companies"
          value={uniqueCompanies}
          description="On the current page"
          icon={Building2}
        />

        <MetricCard
          title="Showing"
          value={filteredJobs.length}
          description={`Page ${currentPage} results`}
          icon={Filter}
        />

        <MetricCard
          title="Remote"
          value={remoteJobs}
          description="On the current page"
          icon={Globe2}
        />
      </section>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SlidersHorizontal className="size-5" />
                Refine opportunities
              </CardTitle>

              <CardDescription className="mt-1">
                Narrow the job market using the filters below.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
              >
                <RotateCcw className="size-4" />
                Clear
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onExportJobsCsv}
              >
                <Download className="size-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <FilterSelect
              label="Work type"
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={[
                ["All", "All types"],
                ["Onsite", "Onsite"],
                ["Hybrid", "Hybrid"],
                ["Remote", "Remote"],
              ]}
            />

            <FilterSelect
              label="Location"
              value={locationFilter}
              onValueChange={setLocationFilter}
              options={[
                ["All", "All locations"],
                ["USA", "USA"],
                ["Worldwide", "Worldwide"],
                ["Saudi Arabia", "Saudi Arabia"],
              ]}
            />

            <FilterSelect
              label="Source"
              value={sourceFilter}
              onValueChange={setSourceFilter}
              options={[
                ["All", "All sources"],
                ["manual", "Manual"],
                ["remotive", "Remotive"],
              ]}
            />

            <FilterSelect
              label="Date posted"
              value={dateRangeFilter}
              onValueChange={setDateRangeFilter}
              options={[
                ["All", "All time"],
                ["7d", "Last 7 days"],
                ["30d", "Last 30 days"],
              ]}
            />

            <FilterSelect
              label="Sort"
              value={sortOption}
              onValueChange={setSortOption}
              options={[
                ["newest", "Newest first"],
                ["oldest", "Oldest first"],
                ["company_az", "Company A–Z"],
                ["title_az", "Title A–Z"],
              ]}
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {activeFilters.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  No additional filters applied
                </span>
              ) : (
                <>
                  <span className="mr-1 text-sm text-muted-foreground">
                    Active:
                  </span>

                  {activeFilters.map((filter) => (
                    <Badge key={filter} variant="secondary">
                      {filter}
                    </Badge>
                  ))}
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Per page
              </span>

              <Select
                value={String(pageSize)}
                onValueChange={(value) =>
                  onChangePageSize(Number(value))
                }
              >
                <SelectTrigger className="w-20">
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
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Latest opportunities
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Browse the latest jobs matching your current filters.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {totalJobs === 0
              ? "No jobs"
              : `${filteredJobs.length} shown · ${totalJobs} total`}
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <BriefcaseBusiness className="size-5 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-semibold">
                No opportunities found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try changing your search or removing some filters.
              </p>

              <Button
                variant="outline"
                className="mt-5"
                onClick={onClearFilters}
              >
                <RotateCcw className="size-4" />
                Reset filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
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
      <section className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Page{" "}
          <span className="font-medium text-foreground">
            {currentPage}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {Math.max(totalPages, 1)}
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => onChangePage(currentPage - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => onChangePage(currentPage + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ title, value, description, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
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

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default HomePage;