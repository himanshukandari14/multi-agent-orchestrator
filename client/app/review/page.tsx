"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import { RefreshCw, Loader2, Search } from "lucide-react";

type RepoInfo = {
  full_name: string;
  name: string;
};

const PAGE_SIZE = 6;

export default function ReviewPage() {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [enabledRepos, setEnabledRepos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : {};

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [reposRes, reviewRes] = await Promise.all([
        fetch(`${API_BASE}/repos`, { headers }),
        fetch(`${API_BASE}/review/autoreview/repos`, { headers }),
      ]);
      const reposData = await reposRes.json();
      const reviewData = await reviewRes.json();
      setRepos(
        (reposData || []).map((r: any) => ({
          full_name: r.full_name,
          name: r.name,
        }))
      );
      setEnabledRepos(new Set(reviewData?.repos || []));
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleToggle = async (repoFullName: string, currentlyEnabled: boolean) => {
    setToggling(repoFullName);
    try {
      const res = await fetch(`${API_BASE}/review/autoreview/toggle`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          repo_full_name: repoFullName,
          enabled: !currentlyEnabled,
        }),
      });
      const data = await res.json();
      if (data.enabled) {
        setEnabledRepos((prev) => new Set([...prev, repoFullName]));
      } else {
        setEnabledRepos((prev) => {
          const next = new Set(prev);
          next.delete(repoFullName);
          return next;
        });
      }
    } catch (e) {
      console.error("Toggle failed", e);
    } finally {
      setToggling(null);
    }
  };

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden">
      {/* Fixed top section */}
      <div className="shrink-0 space-y-4 px-1 pt-2 pb-4">
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Pull Request Auto-Review
        </h1>
        <div className="relative overflow-hidden rounded-xl border border-accent/20 bg-accent/5 px-6 py-4 flex items-center justify-between">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-base font-bold text-foreground mb-1">
              AI Code Reviews on Autopilot
            </h2>
            <p className="text-sm text-muted">
              Toggle auto-review on any repo. PatchPilot will install a webhook
              and review every new PR.
            </p>
          </div>
          <div className="hidden md:flex relative w-20 h-20 items-center justify-center shrink-0 ml-6">
            <div className="absolute inset-0 rounded-full border border-dashed border-accent/30 animate-[spin_20s_linear_infinite]" />
            <img src="/logo.svg" alt="PatchPilot" className="w-9 h-9 drop-shadow-[0_0_14px_rgba(225,29,72,0.5)]" />
          </div>
        </div>
      </div>

      {/* Repos card — fills remaining space */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-surface shadow-sm overflow-hidden mx-1 mb-2">
        {/* Sticky search header */}
        <div className="shrink-0 border-b border-border bg-surface-elevated px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-foreground text-sm">
            Your Repositories
            {!loading && (
              <span className="ml-2 text-xs text-muted font-normal">
                ({enabledRepos.size} active · {repos.length} total)
              </span>
            )}
          </h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search repos…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full sm:w-52 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition"
              />
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="text-xs font-medium text-muted hover:text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sync
            </button>
          </div>
        </div>

        {/* Scrollable repo rows */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted gap-3">
              <Loader2 size={20} className="animate-spin" />
              Loading repositories…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted">
              {search ? "No repositories match your search." : "No repositories found."}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paginated.map((repo) => {
                const active = enabledRepos.has(repo.full_name);
                const isToggling = toggling === repo.full_name;
                return (
                  <div key={repo.full_name} className="flex items-center justify-between px-6 py-4 hover:bg-surface-elevated/30 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                        <img
                          src="/logo.svg"
                          className={`w-5 h-5 transition-all duration-300 ${active ? "opacity-100 drop-shadow-[0_0_10px_rgba(225,29,72,0.4)]" : "opacity-30 grayscale"}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground text-sm truncate">{repo.full_name}</h4>
                        <p className="text-xs text-muted mt-0.5">
                          {active ? "✅ Auto-review active on all new PRs." : "Auto-review is disabled."}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(repo.full_name, active)}
                      disabled={isToggling}
                      className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${active ? "bg-accent" : "bg-[#21262d]"} ${isToggling ? "opacity-50 cursor-wait" : ""}`}
                    >
                      {isToggling ? (
                        <Loader2 size={12} className="animate-spin text-white mx-auto" />
                      ) : (
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? "translate-x-6" : "translate-x-1"}`} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination — pinned at bottom */}
        {!loading && totalPages > 1 && (
          <div className="shrink-0 flex items-center justify-between border-t border-border px-6 py-3 bg-surface-elevated/50">
            <p className="text-xs text-muted">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3 rounded-md text-xs font-medium border border-border bg-background text-muted hover:text-foreground transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-md text-xs font-medium transition ${p === page ? "bg-accent text-white" : "border border-border bg-background text-muted hover:text-foreground"}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-3 rounded-md text-xs font-medium border border-border bg-background text-muted hover:text-foreground transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
