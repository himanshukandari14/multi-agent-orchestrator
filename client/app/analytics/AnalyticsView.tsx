"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  type FixMetrics,
  fetchFixMetrics,
} from "@/lib/fixMetrics";

const AnalyticsCharts = dynamic(
  () =>
    import("@/components/analytics/AnalyticsCharts").then((m) => ({
      default: m.AnalyticsCharts,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-72 min-h-64 animate-pulse rounded-xl border border-border/60 bg-surface-elevated/20" />
        <div className="h-72 min-h-64 animate-pulse rounded-xl border border-border/60 bg-surface-elevated/20" />
      </div>
    ),
  },
);

const EMPTY: Pick<FixMetrics, "last_7_days" | "outcomes"> = {
  last_7_days: [],
  outcomes: { completed: 0, failed: 0, in_progress: 0 },
};

function defaultLast7Days(): Array<{ label: string; completed: number }> {
  const rows: Array<{ label: string; completed: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    rows.push({
      label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
      completed: 0,
    });
  }
  return rows;
}

export function AnalyticsView() {
  const [data, setData] = useState<FixMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      setError(null);
      try {
        setData(await fetchFixMetrics(token));
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load analytics",
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const last7 =
    data?.last_7_days && data.last_7_days.length > 0
      ? data.last_7_days
      : defaultLast7Days();
  const out = data?.outcomes ?? EMPTY.outcomes;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Metrics
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Analytics
        </h1>
        <p className="text-sm text-muted">
          Data comes from your account’s fix history on the server (sign in
          required).
        </p>
      </header>

      {error && (
        <p
          className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90"
          role="alert"
        >
          {error}
        </p>
      )}

      <AnalyticsCharts
        last7Days={last7}
        outcomes={out}
        loading={loading}
      />
    </div>
  );
}
