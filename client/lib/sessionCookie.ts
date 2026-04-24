import { APP_TOKEN_COOKIE, COOKIE_MAX_AGE_SEC } from "@/lib/authSession";

/**
 * Set / clear the session cookie so Next middleware can gate routes. Values must
 * match the HS256 app JWT from the API (see backend OAuth callback).
 */
function secureCookieSuffix(): string {
  if (typeof window === "undefined") return "";
  return window.location.protocol === "https:" ? "; secure" : "";
}

export function setSessionCookie(token: string): void {
  if (typeof document === "undefined") return;
  const v = encodeURIComponent(token);
  document.cookie = `${APP_TOKEN_COOKIE}=${v}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; samesite=lax${secureCookieSuffix()}`;
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${APP_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax${secureCookieSuffix()}`;
}

/** Read the current app session cookie (non–http-only) for syncing into localStorage. */
export function getSessionCookieToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${APP_TOKEN_COOKIE}=([^;]*)`),
  );
  if (!m?.[1]) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}
