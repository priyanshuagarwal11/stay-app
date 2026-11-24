import { verifyToken } from "../lib/tokens.js";
import { users } from "../store/index.js";

export async function requireAuth(req, res, next) {
  const h = req.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const id = token && verifyToken(token, "access");
  const user = id && (await users().findById(id));
  if (!user) return res.status(401).json({ error: "unauthorized", message: "Please sign in again." });
  req.user = user;
  next();
}
