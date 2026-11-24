import crypto from "node:crypto";

const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production. See .env.example.");
}
if (!process.env.JWT_SECRET) {
  console.warn("[config] JWT_SECRET not set — using an insecure development secret.");
}

const jwtSecret = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";

export const config = {
  isProd,
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "7d",
  // Short-lived token issued after the password step when 2FA is on.
  mfaTokenTtl: "5m",
  appName: process.env.APP_NAME || "StaySupply",
  // 32-byte key used to encrypt authenticator secrets at rest.
  encKey: crypto.createHash("sha256").update(process.env.TOTP_ENC_KEY || jwtSecret).digest(),
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
