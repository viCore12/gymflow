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

// ── Staff types ───────────────────────────────────────────────────────────────

export type StaffRole = "staff" | "coach" | "manager";

export interface CommissionRate {
  plan_sale_pct: number;
  pt_session_rate_vnd: number;
}

export interface StaffListItem {
  id: string;
  employee_code: string;
  full_name: string;
  role: StaffRole;
  is_active: boolean;
  phone: string | null;
  created_at: string;
}

export interface Staff {
  id: string;
  employee_code: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: StaffRole;
  hire_date: string;
  base_salary: string;
  commission_rate_json: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffCreateBody {
  full_name: string;
  phone?: string;
  email?: string;
  role?: StaffRole;
  hire_date: string;
  base_salary?: number;
  commission_rate_json?: string;
  notes?: string;
}

export interface StaffUpdateBody {
  full_name?: string;
  phone?: string;
  email?: string;
  role?: StaffRole;
  base_salary?: number;
  commission_rate_json?: string;
  is_active?: boolean;
  notes?: string;
}

// ── Shift types ────────────────────────────────────────────────────────────────

export interface ShiftListItem {
  id: string;
  staff_id: string;
  staff_full_name: string;
  date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  is_cancelled: boolean;
}

export interface Shift {
  id: string;
  staff_id: string;
  staff_full_name: string;
  date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  notes: string | null;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShiftCreateBody {
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  shift_type?: string;
  notes?: string;
}

export interface ShiftUpdateBody {
  date?: string;
  start_time?: string;
  end_time?: string;
  shift_type?: string;
  notes?: string;
  is_cancelled?: boolean;
}

// ── Customer API ──────────────────────────────────────────────────────────────

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

// ── Check-in API ──────────────────────────────────────────────────────────────

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

// ── Staff API ─────────────────────────────────────────────────────────────────

export const staffApi = {
  list(
    params: { q?: string; role?: StaffRole; is_active?: boolean; page?: number; per_page?: number },
    token?: string
  ) {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.role) qs.set("role", params.role);
    if (params.is_active !== undefined) qs.set("is_active", String(params.is_active));
    if (params.page) qs.set("page", String(params.page));
    if (params.per_page) qs.set("per_page", String(params.per_page));
    const query = qs.toString() ? `?${qs}` : "";
    return apiFetch<PaginatedList<StaffListItem>>(`/staff${query}`, { token });
  },

  get(id: string, token?: string) {
    return apiFetch<Staff>(`/staff/${id}`, { token });
  },

  create(body: StaffCreateBody, token?: string) {
    return apiFetch<Staff>("/staff", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
  },

  update(id: string, body: StaffUpdateBody, token?: string) {
    return apiFetch<Staff>(`/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    });
  },

  delete(id: string, token?: string) {
    return apiFetch<void>(`/staff/${id}`, { method: "DELETE", token });
  },
};

// ── Shifts API ────────────────────────────────────────────────────────────────

export const shiftsApi = {
  list(
    params: {
      staff_id?: string;
      date_from?: string;
      date_to?: string;
      shift_type?: string;
      page?: number;
      per_page?: number;
    },
    token?: string
  ) {
    const qs = new URLSearchParams();
    if (params.staff_id) qs.set("staff_id", params.staff_id);
    if (params.date_from) qs.set("date_from", params.date_from);
    if (params.date_to) qs.set("date_to", params.date_to);
    if (params.shift_type) qs.set("shift_type", params.shift_type);
    if (params.page) qs.set("page", String(params.page));
    if (params.per_page) qs.set("per_page", String(params.per_page));
    const query = qs.toString() ? `?${qs}` : "";
    return apiFetch<PaginatedList<ShiftListItem>>(`/shifts${query}`, { token });
  },

  create(body: ShiftCreateBody, token?: string) {
    return apiFetch<Shift>("/shifts", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
  },

  update(id: string, body: ShiftUpdateBody, token?: string) {
    return apiFetch<Shift>(`/shifts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    });
  },

  delete(id: string, token?: string) {
    return apiFetch<void>(`/shifts/${id}`, { method: "DELETE", token });
  },
};

// ── Inventory: Product types & API ──────────────────────────────────────────

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
}

export interface ProductCreateBody {
  sku: string;
  name: string;
  price: number;
  stock?: number;
  active?: boolean;
}

export interface ProductUpdateBody {
  name?: string;
  price?: number;
  stock?: number;
  active?: boolean;
}

