"use client";

import Skeleton from "react-loading-skeleton";

/** Page title + subtitle lines (optional description). */
export function PageHeaderSkeleton({
  showKicker = false,
}: {
  showKicker?: boolean;
}) {
  return (
    <header className="space-y-2" aria-hidden>
      {showKicker && <Skeleton width={72} height={12} />}
      <Skeleton width="40%" height={28} className="max-w-xs" />
      <Skeleton count={2} width="100%" height={14} className="max-w-xl" />
    </header>
  );
}

export function RepoRowSkeleton() {
  return (
    <li className="border-b border-border px-4 py-4 last:border-b-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton width="75%" height={16} className="max-w-md" />
        <div className="flex gap-2">
          <Skeleton width={120} height={40} borderRadius={6} />
          <Skeleton width={100} height={40} borderRadius={6} />
        </div>
      </div>
    </li>
  );
}

export function RepoListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul
      className="overflow-hidden rounded-lg border border-border bg-surface"
      aria-hidden
    >
      {Array.from({ length: rows }).map((_, i) => (
        <RepoRowSkeleton key={i} />
      ))}
    </ul>
  );
}

export function IssueRowSkeleton() {
  return (
    <li className="rounded-lg border border-border bg-surface px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton width="70%" height={16} />
        <Skeleton width={48} height={12} />
      </div>
    </li>
  );
}

export function IssueListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <IssueRowSkeleton key={i} />
      ))}
    </ul>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="rounded-lg border border-border bg-surface-elevated/40 px-4 py-4">
        <Skeleton width="55%" height={16} className="mb-2" />
        <Skeleton count={2} width="100%" height={12} className="max-w-md" />
      </div>
      <Skeleton width={100} height={40} borderRadius={6} />
    </div>
  );
}

/** Dashboard: left column / repo list only. */
export function DashboardRepoColumnSkeleton() {
  return (
    <section className="min-w-0" aria-hidden>
      <Skeleton width={160} height={24} className="mb-3" />
      <RepoListSkeleton rows={6} />
    </section>
  );
}

/** Right column: issues panel shape. */
export function DashboardIssuesPanelSkeleton() {
  return (
    <section
      className="min-w-0 rounded-lg border border-border bg-surface-elevated/40 p-4 sm:p-5"
      aria-hidden
    >
      <Skeleton width={140} height={24} className="mb-3" />
      <Skeleton count={2} className="mb-4" height={12} width="100%" />
      <IssueListSkeleton rows={3} />
    </section>
  );
}

/** Activity: three job cards. */
export function ActivityJobCardsSkeleton() {
  return (
    <ul className="space-y-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="overflow-hidden rounded-xl border border-border bg-surface/30 p-4"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Skeleton width={88} height={20} borderRadius={9999} />
            <Skeleton width={72} height={14} />
          </div>
          <Skeleton width="72%" height={20} className="mb-2" />
          <Skeleton width="48%" height={14} className="mb-3" />
          <Skeleton width="100%" height={6} borderRadius={9999} />
        </li>
      ))}
    </ul>
  );
}

/** Full main-area layouts for `loading.tsx` and client loading states. */

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="grid min-w-0 grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
        <DashboardRepoColumnSkeleton />
        <DashboardIssuesPanelSkeleton />
      </div>
    </div>
  );
}

export function IssuesPageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <IssueListSkeleton rows={4} />
    </div>
  );
}

export function ActivityPageSkeleton() {
  return (
    <div className="space-y-10" aria-hidden>
      <div className="space-y-2">
        <Skeleton width={56} height={12} />
        <Skeleton width="55%" height={40} className="max-w-sm" />
        <div className="max-w-2xl space-y-2">
          <Skeleton width="100%" height={14} />
          <Skeleton width="85%" height={14} />
        </div>
      </div>
      <ActivityJobCardsSkeleton />
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="max-w-lg space-y-8">
      <PageHeaderSkeleton showKicker />
      <ProfileCardSkeleton />
    </div>
  );
}
