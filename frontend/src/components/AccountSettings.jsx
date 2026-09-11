import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AccountField, CodeField, FormFeedback, PasswordFields } from "@/components/AccountFields";
import EmailVerification from "@/components/EmailVerification";
import { getCurrentUser, requestEmailChange, updatePassword, updateProfile, verifyNewEmail } from "@/services/api";

export default function AccountSettings({ currentUser, token, onUserUpdated }) {
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
    <FormFeedback error={error} message={message} />
    <Card>
      <CardHeader><CardTitle>Email verification</CardTitle>
        <CardDescription>{currentUser.email_verified ? "Your current email is verified." : "Your current email has not been verified."}</CardDescription>
      </CardHeader>
      {!currentUser.email_verified && <CardContent><EmailVerification key={currentUser.email} email={currentUser.email}
        onVerified={async () => onUserUpdated(await getCurrentUser(token))} /></CardContent>}
    </Card>
    <fieldset disabled={busy} className="grid min-w-0 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Edit name</CardTitle><CardDescription>Update the name on your profile.</CardDescription></CardHeader>
        <CardContent><form className="space-y-4" onSubmit={submit(async () => {
          const user = await updateProfile({ name }, token); onUserUpdated(user); setName(user.name); setMessage("Name updated.");
        })}>
          <AccountField id="account-name" label="Name" maxLength={255} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
          <Button type="submit">Save name</Button>
        </form></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Change email</CardTitle><CardDescription>Your current email stays active until you verify the new address.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={submit(async () => {
            const result = await requestEmailChange({ email }, token);
            setPendingEmail(email.trim().toLowerCase()); setCode(""); setMessage(result.message);
          })}>
            <AccountField id="account-email" label="New email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="outline">Send / resend code</Button>
              <Button type="button" variant="ghost" onClick={(event) => {
                if (event.currentTarget.form.reportValidity()) {
                  setPendingEmail(email.trim().toLowerCase()); setCode("");
                }
              }}>I already have a code</Button>
            </div>
          </form>
          {pendingEmail && <form className="space-y-4 border-t pt-4" onSubmit={submit(async () => {
            const user = await verifyNewEmail({ email: pendingEmail, code }, token);
            onUserUpdated(user); setPendingEmail(""); setEmail(""); setCode(""); setMessage("Email updated and verified.");
          })}>
            <p className="break-words text-sm text-muted-foreground">Enter the code sent to {pendingEmail}. It expires in 10 minutes.</p>
            <CodeField id="new-email-code" value={code} onChange={(event) => setCode(event.target.value)} />
            <Button type="submit">Verify new email</Button>
          </form>}
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader><CardTitle>{currentUser.has_password ? "Change password" : "Add a password"}</CardTitle>
          <CardDescription>{currentUser.has_password ? "Confirm your current password to choose a new one." : "Add email/password sign-in to your Google account."}</CardDescription></CardHeader>
        <CardContent><form className="max-w-md space-y-4" onSubmit={submit(async () => {
          if (password !== confirmation) throw new Error("Passwords do not match.");
          const user = await updatePassword({ current_password: currentPassword || null, new_password: password, confirmation }, token);
          onUserUpdated(user); setCurrentPassword(""); setPassword(""); setConfirmation(""); setMessage("Password saved.");
        })}>
          {currentUser.has_password && <AccountField id="account-current-password" label="Current password" type="password" autoComplete="current-password"
            value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />}
          <PasswordFields prefix="account" password={password} confirmation={confirmation} onPassword={setPassword} onConfirmation={setConfirmation} />
          <Button type="submit">{currentUser.has_password ? "Change password" : "Add password"}</Button>
        </form></CardContent>
      </Card>
    </fieldset>
    {busy && <p role="status" className="text-sm text-muted-foreground">Saving...</p>}
  </div>;
}
