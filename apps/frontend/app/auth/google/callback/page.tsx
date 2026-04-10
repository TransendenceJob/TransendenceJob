"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function parseHashParams(hash: string): Record<string, string> {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(normalized);

  return {
    accessToken: params.get("accessToken") ?? "",
    refreshToken: params.get("refreshToken") ?? "",
    expiresIn: params.get("expiresIn") ?? "",
    tokenType: params.get("tokenType") ?? "",
  };
}

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const oauthError = useMemo(
    () => searchParams.get("error_description") ?? searchParams.get("error"),
    [searchParams],
  );

  useEffect(() => {
    if (oauthError) {
      setErrorMessage(oauthError);
      return;
    }

    const { accessToken, refreshToken, expiresIn, tokenType } = parseHashParams(
      window.location.hash,
    );

    if (!accessToken || !refreshToken) {
      setErrorMessage("Missing OAuth tokens in callback response");
      return;
    }

    localStorage.setItem("auth.accessToken", accessToken);
    localStorage.setItem("auth.refreshToken", refreshToken);
    localStorage.setItem("auth.expiresIn", expiresIn);
    localStorage.setItem("auth.tokenType", tokenType || "Bearer");

    router.replace("/homepage");
  }, [oauthError, router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Google Authentication</h1>
        {errorMessage ? (
          <p className="mt-3 text-red-600">{errorMessage}</p>
        ) : (
          <p className="mt-3 text-zinc-600">Finishing sign in...</p>
        )}
      </div>
    </main>
  );
}
