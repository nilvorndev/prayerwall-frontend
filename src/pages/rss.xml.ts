import type { APIContext } from "astro";
import { ApiClient } from "@/lib/api/client";
import { listPrayers } from "@/lib/api/prayers";

export async function GET(context: APIContext) {
  const client = new ApiClient(context.locals.session);

  try {
    const result = await listPrayers(client, {
      page: 1,
      page_size: 50,
      ordering: "-created_at",
    });

    const prayers = result.results;
    const origin = context.url.origin;

    const items = prayers
      .map((prayer) => {
        const title = prayer.title || prayer.description.substring(0, 100);
        const link = `${origin}/prayers/${prayer.id}`;
        const author = prayer.user_detail
          ? `${prayer.user_detail.first_name} ${prayer.user_detail.last_name}`.trim() || "A user"
          : prayer.anonymous_user_detail?.display_name || "Anonymous";
        const date = new Date(prayer.created_at).toUTCString();

        return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${prayer.description}]]></description>
      <author><![CDATA[${author}]]></author>
      <pubDate>${date}</pubDate>
    </item>`;
      })
      .join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Prayer Wall - Prayer Requests</title>
    <link>${origin}/prayers</link>
    <description>Public approved prayer requests from the Prayer Wall community</description>
    <language>en</language>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
      },
    });
  } catch {
    return new Response("Failed to generate RSS feed", { status: 500 });
  }
}
