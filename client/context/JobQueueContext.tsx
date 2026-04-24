"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { API_BASE } from "@/lib/api";

export type QueueJob = {
  clientId: string;
  serverJobId: string | null;
  issueId: number;
  issueTitle: string;
  repoLabel: string;
  status: "queued" | "pending" | "processing" | "completed" | "failed" | "stalled";
  createdAt: number;
  lastPolled: number;
  progress: number;
  message: string;
  prUrl?: string;
  error?: string;
};

type Ctx = {
  jobs: QueueJob[];
  activeCount: number;
  submitFix: (input: {
    issueId: number;
    issueTitle: string;
    repoLabel: string;
    repoUrl: string;
  }) => Promise<void>;
  /** True while a fix is queued, pending, or processing for this GitHub issue. */
  isFixActiveForIssue: (issueId: number) => boolean;
  dismissToast: () => void;
  toastMessage: string | null;
  removeJob: (clientId: string) => void;
  /** true while a background poll is in progress (any job). */
  isPolling: boolean;
};

const JobQueueContext = createContext<Ctx | null>(null);

const POLL_MS = 2000;
const AUTO_DISMISS_SUCCESS_MS = 12_000;

function mapStatus(s: string): QueueJob["status"] {
  if (s === "pending" || s === "processing") return s;
  if (s === "completed") return "completed";
  if (s === "failed") return "failed";
  if (s === "queued" || s === "unknown" || s === "running")
    return "pending";
  return "pending";
}

const terminal: QueueJob["status"][] = [
  "completed",
  "failed",
  "stalled",
];

function isJobTerminal(s: QueueJob["status"]) {
  return terminal.includes(s);
}

