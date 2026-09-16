import { localizeMessage } from "@/i18n";
import { useTranslation } from "react-i18next";
import { t } from "@/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AccountField, CodeField, FormFeedback, PasswordFields } from "@/components/AccountFields";
import { forgotPassword, resetPassword, verifyResetCode } from "@/services/api";

export default function PasswordRecovery({ initialEmail, onBack }) {
  useTranslation();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(initialEmail || "");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(action) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  async function send() {
    const result = await forgotPassword(email);
    setCode(""); setMessage(result.message); setStep("code");
  }
  function submit(event) {
    event.preventDefault();
    run(async () => {
      if (step === "email") return send();
      if (step === "code") {
        const result = await verifyResetCode({ email, code });
        setResetToken(result.reset_token); setCode(""); setStep("password");
        return;
      }
      if (password !== confirmation) throw new Error(t("Passwords do not match."));
      const result = await resetPassword({ reset_token: resetToken, new_password: password, confirmation });
      setResetToken(""); setPassword(""); setConfirmation(""); setMessage(result.message); setStep("done");
    });
  }
  return <Card className="mx-auto w-full max-w-md">
    <CardHeader>
      <CardTitle>{t("Reset your password")}</CardTitle>
      <CardDescription>{step === "email" ? t("Enter your account email to request a recovery code.") :
        step === "code" ? t("Enter the 6-digit code from your email. It expires in 10 minutes.") :
        step === "password" ? t("Choose your new password.") : t("Your password has been updated.")}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <FormFeedback error={localizeMessage(error)} message={localizeMessage(message)} />
      {step !== "done" && <form onSubmit={submit}>
        <fieldset disabled={busy} className="space-y-4">
          {step === "email" && <AccountField id="recovery-email" label={t("Email")} dir="ltr" type="email" autoComplete="email"
            value={email} onChange={(event) => setEmail(event.target.value)} />}
          {step === "code" && <>
            <p className="break-words text-sm text-muted-foreground">{email}</p>
            <CodeField id="recovery-code" value={code} onChange={(event) => setCode(event.target.value)} />
          </>}
          {step === "password" && <PasswordFields prefix="recovery" password={password} confirmation={confirmation}
            onPassword={setPassword} onConfirmation={setConfirmation} />}
          <Button type="submit" className="w-full">{busy ? t("Please wait...") : step === "email" ? t("Send reset code") : step === "code" ? t("Verify code") : t("Reset password")}</Button>
          {step === "code" && <Button type="button" variant="outline" className="w-full" onClick={() => run(send)}>{t("Resend code")}</Button>}
          {step !== "email" && <Button type="button" variant="ghost" onClick={() => {
            setStep("email"); setResetToken(""); setCode(""); setPassword(""); setConfirmation(""); setError(""); setMessage("");
          }}>{t("Start again")}</Button>}
        </fieldset>
      </form>}
      <Button type="button" variant="ghost" disabled={busy} onClick={onBack}>{t("Back to sign in")}</Button>
    </CardContent>
  </Card>;
}
