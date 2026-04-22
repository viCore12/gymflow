export type ApiOptions = RequestInit & { token?: string };

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api/v1${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type Gender = "male" | "female" | "other";

export interface CustomerListItem {
  id: string;
  code: string;
  full_name: string;
  phone: string | null;
  gender: Gender | null;
  created_at: string;
}

export interface CustomerContact {
  id: string;
  contact_type: "phone" | "email" | "emergency";
  value: string;
  label: string | null;
  is_primary: boolean;
  notes: string | null;
}

export interface Customer {
  id: string;
  code: string;
  full_name: string;
  phone: string | null;
  dob: string | null;
  gender: Gender | null;
  address: string | null;
  notes: string | null;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
  contacts: CustomerContact[];
}

export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface CheckIn {
  id: string;
  customer_id: string;
  checked_in_at: string;
  checked_in_by: string | null;
  method: string;
  notes: string | null;
  created_at: string;
}

export interface CustomerCreateBody {
  full_name: string;
  phone?: string;
  dob?: string;
  gender?: Gender;
  address?: string;
  notes?: string;
}

export interface CustomerUpdateBody {
  full_name?: string;
  phone?: string;
  dob?: string;
  gender?: Gender;
  address?: string;
  notes?: string;
}

// ── Customer API ─────────────────────────────────────────────────────────────

export const customersApi = {
  list(params: { q?: string; page?: number; per_page?: number }, token?: string) {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.page) qs.set("page", String(params.page));
    if (params.per_page) qs.set("per_page", String(params.per_page));
    const query = qs.toString() ? `?${qs}` : "";
    return apiFetch<PaginatedList<CustomerListItem>>(`/customers${query}`, { token });
  },

  get(id: string, token?: string) {
    return apiFetch<Customer>(`/customers/${id}`, { token });
  },

  create(body: CustomerCreateBody, token?: string) {
    return apiFetch<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
  },

  update(id: string, body: CustomerUpdateBody, token?: string) {
    return apiFetch<Customer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    });
  },
};

// ── Check-in API ─────────────────────────────────────────────────────────────

export const checkinsApi = {
  create(customer_id: string, notes?: string, token?: string) {
    return apiFetch<CheckIn>("/checkins", {
      method: "POST",
      body: JSON.stringify({ customer_id, notes }),
      token,
    });
  },

  listByCustomer(customer_id: string, params: { page?: number; per_page?: number } = {}, token?: string) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.per_page) qs.set("per_page", String(params.per_page));
    const query = qs.toString() ? `?${qs}` : "";
    return apiFetch<PaginatedList<CheckIn>>(`/checkins/customer/${customer_id}${query}`, { token });
  },
};
