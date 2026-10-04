import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, savedHash] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !savedHash) return false;

  const hash = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(savedHash, 'hex');
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}