"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { useJobQueue } from "@/context/JobQueueContext";
import {
  DashboardPageSkeleton,
  IssueListSkeleton,
} from "@/components/skeletons/presets";

const PAGE_SIZE = 10;

type GitHubOwner = { login: string };

export type RepoForWorkspace = {
  id: number;
  name: string;
  clone_url: string;
  owner: GitHubOwner;
};

type Issue = {
  id: number;
  title: string;
};

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`mb-1.5 font-heading text-base font-semibold tracking-tight text-foreground ${className}`}
    >
      {children}
    </h2>
  );
}

export function RepoIssuesWorkspace() {
  const [repos, setRepos] = useState<RepoForWorkspace[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepoForWorkspace | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [reposLoading, setReposLoading] = useState(true);
  const [page, setPage] = useState(1);
  const issuesPanelRef = useRef<HTMLElement>(null);
  const { submitFix, isFixActiveForIssue } = useJobQueue();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setLoadError("Not signed in. Use GitHub login from the home page.");
      setReposLoading(false);
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
      .catch(() => setLoadError("Could not load repositories."))
      .finally(() => setReposLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(repos.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [repos.length, totalPages]);

  const pagedRepos = repos.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const loadIssues = (repo: RepoForWorkspace) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSelectedRepo(repo);
    setIssues([]);
    setIssuesError(null);
    setIssuesLoading(true);

    fetch(`${API_BASE}/repos/${repo.owner.login}/${repo.name}/issues`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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

  const issuesBlock = (
    <section
      ref={issuesPanelRef}
      aria-labelledby="issues-heading"
      className="min-w-0 self-start rounded-lg border border-border bg-surface-elevated/40 p-3 sm:p-4"
    >
      <SectionTitle>
        <span id="issues-heading">Issues to fix</span>
      </SectionTitle>
      <p className="mb-2 text-pretty text-xs leading-snug text-muted sm:text-sm">
        <span className="text-foreground">Load issues</span> on a repository,
        then <span className="text-foreground">Run fix</span> — the job
        appears under <span className="text-foreground">Activity</span> in the
        sidebar.
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
      {issuesLoading && <IssueListSkeleton rows={4} />}
      {selectedRepo && !issuesLoading && issues.length > 0 && (
        <ul className="space-y-2.5">
          {issues.map((issue) => {
            const working = isFixActiveForIssue(issue.id);
            return (
              <li
                key={issue.id}
                className="flex flex-col gap-2.5 rounded-md border border-border bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <p className="min-w-0 flex-1 text-pretty text-sm leading-snug text-foreground">
                  {issue.title}
                </p>
                <button
                  type="button"
                  aria-busy={working}
                  onClick={() => {
                    if (!selectedRepo || working) return;
                    void submitFix({
                      issueId: issue.id,
                      issueTitle: issue.title,
                      repoLabel: `${selectedRepo.owner.login}/${selectedRepo.name}`,
                      repoUrl: selectedRepo.clone_url,
                    });
                  }}
                  className={[
                    "min-h-10 w-full shrink-0 rounded-md px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:min-w-30 sm:w-auto",
                    working
                      ? "cursor-not-allowed border border-accent/25 bg-accent/35 text-white/95"
                      : "bg-accent text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50",
                  ].join(" ")}
                  disabled={!selectedRepo || working}
                >
                  {working ? (
                    <span className="inline-flex w-full items-center justify-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 animate-pulse-soft rounded-full bg-white/90"
                        aria-hidden
                      />
                      <span>Working on it…</span>
                    </span>
                  ) : (
                    "Run fix"
                  )}
                </button>
              </li>
            );
          })}
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

  if (reposLoading && !loadError) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-4">
      <header className="shrink-0 space-y-0.5">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Repositories
        </h1>
        <p className="text-xs text-muted sm:text-sm">
          Load issues and run agent fixes. Ten repos per page.
        </p>
      </header>

      {loadError && (
        <p className="shrink-0 rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-danger">
          {loadError}
        </p>
      )}

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 content-start gap-4 min-[1280px]:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.9fr)] min-[1280px]:items-start min-[1280px]:gap-6">
        <section
          aria-labelledby="repos-heading"
          className="flex min-h-0 min-w-0 flex-col"
        >
          <SectionTitle>
            <span id="repos-heading">Your repositories</span>
          </SectionTitle>

          {repos.length === 0 && !loadError && !reposLoading && (
            <p className="text-sm text-muted">No repositories yet.</p>
          )}

          {repos.length > 0 && (
            <div className="mb-1.5 flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-muted sm:text-xs">
                Page {page} of {totalPages}
                <span className="text-muted/70"> · {repos.length} total</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 min-w-16 rounded-md border border-border bg-surface-elevated px-2.5 text-xs text-foreground transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 min-w-16 rounded-md border border-border bg-surface-elevated px-2.5 text-xs text-foreground transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          <ul className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto rounded-md border border-border bg-surface min-[1280px]:max-h-[calc(100dvh-11.25rem)]">
            {pagedRepos.map((repo) => {
              const isSelected = selectedRepo?.id === repo.id;
              return (
                <li
                  key={repo.id}
                  className={[
                    "flex flex-nowrap items-center justify-between gap-2 border-b border-border px-2.5 py-1.5 last:border-b-0 sm:gap-3 sm:px-3",
                    "transition-colors",
                    isSelected
                      ? "bg-surface-elevated ring-1 ring-inset ring-accent/25"
                      : "hover:bg-surface-elevated/50",
                  ].join(" ")}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className="flex min-w-0 items-center gap-1.5"
                      title={`${repo.owner.login}/${repo.name}`}
                    >
                      <span className="min-w-0 truncate font-mono text-xs leading-tight text-foreground sm:text-[13px]">
                        {repo.owner.login}/{repo.name}
                      </span>
                      {isSelected && (
                        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-accent sm:text-[10px]">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => loadIssues(repo)}
                      className="h-8 whitespace-nowrap rounded-md border border-border bg-surface-elevated px-2.5 text-xs font-medium text-foreground transition hover:border-accent/40 hover:text-accent sm:px-3"
                    >
                      Load issues
                    </button>
                    <Link
                      href={`/issues?owner=${encodeURIComponent(repo.owner.login)}&repo=${encodeURIComponent(repo.name)}`}
                      className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md border border-border bg-transparent px-2.5 text-xs text-muted transition hover:border-border hover:text-foreground sm:px-3"
                    >
                      Issues view
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="min-w-0 min-[1280px]:min-h-0 min-[1280px]:overflow-y-auto">
          {issuesBlock}
        </div>
      </div>
    </div>
  );
}
