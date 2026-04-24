"use client";

import type { ComponentType } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useJobQueue } from "@/context/JobQueueContext";
import { useCaptureOAuthToken } from "@/hooks/useCaptureOAuthToken";
import {
  type FixMetrics,
  fetchFixMetrics,
  formatMedianSeconds,
} from "@/lib/fixMetrics";

function IconCheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 12.2 11 14.7l4.4-4.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPercent({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M18 5 6 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 8v4m0 4h.01M4.4 20h15.2a.8.8 0 0 0 .7-1.2l-7.6-12.3a.8.8 0 0 0-1.4 0L3.7 18.8a.8.8 0 0 0 .7 1.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 7v5l2.5 1.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPulse({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 10v4M9.5 6v12M14 3v18M18.5 8v8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSession({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5h3l2 2h4l2-2h3M4 5v3h16V5M4 5v9a2 2 0 0 0 2 2h1m-3-6h4m-4 4h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h12m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type StatIcon = ComponentType<{ className?: string }>;

type StatConfig = {
  label: string;
  value: string;
  hint?: string;
  Icon: StatIcon;
  delay: string;
};

function StatCard({
  label,
  value,
  hint,
  Icon,
  delay,
}: {
  label: string;
  value: string;
  hint?: string;
  Icon: StatIcon;
  delay: string;
}) {
  return (
    <div
      className="stat-card-entrance group relative flex min-h-0 flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-surface-elevated/50 p-4 transition-colors duration-200 hover:border-accent/20 hover:bg-surface-elevated/70 sm:p-5"
      style={{ animationDelay: delay }}
    >
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
          {label}
        </p>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/80 bg-surface/80 text-accent transition-transform duration-200 group-hover:scale-[1.02] group-hover:border-accent/25">
          <Icon className="h-[17px] w-[17px]" />
        </span>
      </div>
      <p className="relative mt-3 font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
        {value}
      </p>
      {hint && (
        <p className="relative mt-2 text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

function metricsToStatCards(
  m: FixMetrics,
  completedInSession: number,
  loading: boolean,
): StatConfig[] {
  const success =
    m.success_rate_last_30d_pct == null
      ? loading
        ? "…"
        : "—"
      : `${m.success_rate_last_30d_pct}%`;
  return [
    {
      label: "Lifetime fixes (completed)",
      value: loading ? "…" : String(m.completed_total),
      hint: "All successful runs in your account",
      Icon: IconCheckCircle,
      delay: "0ms",
    },
    {
      label: "Success rate (30d)",
      value: success,
      hint: "Completed vs failed in the last 30 days",
      Icon: IconPercent,
      delay: "40ms",
    },
    {
      label: "Failed runs (all time)",
      value: loading ? "…" : String(m.failed_total),
      hint: "Failed fix jobs in your account",
      Icon: IconAlert,
      delay: "80ms",
    },
    {
      label: "Median time to complete",
      value: loading
        ? "…"
        : formatMedianSeconds(m.median_seconds_to_complete),
      hint: "Median wall time for completed jobs",
      Icon: IconClock,
      delay: "120ms",
    },
    {
      label: "Active in queue",
      value: loading ? "…" : String(m.in_progress),
      hint: "Queued, waiting, or running (your account, any device)",
      Icon: IconPulse,
      delay: "160ms",
    },
    {
      label: "Completed (this session)",
      value: String(completedInSession),
      hint: "Finished in this tab since you opened the app",
      Icon: IconSession,
      delay: "200ms",
    },
  ];
}

const EMPTY_METRICS: FixMetrics = {
  completed_total: 0,
  failed_total: 0,
  in_progress: 0,
  completed_last_30d: 0,
  failed_last_30d: 0,
  success_rate_last_30d_pct: null,
  median_seconds_to_complete: null,
  last_7_days: [],
  outcomes: { completed: 0, failed: 0, in_progress: 0 },
};

export default function Dashboard() {
  useCaptureOAuthToken();
  const { jobs } = useJobQueue();
  const completedInSession = jobs.filter((j) => j.status === "completed")
    .length;

  const [metrics, setMetrics] = useState<FixMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const loadMetrics = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMetrics(null);
      setMetricsLoading(false);
      return;
    }
    setMetricsLoading(true);
    void (async () => {
      setMetricsError(null);
      try {
        const data = await fetchFixMetrics(token);
        setMetrics(data);
      } catch (e) {
        setMetricsError(
          e instanceof Error ? e.message : "Failed to load metrics",
        );
        setMetrics(null);
      } finally {
        setMetricsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const staticStats: StatConfig[] = metricsToStatCards(
    metrics ?? EMPTY_METRICS,
    completedInSession,
    metricsLoading,
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Overview
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted">
            Health of your fix pipeline. Open{" "}
            <Link
              href="/repos"
              className="text-foreground underline decoration-border underline-offset-4 transition hover:text-accent"
            >
              Repositories
            </Link>{" "}
            to run new jobs.
          </p>
        </div>
        <div className="shrink-0 sm:self-center sm:pt-1">
          <Link
            href="/repos"
            className="group inline-flex min-h-11 w-full min-w-44 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white shadow-sm transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
          >
            Run a fix
            <IconArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {metricsError && (
        <p
          className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90"
          role="alert"
        >
          {metricsError}
        </p>
      )}

      <section aria-labelledby="metrics-heading" className="space-y-3">
        <h2
          id="metrics-heading"
          className="font-heading text-lg font-semibold tracking-tight text-foreground"
        >
          Fix metrics
        </h2>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {staticStats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              hint={s.hint}
              Icon={s.Icon}
              delay={s.delay}
            />
          ))}
        </div>
      </section>

      <section
        className="relative overflow-hidden rounded-xl border border-accent/25 bg-linear-to-br from-accent/30 via-background to-black p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6"
        aria-label="Get started"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_0%,rgba(225,29,72,0.18),transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Work queue
            </p>
            <p className="mt-1 font-heading text-lg font-semibold text-foreground">
              Pick a repo, load issues, queue a fix
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Jobs stream to Activity — no refresh needed.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
            <Link
              href="/repos"
              className="inline-flex min-h-10 min-w-36 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white shadow-sm transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Repositories
              <IconArrowRight className="h-4 w-4 text-white" />
            </Link>
            <Link
              href="/queue"
              className="inline-flex min-h-10 min-w-28 items-center justify-center rounded-md border border-white/20 bg-white px-4 text-sm font-medium text-background transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Open Activity
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
