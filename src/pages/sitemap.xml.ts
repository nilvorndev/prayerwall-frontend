import type { APIContext } from "astro";
import { ApiClient } from "@/lib/api/client";
import { listPrayers } from "@/lib/api/prayers";
import { SITE_URL } from "@/lib/config";
import type { PrayerRequest } from "@/lib/types";

const MAX_SITEMAP_URLS = 50000;

function staticPages(): string[] {
  return [
    "/",
    "/prayers",
    "/prayers/create",
    "/account",
    "/my/prayers",
    "/my/requests",
    "/donate",
    "/terms",
    "/privacy",
  ];
}

export async function GET(context: APIContext) {
  const client = new ApiClient(context.locals.session);
  const urls: string[] = staticPages().map((p) => `${SITE_URL}${p}`);

  try {
    const first = await listPrayers(client, { page: 1, page_size: 1000, ordering: "-created_at" });
    const allPrayers: PrayerRequest[] = [...first.results];
    const totalPages = Math.ceil(first.count / 1000);

    for (let p = 2; p <= totalPages && allPrayers.length < MAX_SITEMAP_URLS; p++) {
      const page = await listPrayers(client, { page: p, page_size: 1000, ordering: "-created_at" });
      allPrayers.push(...page.results);
    }

    for (const prayer of allPrayers) {
      if (prayer.is_public) {
        urls.push(`${SITE_URL}/prayers/${prayer.id}`);
      }
    }
  } catch {
    // If the API errors, serve the sitemap with just static pages
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${loc}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
