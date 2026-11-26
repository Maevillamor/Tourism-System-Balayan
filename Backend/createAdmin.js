import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './Config/db.js';

const [username, password, role = 'Admin', ...nameParts] = process.argv.slice(2);
const fullName = nameParts.join(' ') || username;

if (!username || !password || password.length < 8) {
  console.log('Usage: node createAdmin.js <username> <password (8+ chars)> <Admin|Staff> <full name>');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
await pool.query(
  'INSERT INTO admins (full_name, username, password_hash, role) VALUES (?,?,?,?)',
  [fullName, username, hash, role]
);
console.log(`Created ${role}: ${username}`);
process.exit(0);
