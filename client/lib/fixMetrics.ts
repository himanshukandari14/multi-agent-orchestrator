import { API_BASE } from "@/lib/api";

export type FixMetrics = {
  completed_total: number;
  failed_total: number;
  in_progress: number;
  completed_last_30d: number;
  failed_last_30d: number;
  success_rate_last_30d_pct: number | null;
  median_seconds_to_complete: number | null;
  last_7_days: Array<{
    date: string;
    label: string;
    completed: number;
  }>;
  outcomes: {
    completed: number;
    failed: number;
    in_progress: number;
  };
};

export async function fetchFixMetrics(token: string): Promise<FixMetrics> {
  const r = await fetch(`${API_BASE}/fix/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    throw new Error("Could not load fix metrics");
  }
  return (await r.json()) as FixMetrics;
}

export function formatMedianSeconds(
  seconds: number | null | undefined,
): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return "—";
  }
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
