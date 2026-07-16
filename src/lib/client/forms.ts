import { normalizeApiError } from "@/lib/api/errors";
import { safeParseJson } from "@/lib/api/client";

export interface FormResponse<T = unknown> {
  ok: boolean;
  detail?: string;
  fields?: Record<string, string[]>;
  next?: string;
  data?: T;
  user?: unknown;
  prayer?: unknown;
  anonymous?: unknown;
  token?: string;
}

export async function submitJson<T>(url: string, payload: unknown, init: RequestInit = {}): Promise<FormResponse<T>> {
  const response = await fetch(url, {
    method: init.method || "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {}),
    },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });

  const text = await response.text();
  const data = text ? safeParseJson(text) : null;

  if (!response.ok) {
    const fallback =
      response.status === 400
        ? "Check the highlighted fields."
        : response.statusText || "Request failed";
    const normalized = normalizeApiError(data ?? text, fallback);
    throw Object.assign(new Error(normalized.detail), {
      status: response.status,
      detail: normalized.detail,
      fields: normalized.fields,
      code: normalized.code,
      raw: data,
    });
  }

  return (data || { ok: true }) as FormResponse<T>;
}

export function extractFieldError(error: unknown, field: string): string | null {
  if (!error || typeof error !== "object") return null;
  const fields = (error as { fields?: Record<string, string[]> }).fields;
  const value = fields?.[field]?.[0];
  return value || null;
}
