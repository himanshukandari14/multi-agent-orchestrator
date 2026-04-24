"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const gridStroke = "rgba(255,255,255,0.06)";
const tick = { fill: "#a1a1aa", fontSize: 11 };
const TOOLTIP_STYLE = {
  backgroundColor: "#111111",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
  color: "#f4f4f5",
};

export type AnalyticsChartsProps = {
  last7Days: Array<{ label: string; completed: number }>;
  outcomes: { completed: number; failed: number; in_progress: number };
  loading: boolean;
};

export function AnalyticsCharts({
  last7Days,
  outcomes,
  loading,
}: AnalyticsChartsProps) {
  const weeklyFixes = last7Days.map((d) => ({
    label: d.label,
    fixes: d.completed,
  }));

  const byOutcome = [
    { name: "Completed", n: outcomes.completed },
    { name: "Failed", n: outcomes.failed },
    { name: "In progress", n: outcomes.in_progress },
  ];

  if (loading) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-72 min-h-64 animate-pulse rounded-xl border border-border/60 bg-surface-elevated/20" />
        <div className="h-72 min-h-64 animate-pulse rounded-xl border border-border/60 bg-surface-elevated/20" />
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-xl border border-border/80 bg-surface-elevated/30 p-4 sm:p-5">
        <h3 className="mb-1 font-heading text-base font-semibold text-foreground">
          Completions per day
        </h3>
        <p className="mb-4 text-xs text-muted">
          Last 7 days (UTC) — completed fix jobs
        </p>
        <div className="h-64 w-full min-h-64 min-w-0 sm:h-72 sm:min-h-72">
          <ResponsiveContainer width="100%" height="100%" minHeight={256}>
            <AreaChart
              data={weeklyFixes}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fixGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="label"
                tick={tick}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={tick}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="fixes"
                name="Completed"
                stroke="#e11d48"
                strokeWidth={2}
                fill="url(#fixGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-surface-elevated/30 p-4 sm:p-5">
        <h3 className="mb-1 font-heading text-base font-semibold text-foreground">
          Outcomes
        </h3>
        <p className="mb-4 text-xs text-muted">
          All time — your account
        </p>
        <div className="h-64 w-full min-h-64 min-w-0 sm:h-72 sm:min-h-72">
          <ResponsiveContainer width="100%" height="100%" minHeight={256}>
            <BarChart
              data={byOutcome}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridStroke}
                horizontal
                vertical={false}
              />
              <XAxis
                type="number"
                tick={tick}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={tick}
                axisLine={false}
                tickLine={false}
                width={88}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="n"
                name="Count"
                fill="#e11d48"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
