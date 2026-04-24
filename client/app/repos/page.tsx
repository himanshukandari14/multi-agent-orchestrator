"use client";

import { RepoIssuesWorkspace } from "@/components/RepoIssuesWorkspace";
import { useCaptureOAuthToken } from "@/hooks/useCaptureOAuthToken";

export default function ReposPage() {
  useCaptureOAuthToken();
  return <RepoIssuesWorkspace />;
}
