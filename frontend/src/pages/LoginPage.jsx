import { localizeMessage } from "@/i18n";
import { useTranslation } from "react-i18next";
import { t } from "@/i18n";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import PasswordRecovery from "@/components/PasswordRecovery";

function LoginPage({ onLogin, onGoogleLogin, authMessage }) {
  useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recovering, setRecovering] = useState(false);

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

async function handleGoogleCode(code) {
  if (isSubmitting) return;

  setError("");
  setIsSubmitting(true);

  try {
    await onGoogleLogin({
      code,
      redirect_uri: window.location.origin,
      password: formData.password || undefined,
    });
  } catch (failure) {
    setError(failure.message);
  } finally {
    setIsSubmitting(false);
  }
}

  if (recovering) {
    return <PasswordRecovery initialEmail={formData.email} onBack={() => setRecovering(false)} />;
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-[1fr_0.9fr]">
      {/* Left information panel */}
      <section className="relative hidden overflow-hidden bg-muted/40 p-8 lg:flex lg:flex-col lg:justify-between xl:p-10">
        <div className="absolute inset-0 bg-linear-to-br from-primary/15 via-transparent to-transparent" />

        <div className="relative">
          {/* Brand */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Building2 className="size-5" />
            </div>

            <div className="text-start">
              <p className="font-semibold tracking-tight">{t("Mihna")}</p>

              <p className="text-xs text-muted-foreground">{t("Job Intelligence")}</p>
            </div>
          </button>

          {/* Hero */}
          <div className="mt-10 max-w-md xl:mt-12">
            <Badge variant="secondary">
              <Sparkles className="size-3.5" />{t("Your career workspace")}</Badge>

            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">{t("Opportunities and market intelligence in one place.")}</h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("Sign in to save opportunities or access your company's hiring and analytics workspace.")}</p>
          </div>

          {/* Features */}
          <div className="mt-8 space-y-4">
            <Feature
              icon={BriefcaseBusiness}
              title={t("Discover opportunities")}
              description={t("Explore jobs collected from companies and external sources.")}
            />

            <Feature
              icon={ShieldCheck}
              title={t("Personal workspace")}
              description={t("Save jobs or manage company listings through your account.")}
            />

            <Feature
              icon={Building2}
              title={t("Market intelligence")}
              description={t("Understand hiring trends using Mihna's job-market dataset.")}
            />
          </div>
        </div>

        <p className="relative mt-8 text-xs text-muted-foreground">{t("Mihna · Job Market Intelligence Platform")}</p>
      </section>

      {/* Login section */}
      <section className="flex items-center justify-center p-5 sm:p-7 lg:p-8 xl:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile/tablet brand */}
          <div className="mb-6 lg:hidden">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-3"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Building2 className="size-4" />
              </div>

              <div className="text-start">
                <div className="font-semibold tracking-tight">{t("Mihna")}</div>

                <div className="text-xs text-muted-foreground">{t("Job Intelligence")}</div>
              </div>
            </button>
          </div>

          {/* Heading */}
          <div>
            <Badge variant="secondary" className="mb-2">{t("Account")}</Badge>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("Welcome back")}</h1>

            <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{t("Enter your account details to continue to Mihna.")}</p>
          </div>

          {/* Login form */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >
            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <p>{localizeMessage(error)}</p>
              </div>
            )}

            {/* Authentication message */}
            {authMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>{localizeMessage(authMessage)}</p>
              </div>
            )}

            <GoogleSignInButton
              onCode={handleGoogleCode}
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />{t("or sign in with email")}<div className="h-px flex-1 bg-border" />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-sm font-medium"
              >{t("Email")}</label>

              <div className="relative">
                <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="login-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  dir="ltr" type="email"
                  autoComplete="email"
                  placeholder="ahmed@example.com"
                  className="h-10 ps-9"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="text-sm font-medium"
              >{t("Password")}</label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="login-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t("Enter your password")}
                  className="h-10 px-9"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute end-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={
                    showPassword
                      ? t("Hide password")
                      : t("Show password")
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

            {/* Sign in */}
            <Button type="button" variant="link" className="h-auto px-0" disabled={isSubmitting}
              onClick={() => { setFormData((current) => ({ ...current, password: "" })); setRecovering(true); }}>{t("Forgot password?")}</Button>
            <Button
              type="submit"
              className="h-10 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("Signing in...")
                : t("Sign in")}

              {!isSubmitting && (
                <ArrowRight className="size-4" />
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border" />

              <span className="whitespace-nowrap text-xs text-muted-foreground">{t("New to Mihna?")}</span>

              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Register */}
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full"
              onClick={() => navigate("/register")}
            >{t("Create an account")}</Button>
          </form>

          {/* Account descriptions */}
          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">{t("Job seekers can save opportunities. Company accounts can publish jobs and access market intelligence tools.")}</p>
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
  useTranslation();
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background/60 text-primary">
        <Icon className="size-4" />
      </div>

      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-0.5 max-w-sm text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
