import Link from "next/link";

const nav = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/repos", label: "Repos" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <Link
            href="/"
            className="group flex items-baseline gap-0.5 font-heading text-[15px] font-semibold tracking-tight"
          >
            <span
              className="text-accent transition group-hover:text-accent-hover"
              aria-hidden
            >
              /
            </span>
            <span className="text-foreground">fixer</span>
          </Link>
          <nav
            className="flex items-center gap-1 sm:gap-2"
            aria-label="Main"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2.5 py-1.5 text-[13px] text-muted transition hover:bg-surface-elevated hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-6 sm:py-16">
        {children}
      </main>
      <footer className="mt-auto border-t border-border py-8 text-center text-[12px] text-muted">
        AI GitHub Fixer
      </footer>
    </div>
  );
}
