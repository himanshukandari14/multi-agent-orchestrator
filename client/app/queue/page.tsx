"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { ActivityPageSkeleton } from "@/components/skeletons/presets";
import type { QueueJob } from "@/context/JobQueueContext";
import { useJobQueue } from "@/context/JobQueueContext";

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function statusLabel(j: QueueJob) {
  switch (j.status) {
    case "queued":
      return "Queued";
    case "pending":
      return "Waiting for worker";
    case "processing":
      return "Running";
    case "completed":
      return "Done";
    case "failed":
      return "Failed";
    case "stalled":
      return "Stalled";
    default:
      return j.status;
  }
}

function StatusPill({ job }: { job: QueueJob }) {
  const run =
    job.status === "processing" ||
    job.status === "pending" ||
    job.status === "queued";
  return (
    <span
      className={[
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        job.status === "completed" && "border-emerald-500/30 text-emerald-400/90",
        job.status === "failed" && "border-danger/40 text-danger",
        job.status === "stalled" && "border-amber-500/30 text-amber-400/90",
        run && "border-accent/35 text-accent",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {run && (
        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
      )}
      {statusLabel(job)}
    </span>
  );
}

export default function ActivityPage() {
  const { jobs, removeJob, isPolling } = useJobQueue();
  const [now, setNow] = useState(() => Date.now());
  const [bootTimerDone, setBootTimerDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBootTimerDone(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-10">
        <header className="space-y-2">
          <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-accent">
            Queue
          </p>
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Activity
          </h1>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-pretty text-sm text-muted">
              Every <span className="text-foreground">Run fix</span> is queued
              here. Your recent runs are loaded from the server when you open
              Activity (any device); this browser also keeps a copy for
              off-line polish. Live status is polled; completed cards
              auto-hide a few seconds after they finish in this session.
            </p>
            {isPolling && (
              <p className="shrink-0 text-[11px] font-mono text-accent/90">
                Syncing…
              </p>
            )}
          </div>
        </header>

        {!bootTimerDone && jobs.length === 0 && <ActivityPageSkeleton />}

        {bootTimerDone && jobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
            <p className="text-sm text-muted">No jobs yet.</p>
            <p className="mt-1 text-sm text-muted/80">
              Go to the dashboard, load issues, and choose{" "}
              <span className="text-foreground">Run fix</span>. You&apos;ll get
              a confirmation toast and a row will appear here.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface-elevated px-4 text-sm text-foreground transition hover:border-accent/40"
            >
              Open dashboard
            </Link>
          </div>
        )}

        {jobs.length > 0 && (
          <ul className="space-y-4">
            {jobs.map((job) => {
              const elapsed = formatDuration(
                Math.max(0, now - job.createdAt),
              );
              const active =
                job.status !== "completed" &&
                job.status !== "failed" &&
                job.status !== "stalled";
              const showMessageSkeleton =
                active && (!job.serverJobId || job.message === "Queuing…");
              return (
                <li
                  key={job.clientId}
                  className="overflow-hidden rounded-xl border border-border bg-gradient-to-b from-surface-elevated/50 to-surface/60 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
                >
                  <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill job={job} />
                        <span className="font-mono text-[11px] text-muted/90">
                          Elapsed {elapsed}
                        </span>
                      </div>
                      <h2 className="text-balance text-base font-medium text-foreground sm:text-[17px]">
                        {job.issueTitle}
                      </h2>
                      <p className="font-mono text-xs text-muted">{job.repoLabel}</p>
                      {showMessageSkeleton && (
                        <div className="pt-0.5">
                          <Skeleton count={1} width="85%" height={12} className="mb-1" />
                          <Skeleton count={1} width="50%" height={12} />
                        </div>
                      )}
                      {job.message &&
                        !showMessageSkeleton &&
                        job.status !== "completed" &&
                        job.status !== "failed" && (
                          <p className="text-pretty text-sm text-muted/95">
                            {job.message}
                          </p>
                        )}
                      {job.error && (
                        <p className="text-pretty text-sm text-danger">
                          {job.error}
                        </p>
                      )}
                      {job.status === "completed" && job.prUrl && (
                        <a
                          href={job.prUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-sm text-accent underline decoration-accent/30 underline-offset-2 transition hover:decoration-accent"
                        >
                          Open pull request ↗
                        </a>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col items-stretch gap-3 sm:max-w-[10rem] sm:items-end">
                      {active && (
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/80 sm:w-36">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent/90 to-accent-hover transition-all duration-500"
                            style={{
                              width: `${Math.max(
                                3,
                                Math.min(
                                  100,
                                  job.progress > 0
                                    ? job.progress
                                    : job.status === "queued"
                                      ? 4
                                      : 10,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                      {(job.status === "completed" ||
                        job.status === "failed" ||
                        job.status === "stalled") && (
                        <button
                          type="button"
                          onClick={() => removeJob(job.clientId)}
                          className="text-[12px] text-muted underline decoration-border underline-offset-2 transition hover:text-foreground"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );
}
