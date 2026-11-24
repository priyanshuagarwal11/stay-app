import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { getSecure, setSecure } from "@/lib/secure";

export type User = {
  id: string;
  name: string;
  email: string;
  property: string;
  phone: string;
  createdAt: string;
  twoFactorEnabled: boolean;
  backupCodesLeft: number;
};

type AuthOk = { status: "ok"; token: string; user: User; usedBackupCode?: boolean };
type LoginRes = AuthOk | { status: "mfa_required"; mfaToken: string };

type Ctx = {
  status: "loading" | "signedOut" | "signedIn";
  user: User | null;
  token: string | null;
  /** Pending sign-in waiting for an authenticator code. */
  mfaToken: string | null;
  signIn: (email: string, password: string) => Promise<"ok" | "mfa">;
  verifyCode: (code: string) => Promise<{ usedBackupCode: boolean }>;
  cancelMfa: () => void;
  signUp: (d: { name: string; email: string; password: string; property: string; phone: string }) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (u: User) => void;
  /** Calls an authenticated endpoint; signs out automatically if the session expired. */
  authed: <T>(path: string, opts?: { method?: string; body?: unknown }) => Promise<T>;
};

const AuthCtx = createContext<Ctx | null>(null);
const TOKEN_KEY = "staysupply.token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Ctx["status"]>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  const finish = useCallback(async (r: AuthOk) => {
    await setSecure(TOKEN_KEY, r.token);
    setToken(r.token);
    setUser(r.user);
    setMfaToken(null);
    setStatus("signedIn");
  }, []);

  const signOut = useCallback(async () => {
    await setSecure(TOKEN_KEY, null);
    setToken(null);
    setUser(null);
    setMfaToken(null);
    setStatus("signedOut");
  }, []);

  // Restore the session on app start.
  useEffect(() => {
    (async () => {
      const saved = await getSecure(TOKEN_KEY).catch(() => null);
      if (!saved) return setStatus("signedOut");
      try {
        const r = await api<{ user: User }>("/auth/me", { token: saved });
        setToken(saved);
        setUser(r.user);
        setStatus("signedIn");
      } catch (e) {
        // Keep the user out only if the token is really invalid; on network errors they can retry by signing in.
        if (e instanceof ApiError && e.status === 401) await setSecure(TOKEN_KEY, null);
        setStatus("signedOut");
      }
    })();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      status,
      user,
      token,
      mfaToken,
      signIn: async (email, password) => {
        const r = await api<LoginRes>("/auth/login", { body: { email, password } });
        if (r.status === "mfa_required") {
          setMfaToken(r.mfaToken);
          return "mfa";
        }
        await finish(r);
        return "ok";
      },
      verifyCode: async (code) => {
        if (!mfaToken) throw new ApiError(401, "mfa_expired", "Please sign in again.");
        const r = await api<AuthOk>("/auth/login/2fa", { body: { mfaToken, code } });
        await finish(r);
        return { usedBackupCode: !!r.usedBackupCode };
      },
      cancelMfa: () => setMfaToken(null),
      signUp: async (d) => finish(await api<AuthOk>("/auth/signup", { body: d })),
      signOut,
      setUser,
      authed: async <T,>(path: string, opts: { method?: string; body?: unknown } = {}) => {
        try {
          return await api<T>(path, { ...opts, token });
        } catch (e) {
          if (e instanceof ApiError && e.status === 401 && e.code === "unauthorized") await signOut();
          throw e;
        }
      },
    }),
    [status, user, token, mfaToken, finish, signOut],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Please try again.");
