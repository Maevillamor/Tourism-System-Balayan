
import * as M from '../Models/serviceModel.js';
import { HttpError } from './appointmentService.js';

// Convert and validate service ID
function validateId(id) {
  const value = Number(id);

  if (!Number.isInteger(value) || value <= 0) {
    throw new HttpError(400, 'Invalid service ID.');
  }

  return value;
}

// Accept HH:MM or HH:MM:SS
function validTime(value) {
  return typeof value === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
}

function toMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function normalizeDays(value) {
  const days = Array.isArray(value)
    ? value.map(Number)
    : String(value ?? '').split(',').map(Number);

  if (
    days.length === 0 ||
    days.some((day) => !Number.isInteger(day) || day < 0 || day > 6) ||
    new Set(days).size !== days.length
  ) {
    throw new HttpError(
      400,
      'Operating days must contain valid days from 0 (Sunday) to 6 (Saturday).'
    );
  }

  return days.sort((a, b) => a - b).join(',');
}

function normalizeActive(value, defaultValue = 1) {
  if (value === undefined || value === null) return defaultValue;

  if ([true, 1, '1'].includes(value)) return 1;
  if ([false, 0, '0'].includes(value)) return 0;

  throw new HttpError(400, 'Invalid service status.');
}

// Validate and prepare service information
function validateService(data, existing = {}) {
  const body = data || {};

  const name = String(body.name ?? existing.name ?? '').trim();

  const operatingDays = normalizeDays(
    body.operating_days ?? body.operatingDays ?? existing.operating_days
  );

  const openTime = body.open_time ?? body.openTime ?? existing.open_time;
  const closeTime = body.close_time ?? body.closeTime ?? existing.close_time;

  const slotMinutes = Number(
    body.slot_minutes ?? body.slotMinutes ?? existing.slot_minutes ?? 60
  );

  const capacity = Number(
    body.capacity ?? existing.capacity ?? 1
  );

  const breakStart =
    body.break_start ?? body.breakStart ?? existing.break_start ?? '12:00:00';

  const breakEnd =
    body.break_end ?? body.breakEnd ?? existing.break_end ?? '13:00:00';

  const active = normalizeActive(
    body.active,
    existing.active ?? 1
  );

  const errors = {};

  if (!name) {
    errors.name = 'Service name is required.';
  } else if (name.length > 120) {
    errors.name = 'Service name must not exceed 120 characters.';
  }

  if (!validTime(openTime)) {
    errors.open_time = 'Enter a valid opening time.';
  }

  if (!validTime(closeTime)) {
    errors.close_time = 'Enter a valid closing time.';
  }

  if (
    validTime(openTime) &&
    validTime(closeTime) &&
    toMinutes(openTime) >= toMinutes(closeTime)
  ) {
    errors.close_time = 'Closing time must be later than opening time.';
  }

  if (!Number.isInteger(slotMinutes) || slotMinutes <= 0 || slotMinutes > 1440) {
    errors.slot_minutes = 'Slot duration must be a positive whole number.';
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    errors.capacity = 'Capacity must be a positive whole number.';
  }

  if (!validTime(breakStart)) {
    errors.break_start = 'Enter a valid break start time.';
  }

  if (!validTime(breakEnd)) {
    errors.break_end = 'Enter a valid break end time.';
  }

  if (
    validTime(openTime) &&
    validTime(closeTime) &&
    validTime(breakStart) &&
    validTime(breakEnd)
  ) {
    const open = toMinutes(openTime);
    const close = toMinutes(closeTime);
    const start = toMinutes(breakStart);
    const end = toMinutes(breakEnd);

    if (start >= end || start < open || end > close) {
      errors.break_start =
        'Break time must be within operating hours and start before it ends.';
    }
  }

  if (Object.keys(errors).length) {
    throw new HttpError(400, 'Please check the service details.', errors);
  }

  return {
    name,
    operating_days: operatingDays,
    open_time: openTime,
    close_time: closeTime,
    slot_minutes: slotMinutes,
    capacity,
    break_start: breakStart,
    break_end: breakEnd,
    active
  };
}

// Get all services, including inactive services
export async function listAllServices() {
  return M.getAllServices();
}

// Add a new service
export async function createService(data) {
  const service = validateService(data);
  return M.createService(service);
}

// Edit an existing service
export async function updateService(id, data) {
  const serviceId = validateId(id);

  const existing = await M.getServiceById(serviceId);

  if (!existing) {
    throw new HttpError(404, 'Service not found.');
  }

  const service = validateService(data, existing);

  return M.updateService(serviceId, service);
}

// Activate or deactivate a service
export async function changeServiceStatus(id, active) {
  const serviceId = validateId(id);
  const status = normalizeActive(active);

  const existing = await M.getServiceById(serviceId);

  if (!existing) {
    throw new HttpError(404, 'Service not found.');
  }

  return M.updateServiceStatus(serviceId, status);
}

// ================= BLOCKED DATE MANAGEMENT =================

// Validate date format and actual calendar date

function validateDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, 'Invalid date. Use YYYY-MM-DD format.');
  }

  const [year, month, day] = date.split('-').map(Number);

  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new HttpError(400, 'Please enter a valid calendar date.');
  }

  return date;
}


// Get blocked dates
export async function listBlockedDates(serviceId) {
  if (serviceId !== undefined && serviceId !== null && serviceId !== '') {
    const id = validateId(serviceId);

    const service = await M.getServiceById(id);

    if (!service) {
      throw new HttpError(404, 'Service not found.');
    }

    return M.getBlockedDates(id);
  }

  return M.getBlockedDates();
}

// Add a blocked date
export async function createBlockedDate(data) {
  const body = data || {};

  const serviceId = validateId(body.service_id ?? body.serviceId);
  const date = validateDate(body.date);

  const label = String(body.label || '').trim();

  if (label.length > 60) {
    throw new HttpError(400, 'Blocked date label must not exceed 60 characters.');
  }

  const service = await M.getServiceById(serviceId);

  if (!service) {
    throw new HttpError(404, 'Service not found.');
  }

  return M.createBlockedDate({
    service_id: serviceId,
    date,
    label: label || null
  });
}

// Delete a blocked date
export async function removeBlockedDate(id) {
  const blockedDateId = validateId(id);

  const deleted = await M.deleteBlockedDate(blockedDateId);

  if (!deleted) {
    throw new HttpError(404, 'Blocked date not found.');
  }

  return { message: 'Blocked date removed successfully.' };
}
