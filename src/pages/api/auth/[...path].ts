import type { APIContext } from "astro";
import { ApiClient } from "@/lib/api/client";
import {
  createAnonymousIdentity, deleteMe, login, logoutRegistered,
  register, rotateToken, updateMe, verifyConfirm, verifyResend,
} from "@/lib/api/auth";
import {
  clearAnonymousSession, clearRegisteredSession,
  readSessionFromCookies, setAnonymousSession, setRegisteredSession,
} from "@/lib/auth/session";
import { anonymousCreateSchema, loginSchema, registerSchema, verifySchema } from "@/lib/validation/schemas";
import { errorResponse, getSegments, handleProxyError, handleZodError, json, readJson } from "@/lib/api/proxy";

export async function GET(context: APIContext) {
  const segments = getSegments(new URL(context.request.url).pathname);
  if (segments[0] === "logout") {
    clearRegisteredSession(context.cookies);
    clearAnonymousSession(context.cookies);
    return new Response(null, { status: 302, headers: { Location: "/auth/login?logged_out=1" } });
  }
  return errorResponse(404, "Not found");
}

export async function POST(context: APIContext) {
  const segments = getSegments(new URL(context.request.url).pathname);
  const session = readSessionFromCookies(context.cookies);
  const registeredClient = new ApiClient(session);
  const publicClient = new ApiClient();
  const body = (await readJson<Record<string, unknown>>(context.request)) ?? {};

  try {
    if (segments[0] === "login") {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) return handleZodError(parsed.error);
      const result = await login(publicClient, parsed.data);
      setRegisteredSession(context.cookies, result.token);
      return json({ ok: true, mode: "registered", user: result.user });
    }

    if (segments[0] === "register") {
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) return handleZodError(parsed.error);
      await register(publicClient, parsed.data);
      clearAnonymousSession(context.cookies);
      return json({
        ok: true,
        next: `/auth/verify?email=${encodeURIComponent(parsed.data.email)}`,
        detail: "Account created. Verify your email before logging in.",
      });
    }

    if (segments[0] === "verify") {
      if (segments[1] === "confirm") {
        const parsed = verifySchema.safeParse(body);
        if (!parsed.success) {
          const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
          return errorResponse(400, "Verification token or code is required.", fieldErrors);
        }
        const result = await verifyConfirm(publicClient, parsed.data);
        return json({ ok: true, detail: result.detail ?? "Email verified." });
      }
      if (segments[1] === "resend") {
        const email = typeof body.email === "string" ? body.email.trim() : "";
        if (!email) return errorResponse(400, "Email is required.", { email: ["Email is required."] });
        const result = await verifyResend(publicClient, { email });
        return json({ ok: true, detail: result.detail ?? "Verification email sent." });
      }
    }

    if (segments[0] === "anonymous") {
      if (segments[1] === "create") {
        const parsed = anonymousCreateSchema.safeParse(body);
        if (!parsed.success) return handleZodError(parsed.error);
        const result = await createAnonymousIdentity(publicClient, {
          display_name: parsed.data.display_name || undefined,
        });
        setAnonymousSession(context.cookies, result.token, {
          id: result.id, display_name: result.display_name, token_expires_at: result.token_expires_at,
        });
        return json({ ok: true, anonymous: result });
      }
      if (segments[1] === "token") {
        const identityId = typeof body.identity_id === "string" ? body.identity_id.trim() : "";
        const displayName = typeof body.display_name === "string" ? body.display_name.trim() : "";
        const payload: Record<string, string> = {};
        if (identityId) payload.identity_id = identityId;
        if (displayName) payload.display_name = displayName;
        const result = await publicClient.post<{ id: string; display_name: string; token: string; token_expires_at: string }>(
          "/users/anonymous/token/", payload, false,
        );
        setAnonymousSession(context.cookies, result.token, {
          id: result.id, display_name: result.display_name, token_expires_at: result.token_expires_at,
        });
        return json({ ok: true, anonymous: result });
      }
    }

    if (segments[0] === "rotate") {
      const result = await rotateToken(registeredClient);
      setRegisteredSession(context.cookies, result.token);
      return json({ ok: true, token: result.token, user: result.user });
    }

    if (segments[0] === "logout") {
      const mode = typeof body.mode === "string" ? body.mode : session.registeredToken ? "registered" : "anonymous";
      if (mode === "registered" || mode === "both") {
        try { await logoutRegistered(registeredClient); } catch { /* fall through */ }
        clearRegisteredSession(context.cookies);
      }
      if (mode === "anonymous" || mode === "both") clearAnonymousSession(context.cookies);
      return json({ ok: true, detail: "Logged out." });
    }

    if (segments[0] === "me") {
      if (segments[1] === "update") {
        const payload: Record<string, string> = {};
        if (typeof body.first_name === "string") payload.first_name = body.first_name.trim();
        if (typeof body.last_name === "string") payload.last_name = body.last_name.trim();
        const result = await updateMe(registeredClient, payload);
        return json({ ok: true, user: result });
      }
      if (segments[1] === "delete") {
        await deleteMe(registeredClient);
        clearRegisteredSession(context.cookies);
        return json({ ok: true, detail: "Account deleted." });
      }
    }
  } catch (error) {
    return handleProxyError(error);
  }

  return errorResponse(404, "Not found");
}

export async function PATCH(context: APIContext) {
  return POST(context);
}

export async function DELETE(context: APIContext) {
  const segments = getSegments(new URL(context.request.url).pathname);
  if (segments[0] === "logout") {
    clearRegisteredSession(context.cookies);
    clearAnonymousSession(context.cookies);
    return json({ ok: true, detail: "Logged out." });
  }
  return errorResponse(404, "Not found");
}
