import type { AuthResult, AuthSession, AuthUser } from "@/features/auth/types";

export type AuthService = {
  signUp(input: {
    email: string;
    password: string;
    displayName?: string;
  }): Promise<AuthResult>;
  signIn(input: { email: string; password: string }): Promise<AuthResult>;
  signOut(
    accessToken?: string,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
  resetPassword(
    email: string,
  ): Promise<{ ok: true; message: string } | { ok: false; error: string }>;
  getSessionFromToken(accessToken: string): Promise<AuthSession | null>;
  getGoogleSignInUrl(
    redirectTo: string,
  ): Promise<{ ok: true; url: string } | { ok: false; error: string }>;
};

type MemoryAccount = {
  password: string;
  user: AuthUser;
  session: AuthSession | null;
};

/**
 * In-memory auth for tests and local development without Supabase.
 */
export function createMemoryAuthService(): AuthService {
  const accounts = new Map<string, MemoryAccount>();
  const tokens = new Map<string, string>(); // accessToken -> email

  function issueSession(user: AuthUser): AuthSession {
    const accessToken = `mem_${user.id}_${Date.now()}`;
    const refreshToken = `ref_${user.id}_${Date.now()}`;
    const session: AuthSession = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
      user,
    };
    tokens.set(accessToken, user.email.toLowerCase());
    return session;
  }

  return {
    async signUp({ email, password, displayName }) {
      const key = email.toLowerCase().trim();
      if (!key || password.length < 6) {
        return {
          ok: false,
          error: "ای میل اور کم از کم ۶ حرف کا پاس ورڈ درکار ہے",
        };
      }
      if (accounts.has(key)) {
        return { ok: false, error: "یہ ای میل پہلے سے موجود ہے" };
      }
      const user: AuthUser = {
        id: `user_${accounts.size + 1}`,
        email: key,
        displayName: displayName ?? null,
        emailConfirmed: true,
      };
      const session = issueSession(user);
      accounts.set(key, { password, user, session });
      return {
        ok: true,
        session,
        message: "اکاؤنٹ بن گیا۔ مہمان ڈیٹا محفوظ رکھنے کے لیے ضم کریں۔",
      };
    },

    async signIn({ email, password }) {
      const key = email.toLowerCase().trim();
      const account = accounts.get(key);
      if (!account || account.password !== password) {
        return { ok: false, error: "ای میل یا پاس ورڈ غلط ہے" };
      }
      const session = issueSession(account.user);
      account.session = session;
      return { ok: true, session };
    },

    async signOut(accessToken) {
      if (accessToken) {
        tokens.delete(accessToken);
      }
      return { ok: true };
    },

    async resetPassword(email) {
      const key = email.toLowerCase().trim();
      if (!accounts.has(key)) {
        // Do not reveal account existence
        return {
          ok: true,
          message:
            "اگر اکاؤنٹ موجود ہے تو پاس ورڈ ری سیٹ کی ہدایات بھیج دی گئیں۔",
        };
      }
      return {
        ok: true,
        message: "پاس ورڈ ری سیٹ کی ہدایات بھیج دی گئیں (ڈویلپمنٹ موڈ)۔",
      };
    },

    async getSessionFromToken(accessToken) {
      const email = tokens.get(accessToken);
      if (!email) return null;
      const account = accounts.get(email);
      if (!account) return null;
      return {
        accessToken,
        refreshToken: account.session?.refreshToken ?? "",
        expiresAt: Date.now() + 1000 * 60 * 60,
        user: account.user,
      };
    },

    async getGoogleSignInUrl(redirectTo) {
      return {
        ok: true,
        url: `${redirectTo}?provider=google&memory=1`,
      };
    },
  };
}
