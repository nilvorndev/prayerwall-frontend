/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare/env" />

import type { SessionState } from "@/lib/auth/session";

declare global {
  namespace App {
    interface Locals {
      session: SessionState;
    }
  }
}

export {};
