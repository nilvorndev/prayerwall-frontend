import type { AnonymousUser, PrayerRequest, User } from "@/lib/types";
import { getDisplayName } from "@/lib/auth/session";

export function formatDateTime(value: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "Unknown";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: options.timeStyle ?? undefined,
    ...options,
  }).format(date);
}

export function formatShortDate(value: string | Date | null | undefined) {
  return formatDateTime(value, { dateStyle: "medium" });
}

export function identityLabel(request: PrayerRequest): string {
  if (request.user_detail) return getDisplayName(request.user_detail);
  if (request.anonymous_user_detail) return request.anonymous_user_detail.display_name;
  if (request.user) return "Registered user";
  if (request.anonymous_user) return "Anonymous identity";
  return "Unknown";
}

export function identityKind(request: PrayerRequest): "registered" | "anonymous" | "unknown" {
  if (request.user_detail || request.user) return "registered";
  if (request.anonymous_user_detail || request.anonymous_user) return "anonymous";
  return "unknown";
}

export function authorLabel(user: User | AnonymousUser | null | undefined) {
  return getDisplayName(user);
}

export function prayerPreview(text: string, limit = 180) {
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit).trimEnd()}…`;
}

export function requestVisibilityLabel(request: PrayerRequest) {
  return request.is_public ? "Public" : "Private";
}

export function formatDistanceToNow(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}y ago`;
}


