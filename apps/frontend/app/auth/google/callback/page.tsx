import { Suspense } from "react";
import GoogleCallbackClient from "./google-callback-client";

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold">Google Authentication</h1>
            <p className="mt-3 text-zinc-600">Finishing sign in...</p>
          </div>
        </main>
      }
    >
      <GoogleCallbackClient />
    </Suspense>
  );
}
