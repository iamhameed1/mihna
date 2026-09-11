import {
  Building2,
  CircleAlert,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import AccountSettings from "@/components/AccountSettings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function AccountPage({ currentUser, token, onUserUpdated }) {
  if (!currentUser) {
    return (
      <Card className="mx-auto max-w-xl border-dashed">
        <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <CircleAlert className="size-6 text-muted-foreground" />
          </div>

          <h1 className="mt-5 text-xl font-semibold">
            Sign in required
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in to view your Mihna account.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isCompany = currentUser.role === "company";

  const roleLabel = isCompany
    ? "Company"
    : "Job Seeker";

  const RoleIcon = isCompany
    ? Building2
    : UserRound;

  const initial =
    currentUser.name?.trim().charAt(0).toUpperCase() ||
    "M";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Heading */}
      <section>
        <Badge variant="secondary" className="mb-3">
          <UserRound className="size-3.5" />
          Account
        </Badge>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          My Account
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Manage your Mihna profile, email, and password.
        </p>
      </section>

      {/* Profile hero */}
      <Card className="overflow-hidden">
        <div className="h-1" />

        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground shadow-sm">
              {initial}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-semibold tracking-tight">
                  {currentUser.name}
                </h2>

                <Badge variant="secondary">
                  <RoleIcon className="size-3.5" />
                  {roleLabel}
                </Badge>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0" />

                <span className="truncate">
                  {currentUser.email}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AccountSettings currentUser={currentUser} token={token} onUserUpdated={onUserUpdated} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Account information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Account Information
            </CardTitle>

            <CardDescription>
              Basic information associated with your Mihna account.
            </CardDescription>
          </CardHeader>

          <CardContent className="divide-y">
            <AccountRow
              icon={UserRound}
              label="Name"
              value={currentUser.name}
            />

            <AccountRow
              icon={Mail}
              label="Email"
              value={currentUser.email}
            />

            <AccountRow
              icon={RoleIcon}
              label="Account type"
              value={roleLabel}
            />
          </CardContent>
        </Card>

        {/* Workspace */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" />
              Your Workspace
            </CardTitle>

            <CardDescription>
              Features available for your account type.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isCompany ? (
              <div className="space-y-4">
                <WorkspaceFeature
                  title="Publish jobs"
                  description="Create and manage opportunities for your company."
                />

                <WorkspaceFeature
                  title="Company dashboard"
                  description="Monitor your job listings and hiring data."
                />

                <WorkspaceFeature
                  title="Market analytics"
                  description="Explore trends across Mihna's job-market dataset."
                />

                <WorkspaceFeature
                  title="Data ingestion"
                  description="Monitor external job-data imports."
                />
              </div>
            ) : (
              <div className="space-y-4">
                <WorkspaceFeature
                  title="Discover jobs"
                  description="Explore opportunities from companies and external sources."
                />

                <WorkspaceFeature
                  title="Save opportunities"
                  description="Keep interesting jobs in your personal saved list."
                />

                <WorkspaceFeature
                  title="Job details"
                  description="Review role information and continue to applications."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AccountRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium">
          {value || "Not available"}
        </p>
      </div>
    </div>
  );
}

function WorkspaceFeature({
  title,
  description,
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />

      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export default AccountPage;
