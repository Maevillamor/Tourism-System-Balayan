
import { pool } from '../Config/db.js';

// Get all services, including inactive services for admin
export async function getAllServices() {
  const [rows] = await pool.query(
    `SELECT
      id,
      name,
      operating_days,
      open_time,
      close_time,
      slot_minutes,
      capacity,
      break_start,
      break_end,
      active
    FROM services
    ORDER BY id ASC`
  );

  return rows;
}

// Get one service by ID
export async function getServiceById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM services WHERE id = ? LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

// Create a new service
export async function createService(data) {
  const [result] = await pool.query(
    `INSERT INTO services
      (name, operating_days, open_time, close_time,
       slot_minutes, capacity, break_start, break_end, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.operating_days,
      data.open_time,
      data.close_time,
      data.slot_minutes,
      data.capacity,
      data.break_start,
      data.break_end,
      data.active
    ]
  );

  return getServiceById(result.insertId);
}

// Update an existing service
export async function updateService(id, data) {
  await pool.query(
    `UPDATE services SET
      name = ?,
      operating_days = ?,
      open_time = ?,
      close_time = ?,
      slot_minutes = ?,
      capacity = ?,
      break_start = ?,
      break_end = ?,
      active = ?
     WHERE id = ?`,
    [
      data.name,
      data.operating_days,
      data.open_time,
      data.close_time,
      data.slot_minutes,
      data.capacity,
      data.break_start,
      data.break_end,
      data.active,
      id
    ]
  );

  return getServiceById(id);
}

// Activate or deactivate a service
export async function updateServiceStatus(id, active) {
  await pool.query(
    `UPDATE services SET active = ? WHERE id = ?`,
    [active, id]
  );

  return getServiceById(id);
}


// ================= BLOCKED DATES =================

// Get blocked dates, optionally filtered by service
export async function getBlockedDates(serviceId = null) {
  let sql = `
    SELECT
      bd.id,
      bd.service_id,
      s.name AS service_name,
      DATE_FORMAT(bd.date, '%Y-%m-%d') AS date,
      bd.label
    FROM blocked_dates bd
    JOIN services s ON s.id = bd.service_id
  `;

  const params = [];

  if (serviceId !== null) {
    sql += ' WHERE bd.service_id = ?';
    params.push(serviceId);
  }

  sql += ' ORDER BY bd.date ASC';

  const [rows] = await pool.query(sql, params);
  return rows;
}

// Add a blocked date
export async function createBlockedDate(data) {
  const [result] = await pool.query(
    `INSERT INTO blocked_dates (service_id, date, label)
     VALUES (?, ?, ?)`,
    [data.service_id, data.date, data.label || null]
  );

  const [rows] = await pool.query(
    `SELECT
      bd.id,
      bd.service_id,
      s.name AS service_name,
      DATE_FORMAT(bd.date, '%Y-%m-%d') AS date,
      bd.label
     FROM blocked_dates bd
     JOIN services s ON s.id = bd.service_id
     WHERE bd.id = ?`,
    [result.insertId]
  );

  return rows[0] || null;
}

// Delete a blocked date
export async function deleteBlockedDate(id) {
  const [result] = await pool.query(
    'DELETE FROM blocked_dates WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}
