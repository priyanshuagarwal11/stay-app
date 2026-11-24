import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const signAccess = (userId) =>
  jwt.sign({ sub: userId, typ: "access" }, config.jwtSecret, { expiresIn: config.accessTokenTtl });

export const signMfa = (userId) =>
  jwt.sign({ sub: userId, typ: "mfa" }, config.jwtSecret, { expiresIn: config.mfaTokenTtl });

/** Returns the user id, or null if the token is invalid, expired or of the wrong type. */
export function verifyToken(token, typ) {
  try {
    const p = jwt.verify(token, config.jwtSecret);
    return p && typeof p === "object" && p.typ === typ ? String(p.sub) : null;
  } catch {
    return null;
  }
}
