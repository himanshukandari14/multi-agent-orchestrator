"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api";

type Issue = {
  id: number;
  title: string;
  state: string;
};

function IssuesList() {
  const search = useSearchParams();
  const owner = search.get("owner")?.trim() ?? "";
  const repo = search.get("repo")?.trim() ?? "";
  const [issues, setIssues] = useState<Issue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!owner || !repo) {
      setIssues([]);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not signed in.");
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/repos/${owner}/${repo}/issues`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setIssues(data as Issue[]);
      })
      .catch(() => setError("Could not load issues."))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (!owner || !repo) {
    return (
      <p className="text-sm text-muted">
        Add <span className="font-mono text-foreground">?owner=…&repo=…</span> to
        the URL, or open a repo from the{" "}
        <Link className="text-accent hover:underline" href="/dashboard">
          dashboard
        </Link>
        .
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-danger" role="alert">
        {error}
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (issues.length === 0) {
    return <p className="text-sm text-muted">No issues found.</p>;
  }

  return (
    <ul className="space-y-2">
      {issues.map((issue) => (
        <li
          key={issue.id}
          className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="text-sm text-foreground">{issue.title}</span>
          <span className="text-[12px] uppercase tracking-wide text-muted">
            {issue.state}
          </span>
        </li>
      ))}
    </ul>
  );
}

function IssuesFallback() {
  return <p className="text-sm text-muted">Loading…</p>;
}

export default function IssuesPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Issues
        </h1>
        <p className="text-sm text-muted">
          Read-only list from the API. Use the dashboard to run fixes.
        </p>
      </header>
      <Suspense fallback={<IssuesFallback />}>
        <IssuesList />
      </Suspense>
    </div>
  );
}
