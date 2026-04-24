"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

type GitHubOwner = { login: string };

type Repo = {
  id: number;
  name: string;
  owner: GitHubOwner;
};

export default function ReposPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Sign in from the home page to list repositories.");
      return;
    }
    fetch(`${API_BASE}/repos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => setRepos(data as Repo[]))
      .catch(() => setError("Could not load repositories."));
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Repositories
        </h1>
        <p className="text-sm text-muted">
          All repos available to the current session.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {repos.map((repo) => (
          <li
            key={repo.id}
            className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="font-mono text-sm text-foreground">
              {repo.owner.login}/{repo.name}
            </p>
            <Link
              href={`/issues?owner=${encodeURIComponent(repo.owner.login)}&repo=${encodeURIComponent(repo.name)}`}
              className="text-sm text-muted underline decoration-border underline-offset-4 transition hover:text-accent"
            >
              View issues
            </Link>
          </li>
        ))}
      </ul>
      {repos.length === 0 && !error && (
        <p className="text-sm text-muted">No repositories.</p>
      )}
    </div>
  );
}
