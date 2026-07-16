export interface ApiErrorFieldMap {
  [field: string]: string | string[] | undefined;
}

const NON_FIELD_ERROR_KEYS = new Set(["non_field_errors", "nonFieldErrors"]);
const RESERVED_KEYS = new Set(["detail", "message", "code", "fields", "fieldErrors", "errors"]);

export class ApiError extends Error {
  status: number;
  code: string | null;
  detail: string;
  fields: Record<string, string[]>;
  raw: unknown;

  constructor(status: number, raw: unknown, fallback = "Request failed") {
    const normalized = normalizeApiError(raw, fallback);
    super(normalized.detail);
    this.name = "ApiError";
    this.status = status;
    this.code = normalized.code;
    this.detail = normalized.detail;
    this.fields = normalized.fields;
    this.raw = raw;
  }

  get fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.fields)) {
      result[key] = value[0] ?? "Invalid value";
    }
    return result;
  }
}

export function normalizeApiError(raw: unknown, fallback = "Request failed"): {
  code: string | null;
  detail: string;
  fields: Record<string, string[]>;
} {
  if (!raw || typeof raw !== "object") {
    return {
      code: null,
      detail: typeof raw === "string" && raw.trim() ? raw.trim() : fallback,
      fields: {},
    };
  }

  const record = raw as Record<string, unknown>;
  const fields: Record<string, string[]> = {};

  mergeFieldMap(fields, record.fields);
  mergeFieldMap(fields, record.fieldErrors);
  mergeFieldMap(fields, record.errors);

  for (const [key, value] of Object.entries(record)) {
    if (RESERVED_KEYS.has(key)) continue;
    if (NON_FIELD_ERROR_KEYS.has(key)) continue;
    if (typeof value === "string") {
      fields[key] = [value];
    } else if (Array.isArray(value)) {
      fields[key] = value.map((item) => String(item));
    } else if (value && typeof value === "object") {
      fields[key] = [JSON.stringify(value)];
    }
  }

  const detailFromPayload =
    extractDetail(record.detail) ||
    extractDetail(record.message) ||
    extractDetail(record.non_field_errors) ||
    extractDetail(record.nonFieldErrors) ||
    extractDetail((record.fields as Record<string, unknown> | undefined)?.non_field_errors) ||
    extractDetail((record.fields as Record<string, unknown> | undefined)?.nonFieldErrors) ||
    extractDetail((record.fieldErrors as Record<string, unknown> | undefined)?.non_field_errors) ||
    extractDetail((record.fieldErrors as Record<string, unknown> | undefined)?.nonFieldErrors) ||
    extractDetail((record.errors as Record<string, unknown> | undefined)?.non_field_errors) ||
    extractDetail((record.errors as Record<string, unknown> | undefined)?.nonFieldErrors);

  const detail = detailFromPayload || fallback;

  return {
    code: typeof record.code === "string" ? record.code : null,
    detail,
    fields,
  };
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function mergeFieldMap(target: Record<string, string[]>, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (NON_FIELD_ERROR_KEYS.has(key)) continue;
    const normalized = normalizeFieldValues(entry);
    if (normalized.length > 0) {
      target[key] = normalized;
    }
  }
}

function normalizeFieldValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (value && typeof value === "object") return [JSON.stringify(value)];
  return [];
}

function extractDetail(value: unknown): string | null {
  const values = normalizeFieldValues(value);
  return values[0] ?? null;
}
