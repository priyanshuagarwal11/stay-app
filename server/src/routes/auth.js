import bcrypt from "bcryptjs";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { decrypt, encrypt, makeBackupCodes, normalizeBackup, sha256 } from "../lib/crypto.js";
import { signAccess, signMfa, verifyToken } from "../lib/tokens.js";
import { checkCode, newSecret, provisioning } from "../lib/totp.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { users } from "../store/index.js";

export const auth = Router();

// ---------- helpers ----------
const emptyTwoFactor = { enabled: false, secretEnc: null, pendingSecretEnc: null, backupCodes: [], lastCode: null, lastCodeAt: 0 };
const tf = (u) => ({ ...emptyTwoFactor, ...(u.twoFactor || {}) });

/** What the app is allowed to see about a user. Never secrets or hashes. */
export const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  property: u.property || "",
  phone: u.phone || "",
  createdAt: u.createdAt,
  twoFactorEnabled: tf(u).enabled,
  backupCodesLeft: tf(u).enabled ? tf(u).backupCodes.length : 0,
});

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const bad = (res, status, error, message) => res.status(status).json({ error, message });

function parse(schema, req, res) {
  const r = schema.safeParse(req.body ?? {});
  if (!r.success) {
    const first = r.error.issues[0];
    bad(res, 400, "invalid_input", first?.message || "Please check the form.");
    return null;
  }
  return r.data;
}

/**
 * Checks a 6-digit authenticator code (or a backup code when allowBackup).
 * Rejects a code that was already used, so a stolen code can't be replayed.
 * Returns { ok, usedBackup, twoFactor } where twoFactor is the updated state to save.
 */
async function checkSecondFactor(user, code, { allowBackup = true } = {}) {
  const t = tf(user);
  if (!t.enabled || !t.secretEnc) return { ok: false };
  const clean = String(code || "").trim();
  if (/^\d{6}$/.test(clean.replace(/\s/g, ""))) {
    const digits = clean.replace(/\s/g, "");
    if (t.lastCode === sha256(digits) && Date.now() - (t.lastCodeAt || 0) < 90_000) return { ok: false, reused: true };
    const ok = await checkCode(decrypt(t.secretEnc), digits);
    return ok ? { ok, usedBackup: false, twoFactor: { ...t, lastCode: sha256(digits), lastCodeAt: Date.now() } } : { ok: false };
  }
  if (allowBackup) {
    const h = sha256(normalizeBackup(clean));
    if (t.backupCodes.includes(h)) {
      return { ok: true, usedBackup: true, twoFactor: { ...t, backupCodes: t.backupCodes.filter((c) => c !== h) } };
    }
  }
  return { ok: false };
}

// ---------- rate limits ----------
const limiter = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "too_many_attempts", message: "Too many attempts. Please wait a few minutes and try again." },
  });
const loginLimit = limiter(20);
const codeLimit = limiter(15);

// ---------- schemas ----------
const email = z.string().trim().toLowerCase().email("Enter a valid email address.");
const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.")
  .regex(/[A-Za-z]/, "Password needs at least one letter.")
  .regex(/[0-9]/, "Password needs at least one number.");

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email,
  password,
  property: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().max(20).optional().default(""),
});
const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password.") });
const mfaSchema = z.object({ mfaToken: z.string().min(1), code: z.string().trim().min(6, "Enter the 6-digit code.") });
const codeSchema = z.object({ code: z.string().trim().min(6, "Enter the 6-digit code.") });
const disableSchema = z.object({ password: z.string().min(1, "Enter your password."), code: z.string().trim().min(6, "Enter a code.") });
const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  property: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(20).optional(),
});
const changePwSchema = z.object({ currentPassword: z.string().min(1, "Enter your current password."), newPassword: password });

// ---------- sign up / sign in ----------
auth.post("/signup", loginLimit, async (req, res) => {
  const body = parse(signupSchema, req, res);
  if (!body) return;
  if (await users().findByEmail(body.email)) return bad(res, 409, "email_taken", "An account with this email already exists. Try signing in.");
  const user = await users().create({
    name: body.name,
    email: body.email,
    property: body.property,
    phone: body.phone,
    passwordHash: await bcrypt.hash(body.password, 12),
    twoFactor: { ...emptyTwoFactor },
  });
  res.status(201).json({ status: "ok", token: signAccess(user.id), user: publicUser(user) });
});

auth.post("/login", loginLimit, async (req, res) => {
  const body = parse(loginSchema, req, res);
  if (!body) return;
  const user = await users().findByEmail(body.email);
  const ok = await bcrypt.compare(body.password, user?.passwordHash || DUMMY_HASH);
  if (!user || !ok) return bad(res, 401, "invalid_credentials", "Email or password is incorrect.");
  if (tf(user).enabled) return res.json({ status: "mfa_required", mfaToken: signMfa(user.id) });
  res.json({ status: "ok", token: signAccess(user.id), user: publicUser(user) });
});

