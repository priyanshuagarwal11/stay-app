import crypto from "node:crypto";
import { config } from "../config.js";

/** AES-256-GCM so authenticator secrets are never stored in plain text. */
export function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", config.encKey, iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(payload) {
  const [iv, tag, enc] = payload.split(".").map((s) => Buffer.from(s, "base64url"));
  const d = crypto.createDecipheriv("aes-256-gcm", config.encKey, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}

export const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

/** 8 one-time backup codes like "7KQ2-M9XD". */
export function makeBackupCodes(n = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: n }, () => {
    const bytes = crypto.randomBytes(8);
    const s = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}

export const normalizeBackup = (code) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");