export const productsApi = {
  list(params: { q?: string; active_only?: boolean }, token?: string) {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.active_only !== undefined) qs.set("active_only", String(params.active_only));
    const query = qs.toString() ? `?${qs}` : "";
    return apiFetch<Product[]>(`/products${query}`, { token });
  },

  get(id: string, token?: string) {
    return apiFetch<Product>(`/products/${id}`, { token });
  },

  create(body: ProductCreateBody, token?: string) {
    return apiFetch<Product>("/products", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
  },

  update(id: string, body: ProductUpdateBody, token?: string) {
    return apiFetch<Product>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    });
  },
};

// ── Inventory: Stock Move types & API ──────────────────────────────────────

export type StockMoveType = "in" | "out" | "adjustment";
export type StockMoveStatus = "draft" | "approved" | "rejected";

export interface StockMove {
  id: string;
  product_id: string;
  move_type: StockMoveType;
  qty: number;
  status: StockMoveStatus;
  note: string | null;
  created_by_id: string | null;
  approved_by_id: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface StockMoveCreateBody {
  product_id: string;
  move_type: StockMoveType;
  qty: number;
  note?: string;
}

export interface StockMoveApproveBody {
  approved_by_id: string;
}

export const stockMovesApi = {
  list(params: { product_id?: string; status?: StockMoveStatus }, token?: string) {
    const qs = new URLSearchParams();
    if (params.product_id) qs.set("product_id", params.product_id);
    if (params.status) qs.set("status", params.status);
    const query = qs.toString() ? `?${qs}` : "";
    return apiFetch<StockMove[]>(`/inventory/moves${query}`, { token });
  },

  create(body: StockMoveCreateBody, token?: string) {
    return apiFetch<StockMove>("/inventory/moves", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
  },

  approve(id: string, body: StockMoveApproveBody, token?: string) {
    return apiFetch<StockMove>(`/inventory/moves/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
  },

  reject(id: string, body: StockMoveApproveBody, token?: string) {
    return apiFetch<StockMove>(`/inventory/moves/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
  },
};

// ── Inventory: Stock Lot types & API ──────────────────────────────────────

export interface StockLot {
  id: string;
  product_id: string;
  lot_number: string;
  qty: number;
  expiry_date: string | null;
}

export interface StockLotCreateBody {
  product_id: string;
  lot_number: string;
  qty: number;
  expiry_date?: string;
}

export const stockLotsApi = {
  list(params: { product_id?: string }, token?: string) {
    const qs = new URLSearchParams();
    if (params.product_id) qs.set("product_id", params.product_id);
    const query = qs.toString() ? `?${qs}` : "";
    return apiFetch<StockLot[]>(`/inventory/lots${query}`, { token });
  },

  create(body: StockLotCreateBody, token?: string) {
    return apiFetch<StockLot>("/inventory/lots", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
  },
};

// ── Inventory: Stock Take types & API ──────────────────────────────────────

export type StockTakeStatus = "draft" | "confirmed";

export interface StockTakeLine {
  id: string;
  stock_take_id: string;
  product_id: string;
  system_qty: number;
  counted_qty: number;
}

export interface StockTake {
  id: string;
  taken_at: string;
  status: StockTakeStatus;
  note: string | null;
  created_by_id: string | null;
  lines: StockTakeLine[];
}

export interface StockTakeCreateBody {
  note?: string;
}

export interface StockTakeLineCreateBody {
  product_id: string;
  system_qty: number;
  counted_qty: number;
}

export const stockTakesApi = {
  list(token?: string) {
    return apiFetch<StockTake[]>(`/inventory/stock-takes`, { token });
  },

  create(body: StockTakeCreateBody, token?: string) {
    return apiFetch<StockTake>("/inventory/stock-takes", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
  },

  addLine(take_id: string, body: StockTakeLineCreateBody, token?: string) {
    return apiFetch<StockTakeLine>(`/inventory/stock-takes/${take_id}/lines`, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
  },

  get(id: string, token?: string) {
    return apiFetch<StockTake>(`/inventory/stock-takes/${id}`, { token });
  },

  close(take_id: string, token?: string) {
    return apiFetch<StockTake>(`/inventory/stock-takes/${take_id}/close`, {
      method: "POST",
      body: JSON.stringify({}),
      token,
    });
  },
};

// ── Inventory: Low Stock & Alert types & API ──────────────────────────────

export interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
}

export const inventoryApi = {
  getLowStock(params: { threshold?: number }, token?: string) {
    const qs = new URLSearchParams();
    if (params.threshold) qs.set("threshold", String(params.threshold));
    const query = qs.toString() ? `?${qs}` : "";
    return apiFetch<LowStockItem[]>(`/inventory/low-stock${query}`, { token });
  },
};
