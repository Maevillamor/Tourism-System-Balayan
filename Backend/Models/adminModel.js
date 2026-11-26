import { pool } from '../Config/db.js';

export const findByUsername = async (username) =>
  (await pool.query('SELECT * FROM admins WHERE username=? AND active=1', [username]))[0][0];
