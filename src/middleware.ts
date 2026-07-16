import { defineMiddleware } from "astro:middleware";
import { ApiClient } from "./lib/api/client";
import { getMe } from "./lib/api/auth";
import { buildSessionState, createGuestSession, readSessionFromCookies } from "./lib/auth/session";
import { clearAnonymousSession, clearRegisteredSession } from "./lib/auth/session";

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionCookies = readSessionFromCookies(context.cookies);
  const client = new ApiClient(sessionCookies);

  let session = createGuestSession();

  if (sessionCookies.registeredToken) {
    try {
      const user = await getMe(client);
      session = buildSessionState({
        registeredToken: sessionCookies.registeredToken,
        anonymousToken: null,
        anonymous: null,
        user,
      });
    } catch {
      clearRegisteredSession(context.cookies);
      session = buildSessionState({
        registeredToken: null,
        anonymousToken: sessionCookies.anonymousToken,
        anonymous: sessionCookies.anonymous,
        user: null,
      });
    }
  } else if (sessionCookies.anonymousToken) {
    session = buildSessionState({
      registeredToken: null,
      anonymousToken: sessionCookies.anonymousToken,
      anonymous: sessionCookies.anonymous,
      user: null,
    });
  }

  if (!session.registeredToken && !session.anonymousToken) {
    clearAnonymousSession(context.cookies);
  }

  context.locals.session = session;

  const response = await next();
  const path = context.url.pathname;

  if (path.startsWith("/admin/") || path.startsWith("/auth/") || path.startsWith("/api/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");

  if (import.meta.env.PROD) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  return response;
});
