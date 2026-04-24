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

/** Placeholder time series (replace with API). */
const weeklyFixes = [
  { label: "Mon", fixes: 3 },
  { label: "Tue", fixes: 5 },
  { label: "Wed", fixes: 4 },
  { label: "Thu", fixes: 7 },
  { label: "Fri", fixes: 6 },
  { label: "Sat", fixes: 2 },
  { label: "Sun", fixes: 4 },
];

const byOutcome = [
  { name: "Completed", n: 38 },
  { name: "Failed", n: 3 },
  { name: "In progress", n: 6 },
];

export function AnalyticsCharts() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-xl border border-border/80 bg-surface-elevated/30 p-4 sm:p-5">
        <h3 className="mb-1 font-heading text-base font-semibold text-foreground">
          Fixes per day
        </h3>
        <p className="mb-4 text-xs text-muted">Last 7 days (sample)</p>
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
                name="Fixes"
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
        <p className="mb-4 text-xs text-muted">Session snapshot (sample)</p>
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
              <XAxis type="number" tick={tick} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={tick}
                axisLine={false}
                tickLine={false}
                width={88}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="n" name="Count" fill="#e11d48" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
