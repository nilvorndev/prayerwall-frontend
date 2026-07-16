/// <reference types="astro/client" />

import type { SessionState } from "@/lib/auth/session";

declare global {
  namespace App {
    interface Locals {
      session: SessionState;
    }
  }
}

export {};
