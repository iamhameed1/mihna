import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

let googleSdkPromise;

function loadGoogleSdk() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google);
  }

  if (!googleSdkPromise) {
    googleSdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );

      if (existing) {
        existing.addEventListener("load", () => resolve(window.google));
        existing.addEventListener("error", () =>
          reject(new Error("Google Sign-In could not load."))
        );
        return;
      }

      const script = document.createElement("script");

      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (window.google?.accounts?.oauth2) {
          resolve(window.google);
        } else {
          reject(new Error("Google Sign-In could not initialize."));
        }
      };

      script.onerror = () => {
        googleSdkPromise = undefined;
        reject(new Error("Google Sign-In could not load."));
      };

      document.head.appendChild(script);
    });
  }

  return googleSdkPromise;
}

export default function GoogleSignInButton({
  onCode,
  disabled = false,
}) {
  const clientRef = useRef(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    let active = true;

    loadGoogleSdk()
      .then((google) => {
        if (!active) return;

        clientRef.current = google.accounts.oauth2.initCodeClient({
          client_id: clientId,

          scope: "openid email profile",

          ux_mode: "popup",

          select_account: true,

          callback: (response) => {
            if (!active) return;

            if (!response?.code) {
              setError("Google did not return an authorization code.");
              return;
            }

            setError("");
            onCode(response.code);
          },

          error_callback: (response) => {
            if (!active) return;

            if (response?.type === "popup_closed") {
              return;
            }

            if (response?.type === "popup_failed_to_open") {
              setError(
                "Google popup was blocked. Please allow popups and try again."
              );
              return;
            }

            setError("Google Sign-In failed. Please try again.");
          },
        });

        setReady(true);
      })
      .catch((failure) => {
        if (active) {
          setError(failure.message);
        }
      });

    return () => {
      active = false;
    };
  }, [clientId, onCode]);

  function handleGoogleLogin() {
    if (!clientRef.current || disabled) return;

    setError("");

    clientRef.current.requestCode();
  }

  if (!clientId) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled
        className="w-full"
      >
        Continue with Google (unavailable)
      </Button>
    );
  }

  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled || !ready}
        onClick={handleGoogleLogin}
      >
        Continue with Google
      </Button>

      {error && (
        <p
          role="alert"
          className="mt-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}