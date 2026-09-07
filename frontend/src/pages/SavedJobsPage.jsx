import {
  Bookmark,
  BriefcaseBusiness,
  Search,
} from "lucide-react";

import JobCard from "../components/JobCard";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

function SavedJobsPage({
  savedJobs,
  onToggleSaveJob,
  onOpenJobDetails,
}) {
  const savedCount = savedJobs.length;

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <section>
        <Badge variant="secondary" className="mb-3">
          <Bookmark className="size-3.5" />
          Saved Opportunities
        </Badge>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Saved Jobs
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Keep track of opportunities you're interested in and return to
              them whenever you're ready.
            </p>
          </div>

          {savedCount > 0 && (
            <div className="flex shrink-0 items-center gap-2 rounded-xl border bg-card px-4 py-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bookmark className="size-4" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Saved
                </p>

                <p className="text-lg font-semibold leading-none">
                  {savedCount}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Saved jobs */}
      {savedCount === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <Bookmark className="size-6 text-muted-foreground" />
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              No saved jobs yet
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              When you find an opportunity that interests you, save it and
              it will appear here for easy access later.
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Search className="size-4" />
              Discover jobs and select Save
            </div>
          </CardContent>
        </Card>
      ) : (
        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Your opportunities
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {savedCount}{" "}
                {savedCount === 1
                  ? "job saved"
                  : "jobs saved"}
              </p>
            </div>

            <BriefcaseBusiness className="size-5 text-muted-foreground" />
          </div>

          <div className="grid gap-4">
            {savedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                savedJobs={savedJobs}
                onToggleSaveJob={onToggleSaveJob}
                showEditButton={false}
                showDeleteButton={false}
                removeMode={true}
                onOpenJobDetails={onOpenJobDetails}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default SavedJobsPage;