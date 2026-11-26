const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const KEY = 'tourism_admin_session';

export const session = {
  get() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
  },
  set(value) {
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* ignore */ }
  },
  clear() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  },
};

export async function request(path, { method = 'GET', body } = {}) {
  const s = session.get();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error('Cannot reach the server. Please check that the backend is running.');
    err.network = true;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong.');
    err.status = res.status;
    err.errors = data.errors;
    throw err;
  }
  return data;
}

export const adminLogin = (username, password) =>
  request('/admin/login', { method: 'POST', body: { username, password } });

export const adminMe = () => request('/admin/me');

// ================= APPOINTMENT MANAGEMENT =================

export const getAppointments = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.date) {
    params.set('date', filters.date);
  }

  const query = params.toString();

  return request(
    `/admin/appointments${query ? `?${query}` : ''}`
  );
};

// Confirm appointment
export const confirmAppointment = (reference) =>
  request(
    `/admin/appointments/${encodeURIComponent(reference)}/confirm`,
    { method: 'PATCH' }
  );

// Decline appointment
export const declineAppointment = (reference, remarks) =>
  request(
    `/admin/appointments/${encodeURIComponent(reference)}/decline`,
    {
      method: 'PATCH',
      body: { remarks },
    }
  );

  // SERVICES
export const getServices = () => request('/admin/services');

export const createService = (data) =>
  request('/admin/services', { method: 'POST', body: data });

export const updateService = (id, data) =>
  request(`/admin/services/${id}`, { method: 'PUT', body: data });

export const changeServiceStatus = (id, active) =>
  request(`/admin/services/${id}/status`, {
    method: 'PATCH',
    body: { active },
  });

// BLOCKED DATES
export const getBlockedDates = (serviceId = '') => {
  const query = serviceId
    ? `?serviceId=${encodeURIComponent(serviceId)}`
    : '';
  return request(`/admin/blocked-dates${query}`);
};

export const createBlockedDate = (data) =>
  request('/admin/blocked-dates', { method: 'POST', body: data });

export const deleteBlockedDate = (id) =>
  request(`/admin/blocked-dates/${id}`, { method: 'DELETE' });