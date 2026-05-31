import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";
const HASH_SEPARATOR = "$";

const normalizedEmail = z
  .string()
  .trim()
  .email()
  .transform((email) => email.toLowerCase());

const optionalName = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(100).optional());

export const credentialsSignInSchema = z.object({
  email: normalizedEmail,
  password: z.string().min(1).max(128),
});

export const credentialsRegisterSchema = z.object({
  name: optionalName,
  email: normalizedEmail,
  password: z.string().min(8).max(128),
});

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return [
    HASH_PREFIX,
    salt,
    derivedKey.toString("base64url"),
  ].join(HASH_SEPARATOR);
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [prefix, salt, hash] = storedHash.split(HASH_SEPARATOR);

  if (prefix !== HASH_PREFIX || !salt || !hash) {
    return false;
  }

  const storedKey = Buffer.from(hash, "base64url");

  if (storedKey.length !== KEY_LENGTH) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return timingSafeEqual(storedKey, derivedKey);
}
