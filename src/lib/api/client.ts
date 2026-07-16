import { API_BASE_URL } from "@/lib/config";
import { ApiError } from "./errors";
import type { ApiListQuery } from "@/lib/types";

export type AuthSelection = "auto" | "registered" | "anonymous" | false;

export interface ApiClientOptions {
  baseUrl?: string;
  registeredToken?: string | null;
  anonymousToken?: string | null;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  auth?: AuthSelection;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  explicitToken?: string | null;
}

export class ApiClient {
  readonly baseUrl: string;
  private registeredToken: string | null;
  private anonymousToken: string | null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || API_BASE_URL;
    this.registeredToken = options.registeredToken ?? null;
    this.anonymousToken = options.anonymousToken ?? null;
  }

  setRegisteredToken(token: string | null) {
    this.registeredToken = token;
  }

  setAnonymousToken(token: string | null) {
    this.anonymousToken = token;
  }

  getRegisteredToken() {
    return this.registeredToken;
  }

  getAnonymousToken() {
    return this.anonymousToken;
  }

  private resolveToken(auth: AuthSelection): string | null {
    if (auth === false) return null;
    if (auth === "registered") return this.registeredToken;
    if (auth === "anonymous") return this.anonymousToken;
    return this.registeredToken ?? this.anonymousToken;
  }

  private buildUrl(path: string, query?: ApiRequestOptions["query"]) {
    const url = new URL(path, this.baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url;
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { auth = "auto", query, headers, body, explicitToken, ...init } = options;
    const url = this.buildUrl(path, query);
    const token = explicitToken ?? this.resolveToken(auth);
    const requestHeaders = new Headers(headers);

    if (body !== undefined && !(body instanceof FormData)) {
      requestHeaders.set("Content-Type", "application/json");
    }
    requestHeaders.set("Accept", "application/json");
    if (token) {
      requestHeaders.set("Authorization", `Token ${token}`);
    }

    const response = await fetch(url, {
      ...init,
      headers: requestHeaders,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer
            ? (body as BodyInit)
            : (JSON.stringify(body) as BodyInit),
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    const parsed = text ? safeParseJson(text) : null;

    if (!response.ok) {
      const fallback =
        response.status === 400
          ? "Check the highlighted fields."
          : response.statusText || "Request failed";
      throw new ApiError(response.status, parsed ?? text, fallback);
    }

    return (parsed ?? undefined) as T;
  }

  get<T>(path: string, query?: ApiRequestOptions["query"], auth?: AuthSelection, explicitToken?: string | null) {
    return this.request<T>(path, { method: "GET", query, auth, explicitToken });
  }

  post<T>(path: string, body?: unknown, auth?: AuthSelection, explicitToken?: string | null) {
    return this.request<T>(path, { method: "POST", body, auth, explicitToken });
  }

  patch<T>(path: string, body?: unknown, auth?: AuthSelection, explicitToken?: string | null) {
    return this.request<T>(path, { method: "PATCH", body, auth, explicitToken });
  }

  put<T>(path: string, body?: unknown, auth?: AuthSelection, explicitToken?: string | null) {
    return this.request<T>(path, { method: "PUT", body, auth, explicitToken });
  }

  delete<T>(path: string, auth?: AuthSelection, explicitToken?: string | null) {
    return this.request<T>(path, { method: "DELETE", auth, explicitToken });
  }
}

export function safeParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function createApiClientFromSession(session: {
  registeredToken?: string | null;
  anonymousToken?: string | null;
} = {}) {
  return new ApiClient(session);
}

export function buildQuery(query: ApiListQuery): Record<string, string | number | boolean | null | undefined> {
  return {
    page: query.page,
    page_size: query.page_size,
    search: query.search,
    ordering: query.ordering,
    tags: query.tags,
    created_after: query.created_after,
    created_before: query.created_before,
  };
}
