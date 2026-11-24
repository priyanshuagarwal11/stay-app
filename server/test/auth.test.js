import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { generate } from "otplib";

const dbFile = path.join(os.tmpdir(), `ss-test-${process.pid}.json`);
process.env.DEV_DB_FILE = dbFile;

const { initStore } = await import("../src/store/index.js");
const { createApp } = await import("../src/app.js");

let server, base;
before(async () => {
  await initStore();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server.close();
  fs.rmSync(dbFile, { force: true });
});

const call = async (method, url, body, token) => {
  const r = await fetch(base + url, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.json() };
};

const nextStepCode = (secret) => generate({ secret, epoch: Math.floor(Date.now() / 1000) + 30 });

test("full sign-up, authenticator and sign-in flow", async () => {
  const creds = { email: "Owner@Haveli.in", password: "restock2026" };

  let r = await call("POST", "/auth/signup", { name: "Priya", property: "Haveli Homestay", ...creds, password: "short" });
  assert.equal(r.status, 400);

  r = await call("POST", "/auth/signup", { name: "Priya", property: "Haveli Homestay", ...creds });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.email, "owner@haveli.in");
  assert.equal(r.body.user.twoFactorEnabled, false);
  assert.ok(!("passwordHash" in r.body.user));
  let token = r.body.token;

  r = await call("POST", "/auth/signup", { name: "Xavier", ...creds });
  assert.equal(r.status, 409);

  r = await call("POST", "/auth/login", { ...creds, password: "wrongpass1" });
  assert.equal(r.status, 401);

  r = await call("GET", "/auth/me", null, "garbage");
  assert.equal(r.status, 401);

  // Set up authenticator
  r = await call("POST", "/auth/2fa/setup", null, token);
  assert.equal(r.status, 200);
  assert.match(r.body.otpauthUrl, /^otpauth:\/\/totp\/StaySupply/);
  assert.match(r.body.qrDataUrl, /^data:image\/png;base64,/);
  const secret = r.body.secret;

  r = await call("POST", "/auth/2fa/enable", { code: "000000" }, token);
  assert.equal(r.status, 401);

  r = await call("POST", "/auth/2fa/enable", { code: await generate({ secret }) }, token);
  assert.equal(r.status, 200);
  assert.equal(r.body.user.twoFactorEnabled, true);
  assert.equal(r.body.backupCodes.length, 8);
  const backup = r.body.backupCodes;

  // Secret is not stored in plain text
  assert.ok(!fs.readFileSync(dbFile, "utf8").includes(secret));

  // Password alone is no longer enough
  r = await call("POST", "/auth/login", creds);
  assert.equal(r.body.status, "mfa_required");
  assert.ok(!r.body.token);
  const mfaToken = r.body.mfaToken;

  // mfa token can't be used as an access token
  r = await call("GET", "/auth/me", null, mfaToken);
  assert.equal(r.status, 401);

  r = await call("POST", "/auth/login/2fa", { mfaToken, code: "123456" });
  assert.equal(r.status, 401);

  const code = await nextStepCode(secret);
  r = await call("POST", "/auth/login/2fa", { mfaToken, code });
  assert.equal(r.status, 200);
  token = r.body.token;

  // Same code can't be replayed
  r = await call("POST", "/auth/login/2fa", { mfaToken, code });
  assert.equal(r.status, 401);

  // Backup code works once
  r = await call("POST", "/auth/login/2fa", { mfaToken, code: backup[0].toLowerCase() });
  assert.equal(r.status, 200);
  assert.equal(r.body.usedBackupCode, true);
  assert.equal(r.body.user.backupCodesLeft, 7);
  r = await call("POST", "/auth/login/2fa", { mfaToken, code: backup[0] });
  assert.equal(r.status, 401);

  r = await call("GET", "/auth/me", null, token);
  assert.equal(r.body.user.name, "Priya");

  r = await call("PATCH", "/auth/me", { property: "Haveli Homestay, Jaipur" }, token);
  assert.equal(r.body.user.property, "Haveli Homestay, Jaipur");

  // Turn off needs password + code
  r = await call("POST", "/auth/2fa/disable", { password: "wrongpass1", code: backup[1] }, token);
  assert.equal(r.status, 401);
  r = await call("POST", "/auth/2fa/disable", { password: creds.password, code: backup[1] }, token);
  assert.equal(r.status, 200);
  assert.equal(r.body.user.twoFactorEnabled, false);

  r = await call("POST", "/auth/login", creds);
  assert.equal(r.body.status, "ok");
  assert.ok(r.body.token);
});
