import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function RegisterPage({ onRegister, setPage }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "job_seeker",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleRoleChange(role) {
    setFormData((current) => ({
      ...current,
      role,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      await onRegister(formData);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border bg-card shadow-sm lg:min-h-[720px] lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-muted/40 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setPage("home")}
            className="flex items-center gap-3"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Building2 className="size-5" />
            </div>

            <div className="text-left">
              <p className="font-semibold tracking-tight">
                Mihna
              </p>

              <p className="text-xs text-muted-foreground">
                Job Intelligence
              </p>
            </div>
          </button>

          <div className="mt-14 max-w-md">
            <Badge variant="secondary">
              Start with Mihna
            </Badge>

            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
              One platform for job seekers and companies.
            </h1>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Choose the workspace that fits you and get
              access to Mihna's job discovery and market
              intelligence tools.
            </p>
          </div>

          <div className="mt-10 space-y-5">
            <Feature
              icon={Search}
              title="Discover opportunities"
              description="Explore jobs collected from companies and external sources."
            />

            <Feature
              icon={BriefcaseBusiness}
              title="Save interesting jobs"
              description="Job seekers can build a personal collection of opportunities."
            />

            <Feature
              icon={Building2}
              title="Build your company presence"
              description="Companies can publish jobs and access hiring analytics."
            />

            <Feature
              icon={ShieldCheck}
              title="Role-based workspace"
              description="Your Mihna experience adapts to the account type you choose."
            />
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground">
          Mihna · Job Market Intelligence Platform
        </p>
      </section>

      {/* Registration form */}
      <section className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <button
              type="button"
              onClick={() => setPage("home")}
              className="flex items-center gap-3"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Building2 className="size-4" />
              </div>

              <span className="font-semibold tracking-tight">
                Mihna
              </span>
            </button>
          </div>

          <div>
            <Badge variant="secondary" className="mb-3">
              Account
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight">
              Create your account
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Choose your account type and enter your
              details to get started.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Account type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Account type
              </label>

              <div className="grid grid-cols-2 gap-3">
                <RoleButton
                  active={formData.role === "job_seeker"}
                  icon={UserRound}
                  title="Job Seeker"
                  description="Find & save jobs"
                  onClick={() =>
                    handleRoleChange("job_seeker")
                  }
                />

                <RoleButton
                  active={formData.role === "company"}
                  icon={Building2}
                  title="Company"
                  description="Post & analyze"
                  onClick={() =>
                    handleRoleChange("company")
                  }
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label
                htmlFor="register-name"
                className="text-sm font-medium"
              >
                Name
              </label>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="register-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  autoComplete="name"
                  placeholder={
                    formData.role === "company"
                      ? "Company name"
                      : "Ahmed"
                  }
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="register-email"
                className="text-sm font-medium"
              >
                Email
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="register-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  autoComplete="email"
                  placeholder="ahmed@example.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="register-password"
                className="text-sm font-medium"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="register-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="px-9"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters
                </p>

                {formData.password && (
                  <p className="text-xs text-muted-foreground">
                    {formData.password.length}/8+
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Creating account..."
                : "Create account"}

              {!isSubmitting && (
                <ArrowRight className="size-4" />
              )}
            </Button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border" />

              <span className="text-xs text-muted-foreground">
                Already have an account?
              </span>

              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setPage("login")}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
            Your workspace and available features depend on
            whether you register as a job seeker or company.
          </p>
        </div>
      </section>
    </div>
  );
}

function RoleButton({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-primary/10 ring-1 ring-primary/20"
          : "bg-background hover:bg-muted/50",
      ].join(" ")}
    >
      <div
        className={[
          "flex size-9 items-center justify-center rounded-lg",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        <Icon className="size-4" />
      </div>

      <p className="mt-3 text-sm font-medium">
        {title}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </button>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background/60 text-primary">
        <Icon className="size-4" />
      </div>

      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;