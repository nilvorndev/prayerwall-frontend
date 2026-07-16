export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

export function errorResponse(status: number, detail: string, fields: Record<string, string[]> = {}) {
  return json({ ok: false, detail, fields }, { status });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function getSegments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean).slice(2);
}

export function handleProxyError(error: unknown): Response {
  if (error && typeof error === "object" && "status" in error) {
    const apiError = error as {
      status: number;
      fieldErrors?: Record<string, string>;
      detail?: string;
    };
    if (apiError.status === 400) {
      const fields = apiError.fieldErrors
        ? Object.fromEntries(
            Object.entries(apiError.fieldErrors).map(([key, value]) => [key, [value]]),
          )
        : {};
      return errorResponse(400, apiError.detail || "Check the fields and try again.", fields);
    }
    const messages: Record<number, string> = {
      401: "Your session expired. Please log in again.",
      403: "You do not have permission to perform that action.",
      404: "That resource could not be found.",
    };
    return errorResponse(apiError.status, messages[apiError.status] || apiError.detail || "Request failed");
  }
  return errorResponse(500, "Unable to complete that request right now.");
}

export function handleZodError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  return errorResponse(400, "Check the highlighted fields.", error.flatten().fieldErrors);
}
