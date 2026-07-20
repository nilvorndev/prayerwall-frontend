const rawApiUrl = import.meta.env.PUBLIC_API_BASE_URL || import.meta.env.PUBLIC_API_URL;

if (import.meta.env.PROD && !rawApiUrl) {
  throw new Error("PUBLIC_API_BASE_URL is not set. Define it in wrangler.toml [vars] or Cloudflare dashboard.");
}

export const API_BASE_URL = rawApiUrl || "http://localhost:8000";

export const COOKIE_NAMES = {
  registeredToken: "pw_registered_token",
  anonymousToken: "pw_anonymous_token",
  anonymousMeta: "pw_anonymous_meta",
} as const;

export const SITE_URL = import.meta.env.SITE || "https://prayerwall.space";

export const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
