import type { Metadata } from "next";
import LandingClient from "@/components/LandingClient";

export const metadata: Metadata = {
  title: "PatchPilot — Ship the fix, not the busywork",
  description:
    "Connect GitHub, select issues, and let autonomous agents ship the fix directly to your codebase.",
};

export default function Home() {
  return <LandingClient />;
}
