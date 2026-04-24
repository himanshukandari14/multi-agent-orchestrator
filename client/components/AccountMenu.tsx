"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 21a8 8 0 0 0-16 0M12 4a3.5 3.5 0 1 0 0 7.001A3.5 3.5 0 0 0 12 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCard({ className }: { className?: string }) {
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
      <path d="M2.5 10.25h19" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconLogOut({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 7H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4M16 12H9m5 0 3-3m-3 3 3-3M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevron({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      className={[
        "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
        open && "rotate-180",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = { variant: "sidebar" | "mobile" };

/**
 * shadcn-style account trigger + popup menu (no Radix; matches theme tokens).
 */
export function AccountMenu({ variant }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const profileActive = pathname === "/profile" || pathname.startsWith("/profile/");
  const billingActive = pathname === "/billing" || pathname.startsWith("/billing/");

  useEffect(() => {
    function handlePointer(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const logout = () => {
    try {
      localStorage.removeItem("token");
    } catch {
      // ignore
    }
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  const menuPlacement =
    variant === "sidebar"
      ? "absolute bottom-full left-0 right-0 z-50 mb-1"
      : "absolute left-0 right-0 top-full z-50 mt-1";

  const widthClass = variant === "sidebar" ? "w-full" : "w-full min-w-44";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={[
          "flex w-full items-center justify-between gap-2 rounded-md border border-border/80 bg-surface-elevated/50 px-3 py-2.5 text-left text-[13px] font-medium text-foreground transition hover:bg-surface-elevated/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variant === "mobile" && "min-h-10",
        ].join(" ")}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/40 text-accent">
            <IconUser className="h-4 w-4" />
          </span>
          <span className="truncate">Account</span>
        </span>
        <IconChevron open={open} />
      </button>

      {open && (
        <div
          id={listId}
          role="menu"
          aria-orientation="vertical"
          className={[
            widthClass,
            menuPlacement,
            "overflow-hidden rounded-md border border-border bg-surface-elevated py-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)_inset]",
          ].join(" ")}
        >
          <Link
            role="menuitem"
            href="/profile"
            onClick={() => setOpen(false)}
            className={[
              "flex items-center gap-2 px-2.5 py-2 text-[13px] font-medium transition-colors",
              "focus:bg-surface-elevated/80 focus:outline-none",
              profileActive
                ? "bg-surface-elevated text-accent"
                : "text-foreground hover:bg-surface-elevated/50",
            ].join(" ")}
          >
            <IconUser className="h-4 w-4 text-muted" />
            Profile
          </Link>
          <Link
            role="menuitem"
            href="/billing"
            onClick={() => setOpen(false)}
            className={[
              "flex items-center gap-2 px-2.5 py-2 text-[13px] font-medium transition-colors",
              "focus:bg-surface-elevated/80 focus:outline-none",
              billingActive
                ? "bg-surface-elevated text-accent"
                : "text-foreground hover:bg-surface-elevated/50",
            ].join(" ")}
          >
            <IconCard className="h-4 w-4 text-muted" />
            Billing
          </Link>
          <div className="mx-1 my-0.5 h-px bg-border" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[13px] font-medium text-muted transition-colors hover:bg-surface-elevated/50 hover:text-danger focus:bg-surface-elevated/80 focus:outline-none"
          >
            <IconLogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
