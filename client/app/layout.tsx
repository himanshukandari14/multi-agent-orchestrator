import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit, Caveat } from "next/font/google";
import { AppRoot } from "@/components/AppRoot";
import { AppSkeletonTheme } from "@/components/skeletons/AppSkeletonTheme";
import { JobQueueProvider } from "@/context/JobQueueContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-handwriting",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PatchPilot",
  description: "Automated issue fixes from your GitHub repos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex max-w-full flex-col bg-background text-foreground">
        <JobQueueProvider>
          <AppSkeletonTheme>
            <AppRoot>{children}</AppRoot>
          </AppSkeletonTheme>
        </JobQueueProvider>
      </body>
    </html>
  );
}
