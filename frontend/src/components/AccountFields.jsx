import { localizeMessage } from "@/i18n";
import { useTranslation } from "react-i18next";
import { t } from "@/i18n";
import { Input } from "@/components/ui/input";

export function AccountField({ id, label, ...props }) {
  useTranslation();
  return <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-medium">{label}</label>
    <Input id={id} required {...props} />
  </div>;
}

export function CodeField(props) {
  useTranslation();
  return <AccountField label={t("6-digit code")} dir="ltr" type="text" inputMode="numeric"
    autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} {...props} />;
}

export function PasswordFields({ password, confirmation, onPassword, onConfirmation, prefix }) {
  useTranslation();
  return <>
    <AccountField id={`${prefix}-new`} label={t("New password")} type="password" minLength={8}
      autoComplete="new-password" value={password} onChange={(event) => onPassword(event.target.value)} />
    <p className="text-xs text-muted-foreground">{t("Use at least 8 characters (at most 72 UTF-8 bytes).")}</p>
    <AccountField id={`${prefix}-confirm`} label={t("Confirm new password")} type="password"
      autoComplete="new-password" value={confirmation} onChange={(event) => onConfirmation(event.target.value)} />
  </>;
}

export function FormFeedback({ error, message }) {
  useTranslation();
  return <>
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{localizeMessage(error)}</p>}
    {message && <p role="status" className="rounded-md border bg-muted/40 p-3 text-sm">{localizeMessage(message)}</p>}
  </>;
}
