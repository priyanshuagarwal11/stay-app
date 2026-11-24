import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Where the StaySupply server runs.
 * - Set EXPO_PUBLIC_API_URL in .env to override (e.g. your deployed server).
 * - Otherwise, in development we use the same computer that runs `npx expo start`, port 4000,
 *   so the app on your phone finds the server on your Mac automatically.
 */
function resolveBaseUrl() {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, "");
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host) return `http://${host}:4000`;
  if (Platform.OS === "android") return "http://10.0.2.2:4000";
  return "http://localhost:4000";
}
export const API_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: opts.method ?? (opts.body ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
    });
  } catch {
    throw new ApiError(0, "network", `Can't reach the StaySupply server. Check your internet, or make sure the server is running (${API_URL}).`);
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "error", data.message ?? "Something went wrong. Please try again.");
  return data as T;
}
