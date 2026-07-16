export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  is_blocked: boolean;
  is_admin?: boolean;
  is_staff?: boolean;
  role?: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnonymousUser {
  id: string;
  display_name: string;
  token_expires_at?: string | null;
  is_blocked: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrayerRequest {
  id: string;
  user: string | null;
  anonymous_user: string | null;
  user_detail: User | null;
  anonymous_user_detail: AnonymousUser | null;
  title: string;
  description: string;
  tags: string[];
  is_public: boolean;
  prayer_count: number;
  is_approved?: boolean;
  review_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Prayer {
  id: string;
  user: string | null;
  anonymous_user: string | null;
  user_detail: User | null;
  anonymous_user_detail: AnonymousUser | null;
  prayer_request: string;
  prayer_request_title: string;
  created_at: string;
}

export interface AuthTokenResponse {
  token: string;
  user: User;
}

export interface AnonymousCreateResponse {
  id: string;
  display_name: string;
  token: string;
  token_expires_at: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  tags?: string;
  created_after?: string;
  created_before?: string;
}

export interface RequestAuthor {
  kind: "registered" | "anonymous" | "unknown";
  label: string;
  detail?: User | AnonymousUser | null;
}
