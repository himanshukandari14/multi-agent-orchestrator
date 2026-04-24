import type { Metadata } from "next";
import { API_BASE } from "@/lib/api";

export const metadata: Metadata = {
  title: "AI GitHub Fixer — Agent fixes for your issues",
  description:
    "Connect GitHub, pick issues, and ship fixes with a focused multi-agent workflow.",
};

const loginHref = `${API_BASE}/auth/github/login`;

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(100%_80%_at_20%_0%,rgba(225,29,72,0.14),transparent_50%),radial-gradient(80%_60%_at_100%_40%,rgba(244,63,94,0.08),transparent_45%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_90%_70%_at_50%_0%,#000_40%,transparent)]"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6">
        <span className="font-heading text-[18px] font-semibold tracking-tight">
          <span className="text-accent" aria-hidden>
            /
          </span>
          <span className="text-foreground">fixer</span>
        </span>
        <a
          href={loginHref}
          className="rounded-md border border-border/80 bg-surface-elevated/30 px-4 py-2 text-[13px] font-medium text-foreground transition hover:border-accent/30 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Sign in with GitHub
        </a>
      </header>

      <main
        className="relative z-10 flex flex-1 flex-col px-5 pb-16 pt-2 sm:px-8"
        id="main"
      >
        <section
          className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-8 sm:min-h-[min(72vh,720px)] sm:py-12"
          aria-labelledby="hero-heading"
        >
          <p
            className="landing-hero-t font-mono text-[12px] font-medium uppercase tracking-[0.28em] text-accent/90"
            style={{ animationDelay: "0.05s" }}
          >
            Multi-agent
          </p>
          <h1
            id="hero-heading"
            className="landing-hero-t mt-3 max-w-[18ch] font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl"
            style={{ animationDelay: "0.12s" }}
          >
            Ship the fix, not the busywork
          </h1>
          <p
            className="landing-hero-t mt-5 max-w-xl text-balance text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "0.2s" }}
          >
            Connect your org, point agents at open issues, and get PRs you can
            review — without tab sprawl or hand-off drift.
          </p>
          <div
            className="landing-hero-t mt-8 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.28s" }}
          >
            <a href={loginHref}>
              <span className="inline-flex min-h-12 min-w-[220px] cursor-pointer items-center justify-center rounded-md border border-transparent bg-accent px-7 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                Get started
              </span>
            </a>
            <a
              href="#how"
              className="text-sm font-medium text-muted underline decoration-border decoration-1 underline-offset-4 transition hover:text-foreground hover:decoration-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2"
            >
              How it works
            </a>
          </div>
        </section>

        <section
          id="how"
          className="mx-auto w-full max-w-5xl border-t border-border/80 py-16 sm:py-20"
          aria-labelledby="how-heading"
        >
          <h2
            id="how-heading"
            className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            From issue to pull request
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
            Three clear beats — the same order your team already thinks in.
          </p>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {[
              {
                n: "01",
                t: "Connect",
                d: "Authorize GitHub once. We only use the scopes we need to read issues and open PRs.",
              },
              {
                n: "02",
                t: "Target",
                d: "Pick a repo, filter what matters, and let agents work in parallel on separate threads.",
              },
              {
                n: "03",
                t: "Review",
                d: "You get concrete diffs. Merge when it looks right — the queue keeps status honest.",
              },
            ].map((row) => (
              <li
                key={row.n}
                className="group relative border-t border-border pt-6 sm:pt-8"
              >
                <p className="font-mono text-[11px] font-medium text-accent/80">
                  {row.n}
                </p>
                <h3 className="mt-2 font-heading text-lg font-semibold text-foreground">
                  {row.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {row.d}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="mx-auto w-full max-w-5xl border-t border-border/80 py-16 sm:py-20"
          aria-labelledby="proof-heading"
        >
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="proof-heading"
                className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                Built for real repos
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                The UI stays calm so you can see job state, success paths, and
                failures at a glance — not buried in log noise.
              </p>
            </div>
            <a href={loginHref} className="shrink-0 sm:mb-1">
              <span className="inline-flex min-h-11 min-w-[200px] cursor-pointer items-center justify-center rounded-md border border-border bg-surface-elevated/50 px-6 text-sm font-medium text-foreground transition hover:border-accent/40 hover:text-accent">
                Open the app
              </span>
            </a>
          </div>
        </section>

        <section
          className="mx-auto w-full max-w-5xl border-t border-border/80 py-12 sm:py-16"
          aria-label="Get started"
        >
          <div className="flex flex-col items-start justify-between gap-6 rounded-md border border-border/80 bg-surface-elevated/20 px-6 py-8 sm:flex-row sm:items-center sm:px-8 sm:py-10">
            <p className="max-w-md font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Ready when your backlog is
            </p>
            <a href={loginHref} className="w-full sm:w-auto">
              <span className="inline-flex w-full min-h-11 min-w-[200px] cursor-pointer items-center justify-center rounded-md border border-transparent bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Sign in with GitHub
              </span>
            </a>
          </div>
        </section>

        <footer className="mx-auto w-full max-w-5xl border-t border-border/80 py-8 text-center text-[12px] text-muted/80 sm:py-10">
          <p>
            AI GitHub Fixer —{" "}
            <a
              href="https://github.com"
              className="text-muted underline decoration-border/80 underline-offset-2 transition hover:text-foreground"
            >
              GitHub
            </a>{" "}
            OAuth.{" "}
            <a
              href={loginHref}
              className="text-muted underline decoration-border/80 underline-offset-2 transition hover:text-foreground"
            >
              Start here
            </a>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
