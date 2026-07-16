import type { ApiClient } from "./client";
import type { AnonymousUser, PaginatedResponse, PrayerRequest, User } from "@/lib/types";

type ApiQuery = Record<string, string | number | boolean | null | undefined>;

export function listUsers(client: ApiClient, query: ApiQuery = {}) {
  return client.get<PaginatedResponse<User>>("/users/", query);
}

export function listAnonymousIdentities(client: ApiClient, query: ApiQuery = {}) {
  return client.get<PaginatedResponse<AnonymousUser>>("/users/anonymous/", query);
}

export function listPrayers(client: ApiClient, query: ApiQuery = {}) {
  return client.get<PaginatedResponse<PrayerRequest>>("/prayers/", query);
}
