"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "@/components/AccountMenu";
import { useJobQueue } from "@/context/JobQueueContext";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: IconGrid },
  { href: "/repos", label: "Repos", icon: IconRepos },
  { href: "/queue", label: "Activity", icon: IconActivity },
  { href: "/analytics", label: "Analytics", icon: IconAnalytics },
  { href: "/billing", label: "Billing", icon: IconBilling },
  { href: "/knowledge", label: "Knowledge", icon: IconKnowledge },
] as const;

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconRepos({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v3H4V5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 8h9v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M13 8h5a2 2 0 0 1 2 2v2.5a1.5 1.5 0 0 0 1.5 1.5H22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconActivity({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h4v4H4V6Zm6 0h4v4h-4V6ZM4 12h4v4H4v-4Zm6 0h4v2.5M16 4v2m0 4v2m0 4v2m-2 2h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAnalytics({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 19V5M4 19h16M8 16V9m4 4V7m4 4v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBilling({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="2.5"
        y="5"
        width="19"
        height="14.5"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2.5 10.25h19"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.5 16.5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconKnowledge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 3h5a2 2 0 0 1 2 2v16a.5.5 0 0 1-.5.5A2.5 2.5 0 0 0 8 20H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M19 3h-5a2 2 0 0 0-2 2v16a.5.5 0 0 0 .5.5 2.5 2.5 0 0 1 3.5-1.5h3a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type MainItem = (typeof mainNav)[number];

function MainNavItem({
  item,
  pathname,
  badge,
}: {
  item: MainItem;
  pathname: string;
  badge?: number;
}) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        className={[
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
          "focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          active
            ? "bg-surface-elevated text-foreground ring-1 ring-inset ring-accent/25"
            : "text-muted hover:bg-surface-elevated/50 hover:text-foreground",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-5 w-5 shrink-0 items-center justify-center",
            active ? "text-accent" : "text-muted group-hover:text-foreground",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.href === "/queue" && badge !== undefined && badge > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent/20 px-1.5 text-[11px] font-semibold text-accent">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </Link>
    </li>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeCount } = useJobQueue();

  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col bg-background lg:flex-row">
      {/* Mobile: app sections + account row (landing uses AppRoot, not this shell) */}
      <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
        <nav
          className="scrollbar-none overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          <ul className="mx-auto flex w-max min-w-full max-w-2xl items-stretch justify-center gap-0.5 px-1 sm:px-2">
            {mainNav.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href} className="w-16 shrink-0 sm:w-18">
                  <Link
                    href={item.href}
                    className={[
                      "flex h-11 flex-col items-center justify-center gap-0.5 rounded-md px-0.5 text-[9px] font-medium leading-tight transition-colors sm:text-[10px]",
                      active
                        ? "text-accent"
                        : "text-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    <span className="flex h-6 w-6 items-center justify-center text-current">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="relative line-clamp-1 w-full text-center">
                      {item.label}
                      {item.href === "/queue" && activeCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[8px] font-bold leading-none text-white">
                          {activeCount > 9 ? "9" : activeCount}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-border/80 px-2 py-2">
          <AccountMenu variant="mobile" />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className="relative hidden w-[230px] shrink-0 flex-col border-r border-border bg-[radial-gradient(120%_80%_at_0%_0%,rgba(225,29,72,0.12),transparent_55%)] lg:flex"
        aria-label="App navigation"
      >
        <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
          <Link
            href="/"
            className="group flex min-w-0 items-baseline gap-0.5 font-heading text-[16px] font-semibold tracking-tight"
            title="Back to landing"
          >
            <span className="shrink-0 text-accent" aria-hidden>
              /
            </span>
            <span className="text-foreground">fixer</span>
          </Link>
        </div>
        <p className="px-4 pb-2 pt-2.5 text-[11px] font-medium uppercase tracking-widest text-muted">
          Navigate
        </p>
        <ul className="flex flex-col gap-0.5 px-2.5">
          {mainNav.map((item) => (
            <MainNavItem
              key={item.href}
              item={item}
              pathname={pathname}
              badge={item.href === "/queue" ? activeCount : undefined}
            />
          ))}
        </ul>
        <div className="flex-1" />
        <div className="p-2 text-[10px] leading-relaxed text-muted/90">
          Fix jobs run in the background. Activity shows live state and
          duration.
        </div>
        <div className="border-t border-border/80">
          <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-widest text-muted">
            Account
          </p>
          <div className="px-2.5 pb-2">
            <AccountMenu variant="sidebar" />
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className="hidden h-14 shrink-0 items-center border-b border-border bg-background/50 px-4 text-[11px] text-muted backdrop-blur-sm sm:flex lg:px-8"
          aria-label="App context"
        >
          <p className="w-full max-w-4xl truncate">
            Multi-agent issue fixes from GitHub
          </p>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden px-3 py-5 sm:px-5 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[min(100%,90rem)]">{children}</div>
        </main>
        <footer className="shrink-0 border-t border-border py-4 text-center text-[11px] text-muted/90">
          AI GitHub Fixer
        </footer>
      </div>
    </div>
  );
}
