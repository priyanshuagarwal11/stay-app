import { config } from "../config.js";

/**
 * User storage. Uses MongoDB when MONGODB_URI is set; otherwise a local JSON file
 * (development only, so you can try the app without setting up a database).
 *
 * User: { id, name, email, property, phone, passwordHash, createdAt,
 *         twoFactor: { enabled, secretEnc, pendingSecretEnc, backupCodes: [sha256], lastCode, lastCodeAt } }
 */
let store;

export async function initStore() {
  if (config.mongoUri) {
    const { mongoStore } = await import("./mongo.js");
    store = await mongoStore(config.mongoUri);
    console.log("[store] Connected to MongoDB");
  } else {
    if (config.isProd) throw new Error("MONGODB_URI must be set in production.");
    const { fileStore } = await import("./file.js");
    store = await fileStore(process.env.DEV_DB_FILE || "data/dev-db.json");
    console.warn("[store] MONGODB_URI not set — using local file data/dev-db.json (development only).");
  }
  return store;
}

export const users = () => {
  if (!store) throw new Error("Store not initialised");
  return store;
};
