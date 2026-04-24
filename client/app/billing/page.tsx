"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useId, useState } from "react";
import { API_BASE } from "@/lib/api";
import {
  fetchBillingMe,
  fetchBillingPlans,
  formatMoney,
  startCheckout,
  type ApiPlan,
  type BillingMeResponse,
} from "@/lib/billing";
import { useCaptureOAuthToken } from "@/hooks/useCaptureOAuthToken";
import { DashboardPageSkeleton } from "@/components/skeletons/presets";

function IconCoins({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10a2.5 2.5 0 0 0 0 4M7 6h.05M17 6h.05M7 6a5 5 0 0 0 0 8M7 6H5.5A2.5 2.5 0 0 0 3 8.5V18a1 1 0 0 0 1 1h3m0-10v10m0-4a2.5 2.5 0 0 0 0-4M17 6a5 5 0 0 1 0 8m0-8h1.5A2.5 2.5 0 0 1 21 8.5V18a1 1 0 0 1-1 1h-3m0-10v10m0-4a2.5 2.5 0 0 1 0-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatPeriod(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function BillingContentInner() {
  useCaptureOAuthToken();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listId = useId();

  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [me, setMe] = useState<BillingMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [banner, setBanner] = useState<"success" | "cancel" | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const nextPlans = await fetchBillingPlans();
      setPlans(nextPlans);
      if (typeof window === "undefined") return;
      const t = localStorage.getItem("token");
      setHasToken(!!t);
      if (t) {
        setMe(await fetchBillingMe(t));
      } else {
        setMe(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load billing data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const q = searchParams.get("checkout");
    if (q === "success" || q === "cancel") {
      setBanner(q);
      void load();
      router.replace("/billing", { scroll: false });
    }
  }, [searchParams, router, load]);

  const currentSlug = me?.subscription?.plan?.slug ?? null;
  const credits = hasToken && me ? me.user.credit_balance : null;

  async function onSubscribe(slug: "pro" | "pro_plus") {
    const t =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!t) {
      return;
    }
    setError(null);
    setBusyPlan(slug);
    try {
      const { checkout_url } = await startCheckout(t, slug);
      window.location.href = checkout_url;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Checkout could not be started. Check API keys and plan setup."
      );
    } finally {
      setBusyPlan(null);
    }
  }

  if (loading && plans.length === 0) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Account
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Billing
          </h1>
          <p className="text-sm text-muted">
            Credits power fix jobs. Subscriptions add monthly credits via Dodo
            checkout.
          </p>
        </div>
        {!hasToken && (
          <a
            href={`${API_BASE}/auth/github/login`}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Sign in with GitHub
          </a>
        )}
      </header>

      {banner === "success" && (
        <p
          className="animate-toast-in rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-200/90"
          role="status"
        >
          Payment complete — your subscription and credits will update in a
          moment.
        </p>
      )}
      {banner === "cancel" && (
        <p
          className="animate-toast-in rounded-lg border border-border/80 bg-surface-elevated/50 px-3 py-2.5 text-sm text-muted"
          role="status"
        >
          Checkout was cancelled. You can try again when you’re ready.
        </p>
      )}

      {error && (
        <p
          className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      {hasToken && me && (
        <section
          aria-labelledby={listId + "-credits"}
          className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div
            className="stat-card-entrance rounded-xl border border-border/80 bg-surface-elevated/50 p-4 sm:p-5"
            style={{ animationDelay: "0ms" }}
          >
            <p
              id={listId + "-credits"}
              className="text-[11px] font-medium uppercase tracking-widest text-muted"
            >
              Credit balance
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                {credits != null ? credits.toLocaleString() : "—"}
              </span>
              <span className="text-sm text-muted">credits</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Spent when you queue fix runs. Subscriptions top up on renewal.
            </p>
          </div>
          <div
            className="stat-card-entrance rounded-xl border border-border/80 bg-surface-elevated/50 p-4 sm:p-5"
            style={{ animationDelay: "50ms" }}
          >
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
              Current plan
            </p>
            <p className="mt-2 font-heading text-lg font-semibold text-foreground">
              {me.subscription?.plan?.name ?? "—"}
            </p>
            <p className="mt-1 font-mono text-sm tabular-nums text-muted">
              Status: {me.subscription?.status ?? "—"}
            </p>
            {me.subscription?.cancel_at_period_end && (
              <p className="mt-2 text-xs text-amber-200/80">
                Ends at period end (
                {formatPeriod(me.subscription.current_period_end)}).
              </p>
            )}
          </div>
          <div
            className="stat-card-entrance rounded-xl border border-border/80 bg-surface-elevated/50 p-4 sm:p-5"
            style={{ animationDelay: "100ms" }}
          >
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
              Billing period
            </p>
            <p className="mt-2 text-sm text-foreground">
              {formatPeriod(me.subscription?.current_period_start ?? null)} →{" "}
              {formatPeriod(me.subscription?.current_period_end ?? null)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Logged in as <span className="text-foreground">{me.user.github_login}</span>
            </p>
          </div>
        </section>
      )}

      {hasToken && !me && !loading && (
        <p className="text-sm text-muted">Could not load your profile. Try again.</p>
      )}

      <section className="space-y-4" aria-labelledby="plans-heading">
        <div className="flex items-end justify-between gap-2">
          <h2
            id="plans-heading"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            Plans
          </h2>
          {hasToken && (
            <button
              type="button"
              onClick={() => void load()}
              className="text-[13px] text-muted transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Refresh
            </button>
          )}
        </div>
        <ul className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan, i) => {
            const isCurrent = currentSlug === plan.slug;
            const isPro = plan.slug === "pro";
            const isFree = plan.price_cents === 0;
            const paid = plan.slug === "pro" || plan.slug === "pro_plus";
            return (
              <li
                key={plan.slug}
                className={[
                  "stat-card-entrance relative flex min-h-0 flex-col justify-between overflow-hidden rounded-xl border bg-surface-elevated/50 p-5 transition-all duration-200",
                  isPro
                    ? "border-accent/35 ring-1 ring-accent/20 md:scale-[1.01] md:shadow-lg md:shadow-black/20"
                    : "border-border/80 hover:border-accent/20 hover:bg-surface-elevated/70",
                ].join(" ")}
                style={{ animationDelay: `${120 + i * 40}ms` }}
              >
                {isPro && (
                  <span className="absolute right-4 top-4 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                    Popular
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-surface/80 text-accent">
                      <IconCoins className="h-4 w-4" />
                    </span>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {plan.name}
                    </h3>
                  </div>
                  {plan.description && (
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {plan.description}
                    </p>
                  )}
                  <p className="mt-4 font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                    {isFree
                      ? "Free"
                      : formatMoney(plan.price_cents, plan.currency)}
                    <span className="ml-1.5 text-sm font-normal text-muted">
                      {isFree ? "" : "/ mo"}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {plan.monthly_credits.toLocaleString()} credits / period
                  </p>
                </div>
                <div className="mt-6">
                  {isCurrent && (
                    <span className="inline-flex w-full min-h-10 items-center justify-center rounded-md border border-border/80 bg-surface/60 text-sm font-medium text-muted">
                      Current plan
                    </span>
                  )}
                  {!isCurrent && isFree && hasToken && (
                    <span className="inline-flex w-full min-h-10 items-center justify-center rounded-md border border-dashed border-border/80 text-sm text-muted">
                      Default for new accounts
                    </span>
                  )}
                  {!isCurrent && isFree && !hasToken && (
                    <a
                      href={`${API_BASE}/auth/github/login`}
                      className="inline-flex w-full min-h-10 items-center justify-center rounded-md border border-border/80 text-sm font-medium text-foreground transition hover:border-accent/30 hover:bg-surface-elevated"
                    >
                      Sign in to use
                    </a>
                  )}
                  {!isCurrent && paid && (
                    <button
                      type="button"
                      disabled={!hasToken || busyPlan === plan.slug}
                      onClick={() => {
                        if (plan.slug === "pro" || plan.slug === "pro_plus") {
                          void onSubscribe(plan.slug);
                        }
                      }}
                      className="inline-flex w-full min-h-10 items-center justify-center rounded-md bg-accent text-sm font-medium text-white transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyPlan === plan.slug
                        ? "Redirecting…"
                        : "Subscribe with Dodo"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {!hasToken && (
          <p className="text-sm text-muted">
            <Link
              className="text-foreground underline decoration-border underline-offset-4 transition hover:text-accent"
              href="/"
            >
              Home
            </Link>{" "}
            or sign in above to manage credits and paid plans.
          </p>
        )}
      </section>
    </div>
  );
}

function BillingWithSuspense() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <BillingContentInner />
    </Suspense>
  );
}

export default function BillingPage() {
  return <BillingWithSuspense />;
}
