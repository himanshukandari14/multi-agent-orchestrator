"use client";

import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

/**
 * Wraps the app so `Skeleton` / `SkeletonTheme` children share one dark theme.
 * Import skeleton.css once here.
 */
export function AppSkeletonTheme({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SkeletonTheme
      baseColor="rgba(255,255,255,0.06)"
      highlightColor="rgba(255,255,255,0.12)"
    >
      {children}
    </SkeletonTheme>
  );
}
