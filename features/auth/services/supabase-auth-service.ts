import { createClient } from "@supabase/supabase-js";

import type { AuthService } from "@/features/auth/services/memory-auth-service";
import type { AuthResult, AuthSession, AuthUser } from "@/features/auth/types";

function toUser(raw: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  email_confirmed_at?: string | null;
}): AuthUser {
  return {
    id: raw.id,
    email: raw.email ?? "",
    displayName:
      typeof raw.user_metadata?.display_name === "string"
        ? raw.user_metadata.display_name
        : typeof raw.user_metadata?.full_name === "string"
          ? raw.user_metadata.full_name
          : null,
    emailConfirmed: Boolean(raw.email_confirmed_at),
  };
}

function toSession(data: {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null;
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
    email_confirmed_at?: string | null;
  };
}): AuthSession {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at ?? null,
    user: toUser(data.user),
  };
}

export function createSupabaseAuthService(options?: {
  url?: string;
  anonKey?: string;
}): AuthService {
  const url =
    options?.url ??
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    options?.anonKey ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase URL and anon key are required for AuthService");
  }

  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return {
    async signUp({ email, password, displayName }) {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName ?? null },
        },
      });
      if (error || !data.session) {
        return {
          ok: false,
          error:
            error?.message ?? "سائن اپ ناکام۔ ای میل تصدیق درکار ہو سکتی ہے۔",
        };
      }
      return {
        ok: true,
        session: toSession(data.session),
        message: data.user?.email_confirmed_at
          ? undefined
          : "تصدیقی ای میل بھیج دی گئی ہے",
      };
    },

    async signIn({ email, password }) {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.session) {
        return { ok: false, error: error?.message ?? "سائن ان ناکام" };
      }
      return { ok: true, session: toSession(data.session) };
    },

    async signOut(accessToken) {
      if (!accessToken) {
        return { ok: true };
      }
      const authed = createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await authed.auth.signOut();
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    },

    async resetPassword(email) {
      const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/reset`;
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) {
        return { ok: false, error: error.message };
      }
      return {
        ok: true,
        message:
          "اگر اکاؤنٹ موجود ہے تو پاس ورڈ ری سیٹ کی ہدایات بھیج دی گئیں۔",
      };
    },

    async getSessionFromToken(accessToken) {
      const { data, error } = await client.auth.getUser(accessToken);
      if (error || !data.user) {
        return null;
      }
      return {
        accessToken,
        refreshToken: "",
        expiresAt: null,
        user: toUser(data.user),
      };
    },

    async getGoogleSignInUrl(redirectTo) {
      const { data, error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error || !data.url) {
        return {
          ok: false,
          error: error?.message ?? "Google سائن ان دستیاب نہیں",
        };
      }
      return { ok: true, url: data.url };
    },
  };
}

export type { AuthResult };
