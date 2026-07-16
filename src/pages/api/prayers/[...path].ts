import type { APIContext } from "astro";
import { ApiClient } from "@/lib/api/client";
import {
  createPrayer, deleteMyPrayerRequest, deletePrayer, deletePrayerEntry,
  getMyPrayerRequest, getPrayer, listMyPrayerRequests, listMyPrayers, listPrayersForRequest,
  prayForPrayer, updateMyPrayerRequest, updatePrayer,
} from "@/lib/api/prayers";
import { readSessionFromCookies } from "@/lib/auth/session";
import { prayerFormSchema } from "@/lib/validation/schemas";
import { errorResponse, getSegments, handleProxyError, handleZodError, json, readJson } from "@/lib/api/proxy";

function clientForRequest(context: APIContext) {
  return new ApiClient(readSessionFromCookies(context.cookies));
}

export async function GET(context: APIContext) {
  const segments = getSegments(new URL(context.request.url).pathname);
  const client = clientForRequest(context);

  try {
    if (segments[0] === "my" && segments[1] === "prayers") {
      return json({ ok: true, data: await listMyPrayers(client) });
    }
    if (segments[0] === "my" && segments[1]) {
      return json({ ok: true, data: await getMyPrayerRequest(client, segments[1]) });
    }
    if (segments[0] === "my") {
      return json({ ok: true, data: await listMyPrayerRequests(client) });
    }
    if (segments[0] && segments[0] !== "prayers" && segments[1] === "prayers") {
      return json({ ok: true, data: await listPrayersForRequest(client, segments[0]) });
    }
    if (segments[0]) {
      return json({ ok: true, data: await getPrayer(client, segments[0]) });
    }
  } catch (error) {
    return handleProxyError(error);
  }

  return errorResponse(404, "Not found");
}

export async function POST(context: APIContext) {
  const segments = getSegments(new URL(context.request.url).pathname);
  const client = clientForRequest(context);
  const body = (await readJson<Record<string, unknown>>(context.request)) ?? {};

  try {
    if (segments[0] === "create") {
      const parsed = prayerFormSchema.safeParse(body);
      if (!parsed.success) return handleZodError(parsed.error);
      return json({ ok: true, prayer: await createPrayer(client, parsed.data) });
    }

    if (segments[1] === "pray") {
      return json({ ok: true, prayer: await prayForPrayer(client, segments[0]) });
    }

    if (segments[1] === "delete") {
      await deletePrayer(client, segments[0]);
      return json({ ok: true, detail: "Prayer request deleted." });
    }

    if (segments[0] === "prayers" && segments[2] === "delete") {
      await deletePrayerEntry(client, segments[1]);
      return json({ ok: true, detail: "Prayer entry deleted." });
    }
  } catch (error) {
    return handleProxyError(error);
  }

  return errorResponse(404, "Not found");
}

export async function PATCH(context: APIContext) {
  const segments = getSegments(new URL(context.request.url).pathname);
  const client = clientForRequest(context);
  const body = (await readJson<Record<string, unknown>>(context.request)) ?? {};

  try {
    if (segments[0] === "my" && segments[2] === "update") {
      const parsed = prayerFormSchema.partial().safeParse(body);
      if (!parsed.success) return handleZodError(parsed.error);
      const payload: Record<string, unknown> = {};
      if (typeof parsed.data.description === "string") payload.description = parsed.data.description;
      if (typeof parsed.data.is_public === "boolean") payload.is_public = parsed.data.is_public;
      if (typeof parsed.data.title === "string") payload.title = parsed.data.title;
      return json({
        ok: true,
        prayer: await updateMyPrayerRequest(client, segments[1], payload),
      });
    }
    if (segments[1] === "update") {
      const parsed = prayerFormSchema.partial().safeParse(body);
      if (!parsed.success) return handleZodError(parsed.error);
      const payload: Record<string, unknown> = {};
      if (typeof parsed.data.description === "string") payload.description = parsed.data.description;
      if (typeof parsed.data.is_public === "boolean") payload.is_public = parsed.data.is_public;
      if (typeof parsed.data.title === "string") payload.title = parsed.data.title;
      return json({
        ok: true,
        prayer: await updatePrayer(client, segments[0], payload),
      });
    }
  } catch (error) {
    return handleProxyError(error);
  }

  return errorResponse(404, "Not found");
}

export async function DELETE(context: APIContext) {
  const segments = getSegments(new URL(context.request.url).pathname);
  const client = clientForRequest(context);

  try {
    if (segments[0] === "my" && segments[2] === "delete") {
      await deleteMyPrayerRequest(client, segments[1]);
      return json({ ok: true, detail: "Prayer request deleted." });
    }
    if (segments[1] === "delete") {
      await deletePrayer(client, segments[0]);
      return json({ ok: true, detail: "Prayer request deleted." });
    }
    if (segments[0] === "prayers" && segments[2] === "delete") {
      await deletePrayerEntry(client, segments[1]);
      return json({ ok: true, detail: "Prayer entry deleted." });
    }
  } catch (error) {
    return handleProxyError(error);
  }

  return errorResponse(404, "Not found");
}
