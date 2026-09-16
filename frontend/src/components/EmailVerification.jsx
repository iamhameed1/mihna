import { localizeMessage } from "@/i18n";
import { useTranslation } from "react-i18next";
import { t } from "@/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeField, FormFeedback } from "@/components/AccountFields";
import { resendVerificationCode, verifyEmail } from "@/services/api";

export default function EmailVerification({ email, onVerified, initialMessage = "" }) {
  useTranslation();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [verified, setVerified] = useState(false);
  async function run(action) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4">
    <p className="break-words text-sm text-muted-foreground">{t("Verify")}{email}{t(". Codes expire after 10 minutes. You can continue using Mihna while unverified.")}</p>
    <FormFeedback error={localizeMessage(error)} message={localizeMessage(message)} />
    {!verified && <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      run(async () => {
        const result = await verifyEmail({ email, code });
        setVerified(true); setCode(""); setMessage(result.message);
        await onVerified?.();
      });
    }}>
      <fieldset disabled={busy} className="space-y-4">
        <CodeField id="verify-email-code" value={code} onChange={(event) => setCode(event.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit">{busy ? t("Please wait...") : t("Verify email")}</Button>
          <Button type="button" variant="outline" onClick={() => run(async () => {
            const result = await resendVerificationCode(email);
            setCode(""); setMessage(result.message);
          })}>{t("Send / resend code")}</Button>
        </div>
      </fieldset>
    </form>}
  </div>;
}
