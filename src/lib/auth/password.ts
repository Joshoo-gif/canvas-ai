import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  // 64-byte key using scrypt
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;

  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = scryptSync(password, salt, 64);

  // timingSafeEqual requires buffers of same length
  if (keyBuffer.length !== derivedKey.length) return false;
  return timingSafeEqual(keyBuffer, derivedKey);
}
