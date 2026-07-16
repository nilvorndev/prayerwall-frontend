import type { ApiClient } from "./client";
import { buildQuery } from "./client";
import type { ApiListQuery, PaginatedResponse, Prayer, PrayerRequest } from "@/lib/types";

export interface PrayerPayload {
  description: string;
  is_public?: boolean;
  title?: string;
}

export function listPrayers(client: ApiClient, query: ApiListQuery = {}) {
  return client.get<PaginatedResponse<PrayerRequest>>("/prayers/", buildQuery(query));
}

export function getPrayer(client: ApiClient, id: string) {
  return client.get<PrayerRequest>(`/prayers/${id}/`);
}

export function createPrayer(client: ApiClient, payload: PrayerPayload) {
  return client.post<PrayerRequest>("/prayers/create/", payload);
}

export function updatePrayer(client: ApiClient, id: string, payload: Partial<PrayerPayload>) {
  return client.patch<PrayerRequest>(`/prayers/${id}/update/`, payload);
}

export function deletePrayer(client: ApiClient, id: string) {
  return client.delete<void>(`/prayers/${id}/delete/`);
}

export function prayForPrayer(client: ApiClient, id: string) {
  return client.post<Prayer>(`/prayers/${id}/pray/`, {}, "auto");
}

export function listMyPrayers(client: ApiClient) {
  return client.get<PaginatedResponse<Prayer>>("/prayers/my/prayers/");
}

export function listMyPrayerRequests(client: ApiClient) {
  return client.get<PaginatedResponse<PrayerRequest>>("/prayers/my/");
}

export function getMyPrayerRequest(client: ApiClient, id: string) {
  return client.get<PrayerRequest>(`/prayers/my/${id}/`);
}

export function updateMyPrayerRequest(client: ApiClient, id: string, payload: Partial<PrayerPayload>) {
  return client.patch<PrayerRequest>(`/prayers/my/${id}/update/`, payload);
}

export function deleteMyPrayerRequest(client: ApiClient, id: string) {
  return client.delete<void>(`/prayers/my/${id}/delete/`);
}

export function listPrayersForRequest(client: ApiClient, prayerId: string) {
  return client.get<PaginatedResponse<Prayer>>(`/prayers/${prayerId}/prayers/`);
}

export function deletePrayerEntry(client: ApiClient, id: string) {
  return client.delete<void>(`/prayers/prayers/${id}/`);
}

export function listPrayersByToken(client: ApiClient, token: string, query: ApiListQuery = {}) {
  return client.get<PaginatedResponse<PrayerRequest>>("/prayers/my/", buildQuery(query), false, token);
}

export function getPrayerByToken(client: ApiClient, token: string, id: string) {
  return client.get<PrayerRequest>(`/prayers/my/${id}/`, undefined, false, token);
}

export function updatePrayerByToken(client: ApiClient, token: string, id: string, payload: Partial<PrayerPayload>) {
  return client.patch<PrayerRequest>(`/prayers/my/${id}/update/`, payload, false, token);
}

export function deletePrayerByToken(client: ApiClient, token: string, id: string) {
  return client.delete<void>(`/prayers/my/${id}/delete/`, false, token);
}
