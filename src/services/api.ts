import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Intercepteur : ajouter le token JWT a chaque requete
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur : gerer les erreurs 401 (token expire)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Rediriger vers login si pas deja dessus
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth API ───────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    full_name: string;
    email?: string;
    phone: string;
    password: string;
    sport_goal?: string;
    plan_id?: number;
  }) => api.post("/auth/register", data),

  login: (identifier: string, password: string) =>
    api.post("/auth/login", { identifier, password }),

  me: () => api.get("/auth/me"),

  logout: () => api.post("/auth/logout"),

  changePassword: (current_password: string, new_password: string) =>
    api.put("/auth/password", { current_password, new_password }),

  updateProfile: (data: { full_name?: string; email?: string; phone?: string; sport_goal?: string }) =>
    api.put("/auth/profile", data),

  refresh: () => api.post("/auth/refresh"),
};

// ── Plans API ──────────────────────────────────────────────────

export const plansApi = {
  getAll: (activeOnly = true) => api.get(`/plans${activeOnly ? "?active=true" : ""}`),
  getById: (id: number) => api.get(`/plans/${id}`),
  create: (data: any) => api.post("/plans", data),
  update: (id: number, data: any) => api.put(`/plans/${id}`, data),
  delete: (id: number) => api.delete(`/plans/${id}`),
};

// ── Users API ──────────────────────────────────────────────────

export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; keyword?: string; role?: string; status?: string }) =>
    api.get("/users", { params }),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post("/users", data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  validate: (id: number) => api.put(`/users/${id}/validate`),
  suspend: (id: number) => api.put(`/users/${id}/suspend`),
  reactivate: (id: number) => api.put(`/users/${id}/reactivate`),
  search: (keyword: string) => api.get("/users/search", { params: { keyword } }),
  stats: () => api.get("/users/stats"),
};

// ── Subscriptions API ──────────────────────────────────────────

export const subscriptionsApi = {
  getAll: (params?: { page?: number; status?: string; user_id?: number }) =>
    api.get("/subscriptions", { params }),
  getUserSubs: (userId: number) => api.get(`/subscriptions/user/${userId}`),
  create: (data: { user_id: number; plan_id: number; payment_method?: string; auto_activate?: boolean }) =>
    api.post("/subscriptions", data),
  activate: (id: number) => api.put(`/subscriptions/${id}/activate`),
  cancel: (id: number) => api.put(`/subscriptions/${id}/cancel`),
  renew: (id: number, payment_method?: string) => api.put(`/subscriptions/${id}/renew`, { payment_method }),
  expired: () => api.get("/subscriptions/expired"),
};

// ── Reservations API ───────────────────────────────────────────

export const reservationsApi = {
  getAll: (params?: { page?: number; status?: string; date?: string; user_id?: number; session_id?: number }) =>
    api.get("/reservations", { params }),
  getToday: () => api.get("/reservations/today"),
  getUserReservations: (userId: number, upcoming = false) =>
    api.get(`/reservations/user/${userId}`, { params: { upcoming } }),
  create: (data: { session_id: number; reservation_date: string; start_time: string; end_time: string; time_slot_id?: number }) =>
    api.post("/reservations", data),
  cancel: (id: number) => api.put(`/reservations/${id}/cancel`),
  complete: (id: number) => api.put(`/reservations/${id}/complete`),
  noShow: (id: number) => api.put(`/reservations/${id}/no-show`),
  getAvailableSlots: (sessionId: number, date: string) =>
    api.get("/reservations/available-slots", { params: { session_id: sessionId, date } }),
  getSessions: () => api.get("/reservations/sessions"),
};

// ── Payments API ───────────────────────────────────────────────

export const paymentsApi = {
  getAll: (params?: { page?: number; status?: string; method?: string; user_id?: number; date_from?: string; date_to?: string }) =>
    api.get("/payments", { params }),
  getUserPayments: (userId: number) => api.get(`/payments/user/${userId}`),
  create: (data: { user_id: number; amount: number; payment_method: string; subscription_id?: number; transaction_reference?: string }) =>
    api.post("/payments", data),
  validate: (id: number, transaction_reference?: string) =>
    api.put(`/payments/${id}/validate`, { transaction_reference }),
  cancel: (id: number) => api.put(`/payments/${id}/cancel`),
  refund: (id: number) => api.put(`/payments/${id}/refund`),
  dailyStats: (date?: string) => api.get("/payments/stats/daily", { params: { date } }),
  monthlyStats: (year?: number, month?: number) => api.get("/payments/stats/monthly", { params: { year, month } }),
};

// ── Dashboard API ──────────────────────────────────────────────

export const dashboardApi = {
  summary: () => api.get("/dashboard/summary"),
  dailyRevenue: (days?: number) => api.get("/dashboard/revenue/daily", { params: { days } }),
  monthlyRevenue: () => api.get("/dashboard/revenue/monthly"),
  todayReservations: () => api.get("/dashboard/reservations/today"),
  membersStats: () => api.get("/dashboard/members/stats"),
};

// ── Notifications API ──────────────────────────────────────────

export const notificationsApi = {
  getAll: (unread = false) => api.get("/notifications", { params: { unread } }),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
  send: (data: { user_id?: number; title: string; message: string; type?: string; broadcast?: boolean }) =>
    api.post("/notifications", data),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};
