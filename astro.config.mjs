import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

const srcAlias = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  site: "https://prayerwall.space",
  output: "server",
  adapter: cloudflare(),
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": srcAlias,
      },
    },
  },
});