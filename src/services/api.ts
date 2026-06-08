import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3001/api`;

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
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth API (7 endpoints) ─────────────────────────────────────

export const authApi = {
  register: (data: { full_name: string; email?: string; phone: string; password: string; sport_goal?: string; plan_id?: number; gym_slug?: string }) =>
    api.post("/auth/register", data),
  login: (identifier: string, password: string, gym_slug?: string) =>
    api.post("/auth/login", { identifier, password, gym_slug }),
  getGymInfo: (slug: string) => api.get(`/gyms/${slug}/info`),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  changePassword: (current_password: string, new_password: string) =>
    api.put("/auth/password", { current_password, new_password }),
  updateProfile: (data: { full_name?: string; email?: string; phone?: string; sport_goal?: string }) =>
    api.put("/auth/profile", data),
  refresh: () => api.post("/auth/refresh"),
};

// ── Plans API (5) ──────────────────────────────────────────────

export const plansApi = {
  getAll: (activeOnly = true) => api.get(`/plans${activeOnly ? "?active=true" : ""}`),
  getById: (id: number) => api.get(`/plans/${id}`),
  create: (data: any) => api.post("/plans", data),
  update: (id: number, data: any) => api.put(`/plans/${id}`, data),
  delete: (id: number) => api.delete(`/plans/${id}`),
};

// ── Users API (10) ─────────────────────────────────────────────

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

// ── Subscriptions API (7) ──────────────────────────────────────

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

// ── Reservations API (9) ───────────────────────────────────────

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

// ── Payments API (8) ───────────────────────────────────────────

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

// ── Dashboard API (7) ──────────────────────────────────────────

export const dashboardApi = {
  summary: () => api.get("/dashboard/summary"),
  alerts: () => api.get("/dashboard/alerts"),
  dailyRevenue: (days?: number) => api.get("/dashboard/revenue/daily", { params: { days } }),
  monthlyRevenue: () => api.get("/dashboard/revenue/monthly"),
  todayReservations: () => api.get("/dashboard/reservations/today"),
  membersStats: () => api.get("/dashboard/members/stats"),
};

// ── Notifications API (5) ──────────────────────────────────────

export const notificationsApi = {
  getAll: (unread = false) => api.get("/notifications", { params: { unread } }),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
  send: (data: { user_id?: number; title: string; message: string; type?: string; broadcast?: boolean }) =>
    api.post("/notifications", data),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};

// ── Settings API (3) ───────────────────────────────────────────

export const settingsApi = {
  getPublic: () => api.get("/settings"),
  getAll: () => api.get("/settings/all"),
  update: (data: Record<string, string>) => api.put("/settings", data),
};

// ── Activity Logs API (1) ──────────────────────────────────────

export const logsApi = {
  getAll: (params?: { page?: number; action?: string; target_type?: string; admin_id?: string; date_from?: string; date_to?: string }) =>
    api.get("/logs", { params }),
};

// ── QR Code API (3) ────────────────────────────────────────────

export const qrcodeApi = {
  getMy: () => api.get("/qrcode/my"),
  verify: (qr_token: string) => api.post("/qrcode/verify", { qr_token }),
  regenerate: () => api.post("/qrcode/regenerate"),
};

// ── Attendance API (6) ─────────────────────────────────────────

export const attendanceApi = {
  getInGym: () => api.get("/attendance/in-gym"),
  checkIn: (user_id: number) => api.post("/attendance/check-in", { user_id }),
  checkOut: (user_id: number) => api.post("/attendance/check-out", { user_id }),
  getToday: () => api.get("/attendance/today"),
  getHistory: (params?: { page?: number; user_id?: string; date_from?: string; date_to?: string }) =>
    api.get("/attendance/history", { params }),
  getStats: (days?: number) => api.get("/attendance/stats", { params: { days } }),
};

// ── Invoices API (4) ───────────────────────────────────────────

export const invoicesApi = {
  getAll: (params?: { page?: number; user_id?: string; status?: string }) =>
    api.get("/invoices", { params }),
  getUserInvoices: (userId: number) => api.get(`/invoices/user/${userId}`),
  generate: (payment_id: number) => api.post("/invoices/generate", { payment_id }),
  getPdf: (id: number) => api.get(`/invoices/${id}/pdf`),
};

// ── Progress API (3) ───────────────────────────────────────────

export const progressApi = {
  getUserProgress: (userId: number) => api.get(`/progress/user/${userId}`),
  add: (data: { weight?: number; height?: number; body_fat?: number; muscle_mass?: number; goal?: string; notes?: string; recorded_at: string }) =>
    api.post("/progress", data),
  delete: (id: number) => api.delete(`/progress/${id}`),
};

// ── Workouts API (6) ───────────────────────────────────────────

export const workoutsApi = {
  getAll: (params?: { page?: number; user_id?: string }) =>
    api.get("/workouts", { params }),
  getUserPlans: (userId: number) => api.get(`/workouts/user/${userId}`),
  getDetail: (id: number) => api.get(`/workouts/${id}`),
  create: (data: any) => api.post("/workouts", data),
  updateStatus: (id: number, status: string) => api.put(`/workouts/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/workouts/${id}`),
};

// ── Promos API (5) ─────────────────────────────────────────────

export const promosApi = {
  getAll: (activeOnly = false) => api.get("/promos", { params: { active: activeOnly } }),
  create: (data: any) => api.post("/promos", data),
  apply: (code: string, amount: number) => api.post("/promos/apply", { code, amount }),
  update: (id: number, data: any) => api.put(`/promos/${id}`, data),
  delete: (id: number) => api.delete(`/promos/${id}`),
};

// ── Referrals API (4) ──────────────────────────────────────────

export const referralsApi = {
  getMyCode: () => api.get("/referrals/my-code"),
  useCode: (referral_code: string) => api.post("/referrals/use", { referral_code }),
  getAll: () => api.get("/referrals"),
  approve: (id: number) => api.put(`/referrals/${id}/approve`),
};

// ── Exports API (4) ────────────────────────────────────────────

export const exportsApi = {
  members: () => api.get("/exports/members", { responseType: "blob" }),
  payments: (params?: { date_from?: string; date_to?: string }) =>
    api.get("/exports/payments", { params, responseType: "blob" }),
  reservations: () => api.get("/exports/reservations", { responseType: "blob" }),
  attendance: () => api.get("/exports/attendance", { responseType: "blob" }),
};

// ── CRM API (5) ────────────────────────────────────────────────

export const crmApi = {
  getMemberCRM: (id: number) => api.get(`/crm/member/${id}`),
  addNote: (userId: number, note: string) => api.post(`/crm/member/${userId}/note`, { note }),
  deleteNote: (id: number) => api.delete(`/crm/note/${id}`),
  getRiskScores: (level?: string) => api.get("/crm/risk-scores", { params: { level } }),
  recalculateRiskScores: () => api.post("/crm/risk-scores/recalculate"),
};

// ── Messages API (5) ───────────────────────────────────────────

export const messagesApi = {
  getInbox: (params?: { page?: number }) => api.get("/messages/inbox", { params }),
  getSent: () => api.get("/messages/sent"),
  send: (data: { receiver_id?: number; title: string; content: string; type?: string; target_group?: string }) =>
    api.post("/messages/send", data),
  markRead: (id: number) => api.put(`/messages/${id}/read`),
  getUnreadCount: () => api.get("/messages/unread-count"),
};

// ── Analytics API (5) ──────────────────────────────────────────

export const analyticsApi = {
  peakHours: (days?: number) => api.get("/analytics/peak-hours", { params: { days } }),
  popularSessions: (days?: number) => api.get("/analytics/popular-sessions", { params: { days } }),
  profitableDays: (days?: number) => api.get("/analytics/profitable-days", { params: { days } }),
  topMembers: (days?: number, limit?: number) => api.get("/analytics/top-members", { params: { days, limit } }),
  retention: () => api.get("/analytics/retention"),
};

// ── Branches API (4) ───────────────────────────────────────────

export const branchesApi = {
  getAll: () => api.get("/branches"),
  create: (data: any) => api.post("/branches", data),
  update: (id: number, data: any) => api.put(`/branches/${id}`, data),
  delete: (id: number) => api.delete(`/branches/${id}`),
};

// ── Shop API (7) ───────────────────────────────────────────────

export const shopApi = {
  getProducts: (activeOnly = true) => api.get("/shop/products", { params: { active: activeOnly } }),
  createProduct: (data: any) => api.post("/shop/products", data),
  updateProduct: (id: number, data: any) => api.put(`/shop/products/${id}`, data),
  deleteProduct: (id: number) => api.delete(`/shop/products/${id}`),
  createSale: (data: any) => api.post("/shop/sales", data),
  getSales: (params?: { page?: number }) => api.get("/shop/sales", { params }),
  getSaleStats: () => api.get("/shop/sales/stats"),
};

// ── Badges API (4) ─────────────────────────────────────────────

export const badgesApi = {
  getAll: () => api.get("/badges"),
  getUserBadges: (userId: number) => api.get(`/badges/user/${userId}`),
  checkAndAward: (userId: number) => api.post(`/badges/check/${userId}`),
  award: (user_id: number, badge_id: number) => api.post("/badges/award", { user_id, badge_id }),
};

// ── Platform API ───────────────────────────────────────────────

export const platformApi = {
  summary: () => api.get("/platform/summary"),
  gyms: (status?: string) => api.get("/platform/gyms", { params: status ? { status } : undefined }),
  createGym: (data: {
    name: string;
    slug?: string;
    owner_name?: string;
    owner_email?: string;
    owner_phone?: string;
    owner_password?: string;
    city?: string;
    country?: string;
    status?: "PENDING" | "ACTIVE" | "SUSPENDED";
  }) => api.post("/platform/gyms", data),
  getGymDetail: (slugOrId: string | number) => api.get(`/platform/gyms/${slugOrId}`),
  updateGymStatus: (id: number, status: "PENDING" | "ACTIVE" | "SUSPENDED") =>
    api.put(`/platform/gyms/${id}/status`, { status }),
  createGymAdmin: (gymId: number, data: { full_name: string; email: string; phone: string; password: string }) =>
    api.post(`/platform/gyms/${gymId}/admins`, data),
  revenue: () => api.get("/platform/revenue"),
  logs: (params?: { page?: number }) => api.get("/platform/logs", { params }),
  switchGym: (gym_slug: string) => api.post("/platform/switch-gym", { gym_slug }),
  leaveGym: () => api.post("/platform/leave-gym"),
  admins: () => api.get("/platform/admins"),
  createAdmin: (data: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
  }) => api.post("/platform/admins", data),
};

// ── Coach API ─────────────────────────────────────────────────

export const coachApi = {
  dashboard: () => api.get("/coach/dashboard"),
  sessions: () => api.get("/coach/sessions"),
  members: () => api.get("/coach/members"),
};
