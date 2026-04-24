import Link from "next/link";
import { API_BASE } from "@/lib/api";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <span className="font-heading text-[17px] font-semibold tracking-tight">
          <span className="text-accent" aria-hidden>
            /
          </span>
          <span className="text-foreground">fixer</span>
        </span>
        <a
          href={`${API_BASE}/auth/github/login`}
          className="text-[13px] text-muted transition hover:text-foreground"
        >
          Sign in
        </a>
      </div>
      <div className="max-w-lg flex-1 space-y-6">
        <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-accent">
          Orchestrate
        </p>
        <h1 className="font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          Fix GitHub issues with agents
        </h1>
        <p className="text-base leading-relaxed text-muted">
          Connect your account, pick a repo, and run fixes on issues. One accent,
          zero clutter.
        </p>
        <div className="pt-2">
          <a href={`${API_BASE}/auth/github/login`}>
            <span className="inline-flex min-h-11 min-w-[200px] cursor-pointer items-center justify-center rounded-md border border-transparent bg-accent px-6 text-sm font-medium text-white transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              Sign in with GitHub
            </span>
          </a>
        </div>
        <p className="text-[13px] text-muted">
          After login you&apos;ll land in the app with your token.{" "}
          <Link
            className="text-foreground underline decoration-border underline-offset-4 transition hover:decoration-accent"
            href="/dashboard"
          >
            Open dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
