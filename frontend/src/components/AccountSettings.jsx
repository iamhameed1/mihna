import { localizeMessage } from "@/i18n";
import { useTranslation } from "react-i18next";
import { t } from "@/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AccountField, CodeField, FormFeedback, PasswordFields } from "@/components/AccountFields";
import EmailVerification from "@/components/EmailVerification";
import { requestEmailChange, updatePassword, updateProfile, verifyNewEmail } from "@/services/api";

export default function AccountSettings({ currentUser, token, onUserUpdated }) {
  useTranslation();
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  function submit(action) {
    return async (event) => {
      event.preventDefault(); setBusy(true); setError(""); setMessage("");
      try { await action(); } catch (failure) { setError(failure.message); }
      finally { setBusy(false); }
    };
  }
  return <div className="space-y-6">
    <FormFeedback error={localizeMessage(error)} message={localizeMessage(message)} />
    <Card>
      <CardHeader><CardTitle>{t("Email verification")}</CardTitle>
        <CardDescription>{currentUser.email_verified ? t("Your current email is verified.") : t("Your current email has not been verified.")}</CardDescription>
      </CardHeader>
      {!currentUser.email_verified && <CardContent><EmailVerification key={currentUser.email} email={currentUser.email}
        onVerified={() => onUserUpdated((user) => ({ ...user, email_verified: true }))} /></CardContent>}
    </Card>
    <fieldset disabled={busy} className="grid min-w-0 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>{t("Edit name")}</CardTitle><CardDescription>{t("Update the name on your profile.")}</CardDescription></CardHeader>
        <CardContent><form className="space-y-4" onSubmit={submit(async () => {
          const user = await updateProfile({ name }, token); onUserUpdated(user); setName(""); setMessage(t("Name updated."));
        })}>
          <AccountField id="account-name" label={t("Name")} maxLength={255} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
          <Button type="submit">{t("Save name")}</Button>
        </form></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("Change email")}</CardTitle><CardDescription>{t("Your current email stays active until you verify the new address.")}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={submit(async () => {
            const result = await requestEmailChange({ email }, token);
            setPendingEmail(email.trim().toLowerCase()); setEmail(""); setCode(""); setMessage(result.message);
          })}>
            <AccountField id="account-email" label={t("New email")} dir="ltr" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="outline">{t("Send / resend code")}</Button>
              <Button type="button" variant="ghost" onClick={(event) => {
                if (event.currentTarget.form.reportValidity()) {
                  setPendingEmail(email.trim().toLowerCase()); setCode("");
                }
              }}>{t("I already have a code")}</Button>
            </div>
          </form>
          {pendingEmail && <form className="space-y-4 border-t pt-4" onSubmit={submit(async () => {
            const user = await verifyNewEmail({ email: pendingEmail, code }, token);
            onUserUpdated(user); setPendingEmail(""); setEmail(""); setCode(""); setMessage(t("Email updated and verified."));
          })}>
            <p className="break-words text-sm text-muted-foreground">{t("Enter the code sent to")}{pendingEmail}{t(". It expires in 10 minutes.")}</p>
            <CodeField id="new-email-code" value={code} onChange={(event) => setCode(event.target.value)} />
            <Button type="submit">{t("Verify new email")}</Button>
          </form>}
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader><CardTitle>{currentUser.has_password ? t("Change password") : t("Add a password")}</CardTitle>
          <CardDescription>{currentUser.has_password ? t("Confirm your current password to choose a new one.") : t("Add email/password sign-in to your Google account.")}</CardDescription></CardHeader>
        <CardContent><form className="max-w-md space-y-4" onSubmit={submit(async () => {
          if (password !== confirmation) throw new Error(t("Passwords do not match."));
          const user = await updatePassword({ current_password: currentPassword || null, new_password: password, confirmation }, token);
          onUserUpdated(user); setCurrentPassword(""); setPassword(""); setConfirmation(""); setMessage(t("Password saved."));
        })}>
          {currentUser.has_password && <AccountField id="account-current-password" label={t("Current password")} type="password" autoComplete="current-password"
            value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />}
          <PasswordFields prefix="account" password={password} confirmation={confirmation} onPassword={setPassword} onConfirmation={setConfirmation} />
          <Button type="submit">{currentUser.has_password ? t("Change password") : t("Add password")}</Button>
        </form></CardContent>
      </Card>
    </fieldset>
    {busy && <p role="status" className="text-sm text-muted-foreground">{t("Saving...")}</p>}
  </div>;
}
