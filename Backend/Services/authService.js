import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as A from '../Models/adminModel.js';
import { HttpError } from './appointmentService.js';

export async function login(username, password) {
  const admin = await A.findByUsername(String(username || '').trim());
  const ok = admin && (await bcrypt.compare(String(password || ''), admin.password_hash));
  if (!ok) throw new HttpError(401, 'Incorrect username or password.');

  const token = jwt.sign(
    { id: admin.id, role: admin.role, name: admin.full_name },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return { token, admin: { id: admin.id, fullName: admin.full_name, username: admin.username, role: admin.role } };
}
