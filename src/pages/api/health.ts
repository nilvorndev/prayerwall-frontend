import type { APIContext } from "astro";

export async function GET(_context: APIContext) {
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
