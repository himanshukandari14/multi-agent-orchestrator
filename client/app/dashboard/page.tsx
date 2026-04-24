"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

type GitHubOwner = { login: string };

type Repo = {
  id: number;
  name: string;
  clone_url: string;
  owner: GitHubOwner;
};

type Issue = {
  id: number;
  title: string;
};

type JobResult = { pr_url?: string; error?: string };

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  );
}

export default function Dashboard() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const issuesPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, document.title, "/dashboard");
    }

    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setLoadError("Not signed in. Use GitHub login from the home page.");
      return;
    }

    fetch(`${API_BASE}/repos`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load repositories.");
        return res.json();
      })
      .then((data) => {
        setRepos(data);
        setLoadError(null);
      })
      .catch(() => setLoadError("Could not load repositories."));
  }, []);

  const loadIssues = (repo: Repo) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSelectedRepo(repo);
    setIssues([]);
    setIssuesError(null);
    setIssuesLoading(true);

    fetch(
      `${API_BASE}/repos/${repo.owner.login}/${repo.name}/issues`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => {
            const msg =
              typeof body === "object" && body && "message" in body
                ? String((body as { message?: string }).message)
                : "Request failed";
            throw new Error(msg);
          });
        }
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setIssues(
          list.filter(
            (item: { pull_request?: unknown; id: number; title: string }) =>
              item != null && !item.pull_request,
          ) as Issue[],
        );
        setIssuesError(null);
        requestAnimationFrame(() => {
          issuesPanelRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        });
      })
      .catch((e: Error) => {
        setIssuesError(e.message || "Could not load issues.");
        setIssues([]);
      })
      .finally(() => setIssuesLoading(false));
  };

  const fixIssue = useCallback(
    async (issue: Issue) => {
      const token = localStorage.getItem("token");
      if (!token || !selectedRepo) return;

      const res = await fetch(`${API_BASE}/fix`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repo_url: selectedRepo.clone_url,
          issue: issue.title,
        }),
      });

      const data = await res.json();
      const jobId = data.job_id as string | undefined;
      if (!jobId) {
        alert("Could not start fix.");
        return;
      }

      const interval = setInterval(async () => {
        const jobRes = await fetch(`${API_BASE}/jobs/${jobId}`);
        const job = (await jobRes.json()) as {
          status: string;
          result?: JobResult;
        };

        if (job.status === "completed") {
          clearInterval(interval);
          const url = job.result?.pr_url;
          alert(url ? `PR created: ${url}` : "Completed.");
        }

        if (job.status === "failed") {
          clearInterval(interval);
          const err = job.result?.error ?? "Unknown error";
          alert(`Failed: ${err}`);
        }
      }, 3000);
    },
    [selectedRepo],
  );

  const issuesBlock = (
    <section
      ref={issuesPanelRef}
      aria-labelledby="issues-heading"
      className="min-w-0 rounded-lg border border-border bg-surface-elevated/40 p-4 sm:p-5"
    >
      <SectionTitle>
        <span id="issues-heading">Issues to fix</span>
      </SectionTitle>
      <p className="mb-4 text-pretty text-sm text-muted">
        <span className="text-foreground">Load issues</span> on a repository,
        then <span className="text-foreground">Run fix</span> for an open
        issue.
      </p>

      {issuesError && (
        <p className="mb-3 rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-danger">
          {issuesError}
        </p>
      )}

      {selectedRepo && (
        <p
          className="mb-3 wrap-break-word font-mono text-sm leading-relaxed text-foreground"
          title={`${selectedRepo.owner.login}/${selectedRepo.name}`}
        >
          {selectedRepo.owner.login}/{selectedRepo.name}
        </p>
      )}
      {!selectedRepo && !issuesLoading && (
        <p className="text-sm text-muted">No repository selected yet.</p>
      )}
      {issuesLoading && (
        <p className="text-sm text-muted">Loading issues…</p>
      )}
      {selectedRepo && !issuesLoading && issues.length > 0 && (
        <ul className="space-y-2.5">
          {issues.map((issue) => (
            <li
              key={issue.id}
              className="flex flex-col gap-2.5 rounded-md border border-border bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <p className="min-w-0 flex-1 text-pretty text-sm leading-snug text-foreground">
                {issue.title}
              </p>
              <button
                type="button"
                onClick={() => fixIssue(issue)}
                className="min-h-10 w-full shrink-0 rounded-md bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:min-w-30 sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!selectedRepo}
              >
                Run fix
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedRepo &&
        !issuesLoading &&
        issues.length === 0 &&
        !issuesError && (
          <p className="text-sm text-muted">
            No open issues in this repository. Open an issue on GitHub, then
            load again.
          </p>
        )}
    </section>
  );

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted">
          Repositories and open issues for the signed-in account.
        </p>
      </header>

      {loadError && (
        <p className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-danger">
          {loadError}
        </p>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
        <section aria-labelledby="repos-heading" className="min-w-0">
          <SectionTitle>
            <span id="repos-heading">Repositories</span>
          </SectionTitle>
          {repos.length === 0 && !loadError && (
            <p className="text-sm text-muted">No repositories yet.</p>
          )}
          <ul className="overflow-hidden rounded-lg border border-border bg-surface">
            {repos.map((repo) => {
              const isSelected = selectedRepo?.id === repo.id;
              return (
                <li
                  key={repo.id}
                  className={[
                    "min-w-0 border-b border-border px-4 py-4 last:border-b-0",
                    "flex flex-col gap-3 transition-colors",
                    isSelected
                      ? "bg-surface-elevated ring-1 ring-inset ring-accent/25"
                      : "hover:bg-surface-elevated/50",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p
                      className="font-mono text-sm leading-normal text-foreground wrap-anywhere sm:leading-relaxed"
                      title={`${repo.owner.login}/${repo.name}`}
                    >
                      {repo.owner.login}/{repo.name}
                    </p>
                    {isSelected && (
                      <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-accent">
                        Active
                      </p>
                    )}
                  </div>
                  <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => loadIssues(repo)}
                      className="min-h-10 min-w-30 flex-1 rounded-md border border-border bg-surface-elevated px-3 text-sm text-foreground transition hover:border-accent/40 hover:text-accent sm:flex-initial"
                    >
                      Load issues
                    </button>
                    <Link
                      href={`/issues?owner=${encodeURIComponent(repo.owner.login)}&repo=${encodeURIComponent(repo.name)}`}
                      className="inline-flex min-h-10 min-w-30 flex-1 items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm text-muted transition hover:border-border hover:text-foreground sm:flex-initial"
                    >
                      Issues view
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {issuesBlock}
      </div>
    </div>
  );
}