export function JobQueueProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const jobsRef = useRef<QueueJob[]>([]);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);
  const completedToastShownRef = useRef(new Set<string>());

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(dismissToast, 4200);
    return () => clearTimeout(t);
  }, [toastMessage, dismissToast]);

  const updateJob = useCallback(
    (clientId: string, patch: Partial<QueueJob>) => {
      setJobs((prev) =>
        prev.map((j) => (j.clientId === clientId ? { ...j, ...patch } : j)),
      );
    },
    [],
  );

  const removeJob = useCallback((clientId: string) => {
    setJobs((prev) => prev.filter((j) => j.clientId !== clientId));
  }, []);

  const scheduleAutoDismiss = useCallback(
    (clientId: string) => {
      const t = setTimeout(() => {
        setJobs((prev) => prev.filter((j) => j.clientId !== clientId));
      }, AUTO_DISMISS_SUCCESS_MS);
      autoDismissRef.current.push(t);
    },
    [],
  );

  const processPollResult = useCallback(
    (clientId: string, res: Record<string, unknown>) => {
      const st = "status" in res ? String(res.status) : "unknown";
      const progress = typeof res.progress === "number" ? res.progress : 0;
      const message = typeof res.message === "string" ? res.message : "";
      const result = res.result as
        | { pr_url?: string; error?: string }
        | undefined
        | null;

      if (st === "completed") {
        const prUrl =
          result && typeof result === "object" && result
            ? result.pr_url
            : undefined;
        const justFinished = !jobsRef.current.find(
          (j) => j.clientId === clientId && j.status === "completed",
        );
        updateJob(clientId, {
          status: "completed",
          progress: 100,
          message: message || "Done",
          prUrl: typeof prUrl === "string" ? prUrl : undefined,
          lastPolled: Date.now(),
        });
        if (justFinished) {
          if (!completedToastShownRef.current.has(clientId)) {
            completedToastShownRef.current.add(clientId);
            showToast("Fix finished—check Activity for the PR (card hides in a few seconds).");
          }
          scheduleAutoDismiss(clientId);
        }
        return;
      }
      if (st === "failed") {
        const err =
          result && typeof result === "object" && "error" in result
            ? String(result.error)
            : "Job failed";
        updateJob(clientId, {
          status: "failed",
          progress: 100,
          error: err,
          lastPolled: Date.now(),
        });
        return;
      }

      const mapped = mapStatus(st);
      const prev = jobsRef.current.find((x) => x.clientId === clientId);
      updateJob(clientId, {
        status: mapped,
        progress,
        message: message || prev?.message || "",
        lastPolled: Date.now(),
      });
    },
    [scheduleAutoDismiss, showToast, updateJob],
  );

  // Stall detection: track unknown streak per job in a ref
  const unknownStreak = useRef<Record<string, number>>({});
  useEffect(() => {
    const run = () => {
      void (async () => {
        const list = jobsRef.current;
        const toPoll = list.filter(
          (j) =>
            j.serverJobId && !isJobTerminal(j.status) && j.status !== "stalled",
        );
        if (toPoll.length === 0) {
          return;
        }
        setIsPolling(true);
        const token = localStorage.getItem("token");
        try {
          for (const j of toPoll) {
            if (!j.serverJobId) continue;
            try {
              const r = await fetch(`${API_BASE}/jobs/${j.serverJobId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (!r.ok) continue;
              const data = (await r.json()) as Record<string, unknown>;
              const st = "status" in data ? String(data.status) : "unknown";
              if (st === "unknown") {
                const id = j.clientId;
                unknownStreak.current[id] = (unknownStreak.current[id] ?? 0) + 1;
                if (unknownStreak.current[id] >= 80) {
                  updateJob(j.clientId, {
                    status: "stalled",
                    lastPolled: Date.now(),
                  });
                  delete unknownStreak.current[id];
                }
                continue;
              }
              delete unknownStreak.current[j.clientId];
              processPollResult(j.clientId, data);
            } catch {
              // ignore
            }
          }
        } finally {
          setIsPolling(false);
        }
      })();
    };
    run();
    const intervalId = setInterval(run, POLL_MS);
    return () => {
      clearInterval(intervalId);
    };
  }, [processPollResult, updateJob]);

  useEffect(
    () => () => {
      for (const t of autoDismissRef.current) clearTimeout(t);
    },
    [],
  );

  const submitFix = useCallback(
    async (input: {
      issueId: number;
      issueTitle: string;
      repoLabel: string;
      repoUrl: string;
    }) => {
      const clientId = crypto.randomUUID();
      const now = Date.now();
      const initial: QueueJob = {
        clientId,
        serverJobId: null,
        issueId: input.issueId,
        issueTitle: input.issueTitle,
        repoLabel: input.repoLabel,
        status: "queued",
        createdAt: now,
        lastPolled: now,
        progress: 0,
        message: "Queuing…",
      };
      setJobs((prev) => [initial, ...prev]);
      showToast("Added to queue — you can follow progress in Activity.");

      const token = localStorage.getItem("token");
      if (!token) {
        updateJob(clientId, {
          status: "failed",
          error: "Not signed in.",
          lastPolled: Date.now(),
        });
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/fix`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            repo_url: input.repoUrl,
            issue: input.issueTitle,
          }),
        });
        const data = (await res.json()) as { job_id?: string };
        if (!res.ok || !data.job_id) {
          updateJob(clientId, {
            status: "failed",
            error: "Could not start fix job.",
            lastPolled: Date.now(),
          });
          return;
        }
        updateJob(clientId, {
          serverJobId: data.job_id,
          status: "pending",
          message: "Worker picked up the job",
          lastPolled: Date.now(),
        });
        // Global interval will poll this job_id next tick.
      } catch {
        updateJob(clientId, {
          status: "failed",
          error: "Network error.",
          lastPolled: Date.now(),
        });
      }
    },
    [showToast, updateJob],
  );

  const activeCount = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.status !== "completed" &&
          j.status !== "failed" &&
          j.status !== "stalled",
      ).length,
    [jobs],
  );

  const isFixActiveForIssue = useCallback(
    (issueId: number) =>
      jobs.some(
        (j) =>
          j.issueId === issueId &&
          (j.status === "queued" ||
            j.status === "pending" ||
            j.status === "processing"),
      ),
    [jobs],
  );

  const value: Ctx = {
    jobs,
    activeCount,
    submitFix,
    isFixActiveForIssue,
    dismissToast,
    toastMessage,
    removeJob,
    isPolling,
  };

  return (
    <JobQueueContext.Provider value={value}>
      {children}
      {toastMessage && (
        <div
          className="pointer-events-auto fixed bottom-5 left-1/2 z-100 w-[min(100%-2rem,22rem)] -translate-x-1/2 animate-toast-in rounded-lg border border-accent/30 bg-surface-elevated px-4 py-3 text-center text-sm text-foreground shadow-lg shadow-black/40"
          role="status"
        >
          <p className="text-pretty">{toastMessage}</p>
          <button
            type="button"
            onClick={dismissToast}
            className="mt-2 text-xs text-muted underline transition hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}
    </JobQueueContext.Provider>
  );
}

export function useJobQueue() {
  const c = useContext(JobQueueContext);
  if (!c) throw new Error("useJobQueue must be used inside JobQueueProvider");
  return c;
}
