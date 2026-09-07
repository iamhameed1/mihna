import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
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
import { Input } from "@/components/ui/input";

function LoginPage({ onLogin, authMessage, setPage }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      setIsSubmitting(true);

      await onLogin(formData);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border bg-card shadow-sm lg:min-h-[650px] lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand / information panel */}
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

          <div className="mt-16 max-w-md">
            <Badge variant="secondary">
              <Sparkles className="size-3.5" />
              Your career workspace
            </Badge>

            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
              Opportunities and market intelligence in one place.
            </h1>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Sign in to save opportunities or access your
              company's hiring and analytics workspace.
            </p>
          </div>

          <div className="mt-10 space-y-5">
            <Feature
              icon={BriefcaseBusiness}
              title="Discover opportunities"
              description="Explore jobs collected from companies and external sources."
            />

            <Feature
              icon={ShieldCheck}
              title="Personal workspace"
              description="Save jobs or manage company listings through your account."
            />

            <Feature
              icon={Building2}
              title="Market intelligence"
              description="Understand hiring trends using Mihna's job-market dataset."
            />
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground">
          Mihna · Job Market Intelligence Platform
        </p>
      </section>

      {/* Login */}
      <section className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
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
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Enter your account details to continue to Mihna.
            </p>
          </div>

          <Card className="mt-8 border-0 bg-transparent shadow-none">
            <CardHeader className="sr-only">
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Login to your Mihna account.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {authMessage && (
                  <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p>{authMessage}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="login-email"
                    className="text-sm font-medium"
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="login-email"
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

                <div className="space-y-2">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-medium"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="login-password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="px-9"
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
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Signing in..."
                    : "Sign in"}

                  {!isSubmitting && (
                    <ArrowRight className="size-4" />
                  )}
                </Button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border" />

                  <span className="text-xs text-muted-foreground">
                    New to Mihna?
                  </span>

                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setPage("register")}
                >
                  Create an account
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
            Job seekers can save opportunities. Company
            accounts can publish jobs and access market
            intelligence tools.
          </p>
        </div>
      </section>
    </div>
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

export default LoginPage;