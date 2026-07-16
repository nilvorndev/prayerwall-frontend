import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

const srcAlias = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  site: "https://prayerwall.space",
  output: "server",
  adapter: node({ mode: "standalone" }),
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