auth.post("/login/2fa", codeLimit, async (req, res) => {
  const body = parse(mfaSchema, req, res);
  if (!body) return;
  const id = verifyToken(body.mfaToken, "mfa");
  if (!id) return bad(res, 401, "mfa_expired", "This sign-in has expired. Please enter your password again.");
  const user = await users().findById(id);
  if (!user) return bad(res, 401, "mfa_expired", "This sign-in has expired. Please enter your password again.");
  const r = await checkSecondFactor(user, body.code);
  if (!r.ok) return bad(res, 401, "invalid_code", r.reused ? "That code was already used. Wait for the next one." : "That code isn't right. Check your authenticator app and try again.");
  const updated = await users().update(user.id, { twoFactor: r.twoFactor });
  res.json({ status: "ok", token: signAccess(user.id), user: publicUser(updated), usedBackupCode: r.usedBackup });
});

// ---------- profile ----------
auth.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

auth.patch("/me", requireAuth, async (req, res) => {
  const body = parse(profileSchema, req, res);
  if (!body) return;
  const u = await users().update(req.user.id, body);
  res.json({ user: publicUser(u) });
});

auth.post("/change-password", requireAuth, loginLimit, async (req, res) => {
  const body = parse(changePwSchema, req, res);
  if (!body) return;
  if (!(await bcrypt.compare(body.currentPassword, req.user.passwordHash))) return bad(res, 401, "invalid_credentials", "Current password is incorrect.");
  await users().update(req.user.id, { passwordHash: await bcrypt.hash(body.newPassword, 12) });
  res.json({ status: "ok" });
});

// ---------- authenticator (2FA) ----------
/** Step 1: create a new secret and QR code. Not active until confirmed with a code. */
auth.post("/2fa/setup", requireAuth, async (req, res) => {
  if (tf(req.user).enabled) return bad(res, 409, "already_enabled", "Authenticator is already turned on.");
  const secret = newSecret();
  await users().update(req.user.id, { twoFactor: { ...tf(req.user), pendingSecretEnc: encrypt(secret) } });
  const { uri, qr } = await provisioning(secret, req.user.email);
  res.json({ secret, otpauthUrl: uri, qrDataUrl: qr });
});

/** Step 2: user types the code from the app. Turns 2FA on and returns backup codes once. */
auth.post("/2fa/enable", requireAuth, codeLimit, async (req, res) => {
  const body = parse(codeSchema, req, res);
  if (!body) return;
  const t = tf(req.user);
  if (t.enabled) return bad(res, 409, "already_enabled", "Authenticator is already turned on.");
  if (!t.pendingSecretEnc) return bad(res, 400, "no_setup", "Start the setup again.");
  const secret = decrypt(t.pendingSecretEnc);
  if (!(await checkCode(secret, body.code))) return bad(res, 401, "invalid_code", "That code isn't right. Make sure your phone's time is set automatically and try again.");
  const codes = makeBackupCodes();
  const u = await users().update(req.user.id, {
    twoFactor: {
      ...t,
      enabled: true,
      secretEnc: t.pendingSecretEnc,
      pendingSecretEnc: null,
      backupCodes: codes.map((c) => sha256(normalizeBackup(c))),
      lastCode: sha256(body.code.replace(/\s/g, "")),
      lastCodeAt: Date.now(),
    },
  });
  res.json({ user: publicUser(u), backupCodes: codes });
});

auth.post("/2fa/disable", requireAuth, codeLimit, async (req, res) => {
  const body = parse(disableSchema, req, res);
  if (!body) return;
  if (!tf(req.user).enabled) return bad(res, 400, "not_enabled", "Authenticator is not turned on.");
  if (!(await bcrypt.compare(body.password, req.user.passwordHash))) return bad(res, 401, "invalid_credentials", "Password is incorrect.");
  const r = await checkSecondFactor(req.user, body.code);
  if (!r.ok) return bad(res, 401, "invalid_code", "That code isn't right.");
  const u = await users().update(req.user.id, { twoFactor: { ...emptyTwoFactor } });
  res.json({ user: publicUser(u) });
});

auth.post("/2fa/backup-codes", requireAuth, codeLimit, async (req, res) => {
  const body = parse(codeSchema, req, res);
  if (!body) return;
  const r = await checkSecondFactor(req.user, body.code, { allowBackup: false });
  if (!r.ok) return bad(res, 401, "invalid_code", "That code isn't right.");
  const codes = makeBackupCodes();
  const u = await users().update(req.user.id, { twoFactor: { ...r.twoFactor, backupCodes: codes.map((c) => sha256(normalizeBackup(c))) } });
  res.json({ user: publicUser(u), backupCodes: codes });
});
