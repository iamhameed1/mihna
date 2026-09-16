import { localizeMessage } from "@/i18n";
import { useTranslation } from "react-i18next";
import { t } from "@/i18n";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import EmailVerification from "@/components/EmailVerification";
import { sendVerificationCode } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function RegisterPage({ onRegister }) {
  useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "job_seeker",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

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
      setError(t("Password must be at least 8 characters."));
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      const user = await onRegister(formData);
      setFormData((current) => ({ ...current, password: "" }));
      let message;
      try {
        message = (await sendVerificationCode(user.email)).message;
      } catch (failure) {
        message = { key: "Account created. {{error}} You can sign in and verify later from Account.", values: { error: localizeMessage(failure.message) } };
      }
      setVerificationMessage(message);
      setRegisteredEmail(user.email);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (registeredEmail) {
    return <Card className="mx-auto max-w-md">
      <CardHeader><CardTitle>{t("Verify your email")}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <EmailVerification email={registeredEmail} initialMessage={localizeMessage(verificationMessage)} />
        <Button type="button" variant="outline" onClick={() => navigate("/login")}>{t("Continue to sign in")}</Button>
      </CardContent>
    </Card>;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border bg-card shadow-sm lg:min-h-[720px] lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-muted/40 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent" />

        <div className="relative">
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

          <div className="mt-14 max-w-md">
            <Badge variant="secondary">{t("Start with Mihna")}</Badge>

            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">{t("One platform for job seekers and companies.")}</h1>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">{t("Choose the workspace that fits you and get access to Mihna's job discovery and market intelligence tools.")}</p>
          </div>

          <div className="mt-10 space-y-5">
            <Feature
              icon={Search}
              title={t("Discover opportunities")}
              description={t("Explore jobs collected from companies and external sources.")}
            />

            <Feature
              icon={BriefcaseBusiness}
              title={t("Save interesting jobs")}
              description={t("Job seekers can build a personal collection of opportunities.")}
            />

            <Feature
              icon={Building2}
              title={t("Build your company presence")}
              description={t("Companies can publish jobs and access hiring analytics.")}
            />

            <Feature
              icon={ShieldCheck}
              title={t("Role-based workspace")}
              description={t("Your Mihna experience adapts to the account type you choose.")}
            />
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground">{t("Mihna · Job Market Intelligence Platform")}</p>
      </section>

      {/* Registration form */}
      <section className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-3"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Building2 className="size-4" />
              </div>

              <span className="font-semibold tracking-tight">{t("Mihna")}</span>
            </button>
          </div>

          <div>
            <Badge variant="secondary" className="mb-3">{t("Account")}</Badge>

            <h1 className="text-3xl font-semibold tracking-tight">{t("Create your account")}</h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("Choose your account type and enter your details to get started.")}</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <p>{localizeMessage(error)}</p>
              </div>
            )}

            {/* Account type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("Account type")}</label>

              <div className="grid grid-cols-2 gap-3">
                <RoleButton
                  active={formData.role === "job_seeker"}
                  icon={UserRound}
                  title={t("Job Seeker")}
                  description={t("Find & save jobs")}
                  onClick={() =>
                    handleRoleChange("job_seeker")
                  }
                />

                <RoleButton
                  active={formData.role === "company"}
                  icon={Building2}
                  title={t("Company")}
                  description={t("Post & analyze")}
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
              >{t("Name")}</label>

              <div className="relative">
                <UserRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="register-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  autoComplete="name"
                  placeholder={
                    formData.role === "company"
                      ? t("Company name")
                      : t("Ahmed")
                  }
                  className="ps-9"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="register-email"
                className="text-sm font-medium"
              >{t("Email")}</label>

              <div className="relative">
                <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="register-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  dir="ltr" type="email"
                  autoComplete="email"
                  placeholder="ahmed@example.com"
                  className="ps-9"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="register-password"
                className="text-sm font-medium"
              >{t("Password")}</label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="register-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("At least 8 characters")}
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
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">{t("Minimum 8 characters")}</p>

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
                ? t("Creating account...")
                : t("Create account")}

              {!isSubmitting && (
                <ArrowRight className="size-4" />
              )}
            </Button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border" />

              <span className="text-xs text-muted-foreground">{t("Already have an account?")}</span>

              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login")}
            >{t("Sign in")}</Button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">{t("Your workspace and available features depend on whether you register as a job seeker or company.")}</p>
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
  useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-xl border p-4 text-start transition-all",
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

        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
