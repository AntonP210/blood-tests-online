import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PATTERNS = [/^\/[^/]+\/analyze(\/.*)?$/];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PATTERNS.some((pattern) => pattern.test(pathname));
}

function getLocaleFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  if ((routing.locales as readonly string[]).includes(firstSegment)) {
    return firstSegment;
  }
  return routing.defaultLocale;
}

export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase auth tokens
  const { user, supabaseResponse } = await updateSession(request);

  // 2. Check protected routes
  const pathname = request.nextUrl.pathname;
  if (isProtectedRoute(pathname) && !user) {
    const locale = getLocaleFromPath(pathname);
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);

    const redirectResponse = NextResponse.redirect(loginUrl);
    // Preserve Supabase cookies on the redirect
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // 3. Run next-intl middleware
  const intlResponse = intlMiddleware(request);

  // 4. Merge Supabase cookies into next-intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
