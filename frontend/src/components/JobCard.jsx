import {
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function cleanHtml(html) {
  if (!html) return "";

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  return tempDiv.textContent || tempDiv.innerText || "";
}

function createSummary(description, maxLength = 190) {
  const cleanText = cleanHtml(description);

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  return `${cleanText.slice(0, maxLength).trim()}...`;
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

  return location.length > 0 ? location.join(", ") : "Location not specified";
}

function formatSalary(salary) {
  if (!salary) return "Salary not specified";

  return salary;
}

function getCompanyInitial(company) {
  if (!company) return "M";

  return company.trim().charAt(0).toUpperCase();
}

function JobCard({
  job,
  savedJobs = [],
  onToggleSaveJob,
  onDeleteJob,
  onStartEditJob,
  onOpenJobDetails,
  currentUser,
  showSaveButton = true,
  showEditButton = true,
  showDeleteButton = true,
  removeMode = false,
}) {
  const isSaved = savedJobs.some(
    (savedJob) => savedJob.id === job.id
  );

  const isCompanyOwner =
    currentUser?.role === "company" &&
    job.owner_id === currentUser.id;

  function openDetails() {
    onOpenJobDetails?.(job);
  }

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Main clickable area */}
          <button
            type="button"
            onClick={openDetails}
            className="min-w-0 flex-1 cursor-pointer p-5 text-left sm:p-6"
          >
            <div className="flex items-start gap-4">
              {/* Company mark */}
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/50 text-sm font-semibold text-foreground sm:size-12">
                {getCompanyInitial(job.company)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary sm:text-lg">
                      {job.title || "Untitled position"}
                    </h3>

                    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {job.company || "Unknown company"}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-sm font-semibold text-foreground">
                    {formatSalary(job.salary)}
                  </div>
                </div>

                {/* Job metadata */}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    <span>{formatLocation(job)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <BriefcaseBusiness className="size-3.5" />
                    <span>{job.type || "Not specified"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    <span>{formatDate(job.created_at)}</span>
                  </div>
                </div>

                {/* Description */}
                {job.description && (
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {createSummary(job.description)}
                  </p>
                )}

                {/* Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {formatSource(job.source)}
                  </Badge>

                  {job.type && (
                    <Badge variant="outline">
                      {job.type}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </button>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 border-t bg-muted/20 px-5 py-4 sm:w-48 sm:flex-col sm:items-stretch sm:justify-center sm:border-l sm:border-t-0 sm:px-4">
            {showSaveButton && currentUser?.role !== "company" && (
              <Button
                type="button"
                variant={isSaved ? "secondary" : "outline"}
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => onToggleSaveJob?.(job)}
              >
                {isSaved ? (
                  <BookmarkCheck className="size-4" />
                ) : (
                  <Bookmark className="size-4" />
                )}

                {removeMode
                  ? "Remove"
                  : isSaved
                    ? "Saved"
                    : "Save"}
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={openDetails}
            >
              View details
              <ExternalLink className="size-4" />
            </Button>

            {showEditButton && isCompanyOwner && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onStartEditJob?.(job)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            )}

            {showDeleteButton && isCompanyOwner && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onDeleteJob?.(job.id)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default JobCard;