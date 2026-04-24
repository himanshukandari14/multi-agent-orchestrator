"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProfilePageSkeleton } from "@/components/skeletons/presets";

function useHasSession() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    setHasToken(!!localStorage.getItem("token"));
  }, []);

  return hasToken;
}

export default function ProfilePage() {
  const router = useRouter();
  const hasToken = useHasSession();

  const logout = () => {
    try {
      localStorage.removeItem("token");
    } catch {
      // ignore
    }
    router.push("/");
    router.refresh();
  };

  if (hasToken === null) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="max-w-lg space-y-8">
      <header className="space-y-1">
        <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-accent">
          Account
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Profile
        </h1>
        <p className="text-sm text-muted">
          Session and sign-out. Your GitHub access is used only to run fixes
          and open pull requests.
        </p>
      </header>

      {hasToken === false && (
        <div className="rounded-lg border border-border bg-surface px-4 py-5 text-sm text-muted">
          You are not signed in.{" "}
          <Link className="text-accent hover:underline" href="/">
            Go to the home page
          </Link>{" "}
          to connect GitHub.
        </div>
      )}

      {hasToken && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface-elevated/40 px-4 py-4">
            <p className="text-sm text-foreground">Signed in with GitHub</p>
            <p className="mt-1 text-sm text-muted">
              API requests use a short-lived app token stored in this browser.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-10 w-full sm:w-auto items-center justify-center rounded-md border border-border bg-transparent px-4 text-sm text-foreground transition hover:border-danger/50 hover:text-danger focus-visible:ring-2 focus-visible:ring-ring/80"
            >
              Log out
            </button>
            <p className="text-[12px] text-muted">
              Clears the session and returns you to the landing page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
