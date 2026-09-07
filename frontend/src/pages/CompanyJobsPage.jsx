import {
  BriefcaseBusiness,
  Building2,
  Database,
  Plus,
  RefreshCw,
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

function CompanyJobsPage({
  companyJobs,
  currentUser,
  onDeleteJob,
  onStartEditJob,
  onOpenJobDetails,
  onFetchRemotiveJobs,
}) {
  const jobCount = companyJobs.length;

  return (
    <div className="space-y-8">
      {/* Heading */}
      <section>
        <Badge variant="secondary" className="mb-3">
          <Building2 className="size-3.5" />
          Company Workspace
        </Badge>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              My Jobs
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Manage the opportunities posted directly by your company.
              Imported jobs remain platform listings and are managed
              separately.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border bg-card px-4 py-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BriefcaseBusiness className="size-5" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Published jobs
              </p>

              <p className="text-xl font-semibold leading-tight">
                {jobCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data import */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Database className="size-5" />
              </div>

              <div>
                <CardTitle className="text-base">
                  Platform Data Import
                </CardTitle>

                <CardDescription className="mt-1 max-w-2xl leading-5">
                  Import the latest Remotive opportunities into Mihna's
                  platform dataset for job discovery and market analytics.
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={onFetchRemotiveJobs}
            >
              <RefreshCw className="size-4" />
              Import Remotive
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <p className="text-xs leading-5 text-muted-foreground">
              Remotive jobs are read-only platform listings. They appear
              under Discover Jobs and contribute to Mihna analytics, but
              they do not appear in your company's manually posted jobs.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Company jobs */}
      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Published opportunities
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Edit, review, or remove jobs posted by your company.
            </p>
          </div>

          {jobCount > 0 && (
            <Badge variant="outline">
              {jobCount} {jobCount === 1 ? "job" : "jobs"}
            </Badge>
          )}
        </div>

        {jobCount === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <BriefcaseBusiness className="size-6 text-muted-foreground" />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No company jobs yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Your company hasn't published any jobs yet. Use the Post a
                Job section in the company workspace to create your first
                opportunity.
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <Plus className="size-4" />
                Create a job from Post a Job
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {companyJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                currentUser={currentUser}
                onDeleteJob={onDeleteJob}
                onStartEditJob={onStartEditJob}
                showSaveButton={false}
                onOpenJobDetails={onOpenJobDetails}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CompanyJobsPage;