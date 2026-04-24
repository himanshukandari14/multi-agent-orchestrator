import Link from "next/link";

export default function KnowledgePage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-2 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">
        Knowledge
      </p>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        Knowledge base
      </h1>
      <p className="mt-3 max-w-md text-pretty text-sm text-muted">
        Docs, runbooks, and fix patterns will live here. We&apos;re still
        shipping the first version.
      </p>
      <p
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-elevated/50 px-4 py-1.5 text-xs font-medium text-muted"
        role="status"
        aria-label="Status"
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
          aria-hidden
        />
        Coming soon
      </p>
      <Link
        href="/dashboard"
        className="mt-8 text-sm text-accent underline decoration-border underline-offset-4 transition hover:text-foreground"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
