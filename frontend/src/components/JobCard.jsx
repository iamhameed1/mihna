import { localizeLocation, localizeWorkType, formatSalary as localizedSalary } from "@/i18n/jobs";
import { useTranslation } from "react-i18next";
import { t, locale } from "@/i18n";
import {
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
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

function createSummary(description, maxLength = 110) {
  const cleanText = cleanHtml(description)
    .replace(/\s+/g, " ")
    .trim();

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  return `${cleanText.slice(0, maxLength).trim()}...`;
}

function formatSource(source) {
  if (!source) return t("Manual");

  return source.charAt(0).toUpperCase() + source.slice(1);
}

function formatDate(dateValue) {
  if (!dateValue) return t("Unknown date");

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return t("Unknown date");
  }

  return date.toLocaleDateString(locale(), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLocation(job) {
  const location = [job.city, job.country].filter(Boolean).map(localizeLocation);

  return location.length > 0
    ? location.join(", ")
    : t("Location not specified");
}

function formatSalary(salary) {
  if (!salary) return t("Salary not specified");

  return localizedSalary(salary);
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
  useTranslation();
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
    <Card className="group overflow-hidden transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
      <CardContent className="p-0">
        <div className="grid sm:grid-cols-[minmax(0,1fr)_180px]">
          {/* Main content */}
          <div className="min-w-0 p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Company initial */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-xs font-semibold sm:size-11 sm:rounded-xl sm:text-sm">
                {getCompanyInitial(job.company)}
              </div>

              <div className="min-w-0 flex-1">
                {/* Title */}
                <button
                  type="button"
                  onClick={openDetails}
                  className="block w-full text-start"
                >
                  <h3 dir="auto" className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary sm:text-base">
                    {job.title || t("Untitled position")}
                  </h3>
                </button>

                {/* Company */}
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                  <Building2 className="size-3.5 shrink-0" />

                  <span className="truncate">
                    {job.company || t("Unknown company")}
                  </span>
                </div>

                {/* Salary */}
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {formatSalary(job.salary)}
                </p>

                {/* Metadata */}
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground sm:text-xs">
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" />

                    <span>
                      {formatLocation(job)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <BriefcaseBusiness className="size-3.5 shrink-0" />

                    <span>
                      {localizeWorkType(job.type) || t("Not specified")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <CalendarDays className="size-3.5 shrink-0" />

                    <span>
                      {formatDate(job.created_at)}
                    </span>
                  </div>
                </div>

                {/* Short description preview */}
                {job.description && (
                  <p dir="auto" className="mt-3 line-clamp-2 overflow-hidden text-xs leading-5 text-muted-foreground sm:text-sm">
                    {createSummary(job.description, 110)}
                  </p>
                )}

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge
                    variant="secondary"
                    className="h-5 px-2 text-[10px] sm:text-xs"
                  >
                    {formatSource(job.source)}
                  </Badge>

                  {job.type && (
                    <Badge
                      variant="outline"
                      className="h-5 px-2 text-[10px] sm:text-xs"
                    >
                      {localizeWorkType(job.type)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions panel */}
          <div className="flex h-full flex-col justify-center gap-2 border-t p-3 sm:min-h-full sm:border-s sm:border-t-0">
            {showSaveButton && currentUser?.role !== "company" && (
              <Button
                type="button"
                variant={isSaved ? "secondary" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => onToggleSaveJob?.(job)}
              >
                {isSaved ? (
                  <BookmarkCheck className="size-4" />
                ) : (
                  <Bookmark className="size-4" />
                )}

                {removeMode
                  ? t("Remove")
                  : isSaved
                    ? t("Saved")
                    : t("Save")}
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={openDetails}
            >{t("View details")}<ChevronRight className="size-4" />
            </Button>

            {showEditButton && isCompanyOwner && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onStartEditJob?.(job)}
              >
                <Pencil className="size-4" />{t("Edit")}</Button>
            )}

            {showDeleteButton && isCompanyOwner && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => onDeleteJob?.(job.id)}
              >
                <Trash2 className="size-4" />{t("Delete")}</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default JobCard;
