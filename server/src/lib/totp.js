import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { config } from "../config.js";

export const newSecret = () => generateSecret();

export async function provisioning(secret, email) {
  const uri = generateURI({ issuer: config.appName, label: email, secret });
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 320, color: { dark: "#22211d", light: "#ffffff" } });
  return { uri, qr };
}

/** Accepts the current code, or one 30 s step either side to allow for clock drift. */
export async function checkCode(secret, code) {
  const token = String(code).replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) return false;
  try {
    const r = await verify({ secret, token, epochTolerance: 30 });
    return Boolean(r.valid);
  } catch {
    return false;
  }
}
