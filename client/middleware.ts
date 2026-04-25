import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { APP_TOKEN_COOKIE, COOKIE_MAX_AGE_SEC } from "@/lib/authSession";

function isNextInternal(pathname: string) {
  return pathname.startsWith("/_next");
}

function isPublicStaticFile(pathname: string) {
  if (/^\/(robots\.txt|sitemap\.xml|manifest\.webmanifest)$/.test(pathname)) {
    return true;
  }
  return /\.(ico|png|jpg|jpeg|svg|webp|txt|json|webmanifest|xml|woff2?)$/i.test(
    pathname,
  );
}

function cookieOpts(request: NextRequest) {
  const https = request.nextUrl.protocol === "https:";
  return {
    name: APP_TOKEN_COOKIE,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
    sameSite: "lax" as const,
    httpOnly: false,
    secure: https,
  };
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (
    isNextInternal(pathname) ||
    isPublicStaticFile(pathname) ||
    pathname.includes("/auth/github/callback")
  ) {
    return NextResponse.next();
  }

  const secret = process.env.JWT_SECRET;
  const key = secret ? new TextEncoder().encode(secret) : null;

  async function validJwt(token: string | undefined): Promise<boolean> {
    if (!token || !key) return false;
    try {
      await jwtVerify(token, key);
      return true;
    } catch {
      return false;
    }
  }

  const fromCookie = request.cookies.get(APP_TOKEN_COOKIE)?.value;
  const fromQuery = searchParams.get("token") ?? undefined;
  const authedFromCookie = await validJwt(fromCookie);
  const authedFromQuery = await validJwt(fromQuery);
  const authed = authedFromCookie || authedFromQuery;

  function withSyncedCookie() {
    const res = NextResponse.next();
    if (authedFromQuery && fromQuery && !authedFromCookie) {
      res.cookies.set({ ...cookieOpts(request), value: fromQuery });
    }
    return res;
  }

  if (pathname === "/") {
    if (authed) {
      const toDash = NextResponse.redirect(new URL("/dashboard", request.url));
      if (authedFromQuery && fromQuery && !authedFromCookie) {
        toDash.cookies.set({ ...cookieOpts(request), value: fromQuery });
      }
      return toDash;
    }
    return withSyncedCookie();
  }

  if (authed) {
    return withSyncedCookie();
  }
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|webp|json|txt|xml|webmanifest|woff2?)$).*)",
  ],
};
