const API_BASE = import.meta.env.VITE_AGENT_API_URL ?? "";

const TOKEN_KEY = "academy-admin-token";
const USER_KEY = "academy-admin-user";

export type AdminUserInfo = {
  id: string;
  userName: string;
  fullName: string;
};

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ReservationStatus =
  | "Reserved"
  | "PayLater"
  | "PaymentPendingReview"
  | "Active"
  | "Cancelled";

export type ReservationListItem = {
  id: string;
  fullName: string;
  whatsappPhone: string;
  programId: number | null;
  programName: string | null;
  programPrice: number | null;
  preferredSchedule: string | null;
  notes: string | null;
  payNow: boolean;
  status: ReservationStatus;
  referenceNumber: string | null;
  createdAt: string;
};

export type PaymentProofListItem = {
  id: string;
  reservationId: string;
  reservationRef: string;
  userName: string;
  userPhone: string;
  method: string;
  amount: number | null;
  proofUrl: string | null;
  txnRef: string | null;
  status: "PendingReview" | "Approved" | "Rejected";
  createdAt: string;
};

export type ProgramListItem = {
  id: number;
  name: string;
  category: string;
  notes: string | null;
  price: number;
  period: string;
  features: string[];
  description: string | null;
  isActive: boolean;
};

export type NotificationListItem = {
  id: string;
  type: string;
  message: string;
  reservationId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type AdminStats = {
  totalUsers: number;
  active: number;
  pendingPayments: number;
  reserved: number;
  cancelled: number;
  revenueThisMonth: number;
  newThisMonth: number;
  recentReservations: ReservationListItem[];
};

// ── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, user: AdminUserInfo): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAdminUser(): AdminUserInfo | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUserInfo) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ── HTTP helper ──────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/dashboard/login")) {
      window.location.href = "/dashboard/login";
    }
    throw new Error("انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مجدداً.");
  }

  if (!res.ok) {
    let message = `خطأ (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(userName: string, password: string) {
  const data = await request<{
    accessToken: string;
    expiresAt: string;
    user: AdminUserInfo;
  }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ userName, password }),
    },
    false,
  );
  setToken(data.accessToken, data.user);
  return data;
}

export function logout() {
  clearToken();
  if (typeof window !== "undefined") window.location.href = "/dashboard/login";
}

// ── API ──────────────────────────────────────────────────────────────────────

export const adminApi = {
  getStats: () => request<AdminStats>("/api/admin/stats"),

  getReservations: (params: { status?: string; search?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return request<PagedResponse<ReservationListItem>>(`/api/admin/reservations?${qs.toString()}`);
  },

  createReservation: (body: {
    fullName: string;
    whatsappPhone: string;
    programId: number | null;
    preferredSchedule?: string;
    notes?: string;
    payNow: boolean;
  }) =>
    request<ReservationListItem>("/api/admin/reservations", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateReservationStatus: (id: string, status: ReservationStatus) =>
    request<ReservationListItem>(`/api/admin/reservations/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getPaymentProofs: (params: { status?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return request<PagedResponse<PaymentProofListItem>>(`/api/admin/payment-proofs?${qs.toString()}`);
  },

  approvePaymentProof: (id: string) =>
    request<void>(`/api/admin/payment-proofs/${id}/approve`, { method: "POST" }),

  rejectPaymentProof: (id: string, reason?: string) =>
    request<void>(`/api/admin/payment-proofs/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  getPrograms: () => request<ProgramListItem[]>("/api/admin/programs"),

  createProgram: (body: Omit<ProgramListItem, "id" | "isActive">) =>
    request<ProgramListItem>("/api/admin/programs", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateProgram: (id: number, body: Omit<ProgramListItem, "id" | "isActive">) =>
    request<ProgramListItem>(`/api/admin/programs/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  toggleProgram: (id: number) =>
    request<{ id: number; isActive: boolean }>(`/api/admin/programs/${id}/toggle`, {
      method: "PATCH",
    }),

  deleteProgram: (id: number) =>
    request<void>(`/api/admin/programs/${id}`, { method: "DELETE" }),

  getNotifications: (params: { unreadOnly?: boolean; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params.unreadOnly) qs.set("unreadOnly", "true");
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return request<PagedResponse<NotificationListItem>>(`/api/admin/notifications?${qs.toString()}`);
  },

  markNotificationsRead: (ids?: string[]) =>
    request<void>("/api/admin/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify({ ids: ids ?? null }),
    }),

  markAllNotificationsRead: () =>
    request<void>("/api/admin/notifications/mark-all-read", { method: "POST" }),
};
