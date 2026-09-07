import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  Globe2,
  MapPin,
  Pencil,
  Trash2,
  WalletCards,
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

function cleanHtml(html) {
  if (!html) return "";

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  return tempDiv.textContent || tempDiv.innerText || "";
}

function formatSource(source) {
  if (!source) return "Manual";

  return source.charAt(0).toUpperCase() + source.slice(1);
}

function formatDate(dateValue) {
  if (!dateValue) return "Unknown date";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLocation(job) {
  const location = [job.city, job.country].filter(Boolean);

  return location.length > 0
    ? location.join(", ")
    : "Location not specified";
}

function getCompanyInitial(company) {
  if (!company) return "M";

  return company.trim().charAt(0).toUpperCase();
}

function JobDetailsPage({
  job,
  currentUser,
  savedJobs,
  onToggleSaveJob,
  onDeleteJob,
  onStartEditJob,
  setPage,
}) {
  if (!job) {
    return (
      <Card className="mx-auto max-w-xl border-dashed">
        <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <BriefcaseBusiness className="size-6 text-muted-foreground" />
          </div>

          <h1 className="mt-5 text-xl font-semibold">
            Job not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            This opportunity may no longer be available.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => setPage("home")}
          >
            <ArrowLeft className="size-4" />
            Back to jobs
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isSaved = savedJobs.some(
    (savedJob) => savedJob.id === job.id
  );

  const isCompanyOwner =
    currentUser?.role === "company" &&
    job.owner_id === currentUser.id;

  const cleanDescription = cleanHtml(job.description);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        type="button"
        variant="ghost"
        className="-ml-2"
        onClick={() => setPage("home")}
      >
        <ArrowLeft className="size-4" />
        Back to jobs
      </Button>

      {/* Job hero */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-primary" />

        <CardContent className="p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted/50 text-lg font-semibold sm:size-14">
                {getCompanyInitial(job.company)}
              </div>

              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {formatSource(job.source)}
                  </Badge>

                  {job.type && (
                    <Badge variant="outline">
                      {job.type}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                  {job.title || "Untitled position"}
                </h1>

                <div className="mt-3 flex items-center gap-2 text-sm font-medium">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span>
                    {job.company || "Unknown company"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {formatLocation(job)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <BriefcaseBusiness className="size-4" />
                    {job.type || "Not specified"}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-4" />
                    Posted {formatDate(job.created_at)}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 lg:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Salary
              </p>

              <p className="mt-1 text-xl font-semibold tracking-tight">
                {job.salary || "Not specified"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="size-5 text-primary" />
                Job Description
              </CardTitle>

              <CardDescription>
                Role details and requirements provided by the employer.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {cleanDescription ? (
                <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                  {cleanDescription}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No description was provided for this opportunity.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Opportunity details
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                icon={Building2}
                label="Company"
                value={job.company || "Not specified"}
              />

              <DetailItem
                icon={MapPin}
                label="Location"
                value={formatLocation(job)}
              />

              <DetailItem
                icon={BriefcaseBusiness}
                label="Work type"
                value={job.type || "Not specified"}
              />

              <DetailItem
                icon={WalletCards}
                label="Salary"
                value={job.salary || "Not specified"}
              />

              <DetailItem
                icon={Globe2}
                label="Source"
                value={formatSource(job.source)}
              />

              <DetailItem
                icon={CalendarDays}
                label="Posted"
                value={formatDate(job.created_at)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <aside>
          <div className="space-y-4 xl:sticky xl:top-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Interested in this role?
                </CardTitle>

                <CardDescription>
                  Continue to the original listing for application details.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2">
                {job.link ? (
                  <Button
                    className="w-full"
                    render={
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  >
                    Apply / View Original
                    <ExternalLink className="size-4" />
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled
                  >
                    Application unavailable
                  </Button>
                )}

                {currentUser?.role !== "company" && (
                  <Button
                    type="button"
                    variant={
                      isSaved
                        ? "secondary"
                        : "outline"
                    }
                    className="w-full"
                    onClick={() =>
                      onToggleSaveJob(job)
                    }
                  >
                    {isSaved ? (
                      <BookmarkCheck className="size-4" />
                    ) : (
                      <Bookmark className="size-4" />
                    )}

                    {isSaved
                      ? "Saved"
                      : "Save Job"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {isCompanyOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Manage Job
                  </CardTitle>

                  <CardDescription>
                    You posted this opportunity.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      onStartEditJob(job)
                    }
                  >
                    <Pencil className="size-4" />
                    Edit Job
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={() =>
                      onDeleteJob(job.id)
                    }
                  >
                    <Trash2 className="size-4" />
                    Delete Job
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs leading-5 text-muted-foreground">
                This listing was added to Mihna through{" "}
                <span className="font-medium text-foreground">
                  {formatSource(job.source)}
                </span>
                .
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium">
          {value}
        </p>
      </div>
    </div>
  );
}

export default JobDetailsPage;