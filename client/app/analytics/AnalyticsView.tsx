"use client";

import dynamic from "next/dynamic";

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

export function AnalyticsView() {
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
          Charts use illustrative data until a database backs this view.
        </p>
      </header>

      <AnalyticsCharts />
    </div>
  );
}
