import { COOKIE_NAMES, TOKEN_MAX_AGE_SECONDS } from "@/lib/config";
import type { AnonymousUser, User } from "@/lib/types";

export type AuthMode = "guest" | "registered" | "anonymous";

export interface AnonymousSession {
  id: string;
  display_name: string;
  token_expires_at?: string | null;
}

export interface CookieJar {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: Record<string, unknown>): void;
  delete(name: string, options?: Record<string, unknown>): void;
}

export interface SessionState {
  mode: AuthMode;
  registeredToken: string | null;
  anonymousToken: string | null;
  user: User | null;
  anonymous: AnonymousSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  isBlocked: boolean;
}

const emptySession = (): SessionState => ({
  mode: "guest",
  registeredToken: null,
  anonymousToken: null,
  user: null,
  anonymous: null,
  isAuthenticated: false,
  isAdmin: false,
  isVerified: false,
  isBlocked: false,
});

export function createGuestSession(): SessionState {
  return emptySession();
}

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.is_admin || user.is_staff || user.role === "admin" || user.role === "staff");
}

export function getDisplayName(user: User | AnonymousUser | null | undefined): string {
  if (!user) return "Guest";
  if ("email" in user) {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    return fullName || user.email;
  }
  return user.display_name;
}

export function serializeAnonymousSession(anonymous: AnonymousSession): string {
  return JSON.stringify(anonymous);
}

export function parseAnonymousSession(value: string | undefined | null): AnonymousSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<AnonymousSession>;
    if (!parsed.id || !parsed.display_name) return null;
    return {
      id: String(parsed.id),
      display_name: String(parsed.display_name),
      token_expires_at: parsed.token_expires_at ? String(parsed.token_expires_at) : null,
    };
  } catch {
    return null;
  }
}

export function readSessionFromCookies(cookies: CookieJar): { registeredToken: string | null; anonymousToken: string | null; anonymous: AnonymousSession | null } {
  return {
    registeredToken: cookies.get(COOKIE_NAMES.registeredToken)?.value ?? null,
    anonymousToken: cookies.get(COOKIE_NAMES.anonymousToken)?.value ?? null,
    anonymous: parseAnonymousSession(cookies.get(COOKIE_NAMES.anonymousMeta)?.value),
  };
}

export function setRegisteredSession(cookies: CookieJar, token: string): void {
  cookies.set(COOKIE_NAMES.registeredToken, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
  cookies.delete(COOKIE_NAMES.anonymousToken, { path: "/" });
  cookies.delete(COOKIE_NAMES.anonymousMeta, { path: "/" });
}

export function setAnonymousSession(cookies: CookieJar, token: string, anonymous: AnonymousSession): void {
  cookies.delete(COOKIE_NAMES.registeredToken, { path: "/" });
  cookies.set(COOKIE_NAMES.anonymousToken, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
  cookies.set(COOKIE_NAMES.anonymousMeta, serializeAnonymousSession(anonymous), {
    httpOnly: false,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearRegisteredSession(cookies: CookieJar): void {
  cookies.delete(COOKIE_NAMES.registeredToken, { path: "/" });
}

export function clearAnonymousSession(cookies: CookieJar): void {
  cookies.delete(COOKIE_NAMES.anonymousToken, { path: "/" });
  cookies.delete(COOKIE_NAMES.anonymousMeta, { path: "/" });
}

export function buildSessionState(input: {
  registeredToken?: string | null;
  anonymousToken?: string | null;
  anonymous?: AnonymousSession | null;
  user?: User | null;
}): SessionState {
  const user = input.user ?? null;
  const registeredToken = input.registeredToken ?? null;
  const anonymousToken = input.anonymousToken ?? null;
  const anonymous = input.anonymous ?? null;
  const mode: AuthMode = user
    ? "registered"
    : anonymousToken
      ? "anonymous"
      : "guest";

  return {
    mode,
    registeredToken,
    anonymousToken,
    user,
    anonymous,
    isAuthenticated: Boolean(user || anonymousToken),
    isAdmin: isAdminUser(user),
    isVerified: Boolean(user?.is_verified),
    isBlocked: Boolean(user?.is_blocked),
  };
}
