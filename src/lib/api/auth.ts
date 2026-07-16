import type { ApiClient } from "./client";
import type { AnonymousCreateResponse, AuthTokenResponse, User } from "@/lib/types";

export function login(client: ApiClient, payload: { email: string; password: string }) {
  return client.post<AuthTokenResponse>("/users/auth/token/", payload, false);
}

export function register(
  client: ApiClient,
  payload: { email: string; password: string; first_name?: string; last_name?: string },
) {
  return client.post<User>("/users/register/", payload, false);
}

export function verifyConfirm(client: ApiClient, payload: { token?: string; code?: string }) {
  return client.post<{ detail?: string }>("/users/verify/confirm/", payload, false);
}

export function verifyResend(client: ApiClient, payload: { email: string }) {
  return client.post<{ detail?: string }>("/users/verify/resend/", payload, false);
}

export function createAnonymousIdentity(client: ApiClient, payload: { display_name?: string } = {}) {
  return client.post<AnonymousCreateResponse>("/users/anonymous/create/", payload, false);
}

export function rotateToken(client: ApiClient) {
  return client.post<AuthTokenResponse>("/users/auth/token/rotate/", {}, "registered");
}

export function logoutRegistered(client: ApiClient) {
  return client.post<void>("/users/auth/token/logout/", {}, "registered");
}

export function getMe(client: ApiClient) {
  return client.get<User>("/users/me/", undefined, "registered");
}

export function updateMe(client: ApiClient, payload: Partial<User>) {
  return client.patch<User>("/users/me/update/", payload, "registered");
}

export function deleteMe(client: ApiClient) {
  return client.delete<void>("/users/me/delete/", "registered");
}
