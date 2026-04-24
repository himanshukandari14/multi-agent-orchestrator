"use client";

import { useEffect } from "react";
import { setSessionCookie } from "@/lib/sessionCookie";

/** Stores `?token=` in localStorage + session cookie, then strips the query. */
export function useCaptureOAuthToken() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      setSessionCookie(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
}
