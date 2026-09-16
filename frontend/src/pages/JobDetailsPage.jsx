import { localizeLocation, localizeWorkType, formatSalary as localizedSalary } from "@/i18n/jobs";
import { useTranslation } from "react-i18next";
import { t, locale } from "@/i18n";
import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
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

function getCompanyInitial(company) {
  if (!company) return "M";

  return company.trim().charAt(0).toUpperCase();
}

/*
 * Organizes job descriptions into readable sections.
 *
 * Long descriptions are collapsed initially.
 * Short descriptions are shown completely without
 * displaying an unnecessary Read more button.
 */
function JobDescription({ description }) {
  useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);

  const contentRef = useRef(null);

  const parser = new DOMParser();

  const documentObject = parser.parseFromString(
    description || "",
    "text/html"
  );

  const rawText =
    documentObject.body.textContent
      ?.replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .trim() || "";

  /*
   * Common headings found in job descriptions.
   * We insert line breaks before them to improve readability.
   */
  const headingPattern =
    /(Title\s*:|Location\s*:|Reports To\s*:|About (?:Us|the Role|the Company)|The Role|Role Overview|Job Summary|Job Description|What You['’]ll Do|What You['’]ll Own|Responsibilities|Key Responsibilities|Requirements|Qualifications|Required Qualifications|Preferred Qualifications|Skills|Experience|Drive Transformation|Build Capability\s*&\s*Culture|Align\s*&\s*Influence|What We['’]re Looking For|Who You Are|Benefits|What We Offer|Why [A-Za-z0-9 &'’.-]+)/gi;

  const normalized = rawText
    .replace(headingPattern, "\n\n$1")
    .replace(/\s+[•●▪]\s*/g, "\n• ")
    .replace(/\s+-\s+/g, "\n• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  /*
   * Measure the actual rendered description.
   *
   * Approximately 10 lines of normal description text.
   */
  useEffect(() => {
    const element = contentRef.current;

    if (!element) return;

    function checkOverflow() {
      /*
       * Temporarily remove the height restriction so we can
       * determine the actual content height.
       */
      const actualHeight = element.scrollHeight;

      /*
       * 280px is approximately 10 lines with our current
       * typography and spacing.
       */
      setNeedsToggle(actualHeight > 280);
    }

    checkOverflow();

    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, [description]);

  if (!description) {
    return (
      <p className="text-sm text-muted-foreground">{t("No description was provided for this opportunity.")}</p>
    );
  }

  function isHeading(paragraph) {
    return /^(Title\s*:|Location\s*:|Reports To\s*:|About |The Role$|Role Overview|Job Summary|Job Description|What You['’]ll Do|What You['’]ll Own|Responsibilities|Key Responsibilities|Requirements|Qualifications|Required Qualifications|Preferred Qualifications|Skills|Experience|Drive Transformation|Build Capability|Align & Influence|What We['’]re Looking For|Who You Are|Benefits|What We Offer|Why )/i.test(
      paragraph
    );
  }

  return (
    <div>
      {/* Description content */}
      <div
        dir="auto" ref={contentRef}
        className={[
          "relative space-y-4 overflow-hidden",
          needsToggle && !expanded
            ? "max-h-[280px]"
            : "",
        ].join(" ")}
      >
        {paragraphs.map((paragraph, index) => {
          /*
           * Heading
           */
          if (
            isHeading(paragraph) &&
            paragraph.length < 140
          ) {
            return (
              <h3
                key={index}
                className="pt-1 text-sm font-semibold leading-6 tracking-tight text-foreground sm:text-base"
              >
                {paragraph}
              </h3>
            );
          }

          /*
           * Bullet list
           */
          if (paragraph.startsWith("•")) {
            const items = paragraph
              .split("•")
              .map((item) => item.trim())
              .filter(Boolean);

            return (
              <ul
                key={index}
                className="list-disc space-y-2 ps-5 text-sm leading-7 text-muted-foreground sm:text-[15px]"
              >
                {items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="ps-1"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            );
          }

          /*
           * Normal paragraph
           */
          return (
            <p
              key={index}
              className="text-sm leading-7 text-muted-foreground sm:text-[15px]"
            >
              {paragraph}
            </p>
          );
        })}

        {/* Fade when collapsed */}
        {needsToggle && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card via-card/90 to-transparent" />
        )}
      </div>

      {/* Read more / Show less */}
      {needsToggle && (
        <button
          type="button"
          onClick={() =>
            setExpanded((current) => !current)
          }
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:underline"
        >
          {expanded ? t("Show less") : t("Read more")}

          <ChevronDown
            className={[
              "size-4 transition-transform duration-200",
              expanded ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
      )}
    </div>
  );
}

function JobDetailsPage({
  job,
  currentUser,
  savedJobs = [],
  onToggleSaveJob,
  onDeleteJob,
  onStartEditJob,
  onBack,
}) {
  useTranslation();
  if (!job) {
    return (
      <Card className="mx-auto max-w-xl border-dashed">
        <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 text-center sm:min-h-80">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted sm:size-14 sm:rounded-2xl">
            <BriefcaseBusiness className="size-5 text-muted-foreground sm:size-6" />
          </div>

          <h1 dir="auto" className="mt-4 text-lg font-semibold sm:mt-5 sm:text-xl">{t("Job not found")}</h1>

          <p className="mt-2 text-sm text-muted-foreground">{t("This opportunity may no longer be available.")}</p>

          <Button
            type="button"
            variant="outline"
            className="mt-5 sm:mt-6"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />{t("Back to jobs")}</Button>
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ms-2"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />{t("Back to jobs")}</Button>

      {/* Job hero */}
      <Card className="overflow-hidden">

        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:gap-5">
              {/* Company icon */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-sm font-semibold sm:size-14 sm:rounded-xl sm:text-lg">
                {getCompanyInitial(job.company)}
              </div>

              <div className="min-w-0">
                {/* Badges */}
                <div className="mb-2 flex flex-wrap gap-1.5 sm:mb-3 sm:gap-2">
                  <Badge
                    variant="secondary"
                    className="text-[10px] sm:text-xs"
                  >
                    {formatSource(job.source)}
                  </Badge>

                  {job.type && (
                    <Badge
                      variant="outline"
                      className="text-[10px] sm:text-xs"
                    >
                      {localizeWorkType(job.type)}
                    </Badge>
                  )}
                </div>

                {/* Job title */}
                <h1 dir="auto" className="text-xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                  {job.title || t("Untitled position")}
                </h1>

                {/* Company */}
                <div className="mt-2 flex items-center gap-2 text-xs font-medium sm:mt-3 sm:text-sm">
                  <Building2 className="size-3.5 text-muted-foreground sm:size-4" />

                  <span>
                    {job.company || t("Unknown company")}
                  </span>
                </div>

                {/* Metadata */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:mt-4 sm:gap-x-5 sm:gap-y-2 sm:text-sm">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 sm:size-4" />

                    {formatLocation(job)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <BriefcaseBusiness className="size-3.5 sm:size-4" />

                    {localizeWorkType(job.type) || t("Not specified")}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 sm:size-4" />

                    {formatDate(job.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Salary */}
            <div className="border-t pt-4 lg:border-0 lg:pt-0 lg:text-end">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{t("Salary")}</p>

              <p className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                {localizedSalary(job.salary)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main layout */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main content */}
        <div className="min-w-0 space-y-4 sm:space-y-6">
          {/* Job description */}
          <Card>
            <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="size-4 text-primary sm:size-5" />{t("Job Description")}</CardTitle>

              <CardDescription className="text-xs sm:text-sm">{t("Role details and requirements provided by the employer.")}</CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <JobDescription
                description={job.description}
              />
            </CardContent>
          </Card>

          {/* Opportunity details */}
          <Card>
            <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
              <CardTitle className="text-base">{t("Opportunity details")}</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:gap-5 sm:p-6 sm:pt-0">
              <DetailItem
                icon={Building2}
                label={t("Company")}
                value={job.company || t("Not specified")}
              />

              <DetailItem
                icon={MapPin}
                label={t("Location")}
                value={formatLocation(job)}
              />

              <DetailItem
                icon={BriefcaseBusiness}
                label={t("Work type")}
                value={localizeWorkType(job.type) || t("Not specified")}
              />

              <DetailItem
                icon={WalletCards}
                label={t("Salary")}
                value={localizedSalary(job.salary)}
              />

              <DetailItem
                icon={Globe2}
                label={t("Source")}
                value={formatSource(job.source)}
              />

              <DetailItem
                icon={CalendarDays}
                label={t("Posted")}
                value={formatDate(job.created_at)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <aside>
          <div className="space-y-4 xl:sticky xl:top-24">
            {/* Application */}
            <Card>
              <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                <CardTitle className="text-base">{t("Interested in this role?")}</CardTitle>

                <CardDescription className="text-xs sm:text-sm">{t("Continue to the original listing for application details.")}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 p-4 pt-0 sm:p-6 sm:pt-0">
                {job.link ? (
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >{t("Apply / View Original")}<ExternalLink className="size-4" />
                  </a>
                ) : (
                  <Button
                    className="w-full"
                    disabled
                  >{t("Application unavailable")}</Button>
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
                      onToggleSaveJob?.(job)
                    }
                  >
                    {isSaved ? (
                      <BookmarkCheck className="size-4" />
                    ) : (
                      <Bookmark className="size-4" />
                    )}

                    {isSaved
                      ? t("Saved")
                      : t("Save Job")}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Company controls */}
            {isCompanyOwner && (
              <Card>
                <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                  <CardTitle className="text-base">{t("Manage Job")}</CardTitle>

                  <CardDescription>{t("You posted this opportunity.")}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 p-4 pt-0 sm:p-6 sm:pt-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      onStartEditJob?.(job)
                    }
                  >
                    <Pencil className="size-4" />{t("Edit Job")}</Button>

                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={() =>
                      onDeleteJob?.(job.id)
                    }
                  >
                    <Trash2 className="size-4" />{t("Delete Job")}</Button>
                </CardContent>
              </Card>
            )}

            {/* Source */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs leading-5 text-muted-foreground">{t("This listing was added to Mihna through")}{" "}
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
  useTranslation();
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:size-9">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground sm:text-xs">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-medium sm:mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}

export default JobDetailsPage;
