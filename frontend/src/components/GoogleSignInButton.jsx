import { useEffect, useRef, useState } from "react";

let sdkPromise;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      const timeout = setTimeout(() => script.onerror(), 15000);
      script.onload = () => {
        clearTimeout(timeout);
        resolve(window.google);
      };
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        sdkPromise = undefined;
        reject(new Error("Google sign-in could not load. Refresh to retry or use email and password."));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

export default function GoogleSignInButton({ onCredential, disabled, theme }) {
  const container = useRef(null);
  const callback = useRef(onCredential);
  const [error, setError] = useState("");
  useEffect(() => { callback.current = onCredential; }, [onCredential]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    let active = true;
    const target = container.current;
    // Bind the popup response to this mounted login page.
    const nonce = crypto.randomUUID();
    loadGoogle().then((google) => {
      if (!active) return;
      google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: "popup",
        auto_select: false,
        nonce,
        callback: (response) => {
          if (!active) return;
          try {
            const segment = response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
            const claims = JSON.parse(atob(segment));
            if (claims.nonce !== nonce) throw new Error("Unexpected Google sign-in response. Please retry.");
            // This nonce check binds the browser interaction; the backend verifies the identity.
            callback.current(response.credential);
          } catch {
            setError("Unexpected Google sign-in response. Refresh and try again.");
          }
        },
      });
      google.accounts.id.renderButton(target, {
        type: "standard", text: "continue_with", size: "large", shape: "rectangular",
        theme: theme === "dark" ? "filled_black" : "outline",
        width: Math.min(384, target.clientWidth),
      });
    }).catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; target.replaceChildren(); };
  }, [theme]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return <button type="button" disabled className="h-10 w-full rounded-md border text-sm text-muted-foreground">Continue with Google (unavailable)</button>;
  }
  return (
    <div>
      <div ref={container} inert={disabled} aria-busy={disabled} className={`min-h-10 w-full overflow-hidden ${disabled ? "opacity-50" : ""}`} />
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
