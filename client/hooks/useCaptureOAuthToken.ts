"use client";

import { useEffect } from "react";

/** Stores `?token=` from the URL in localStorage and strips the query (OAuth callback). */
export function useCaptureOAuthToken() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
}
