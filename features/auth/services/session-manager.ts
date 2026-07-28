import type { AuthService } from "@/features/auth/services/memory-auth-service";
import { createMemoryAuthService } from "@/features/auth/services/memory-auth-service";
import { createSupabaseAuthService } from "@/features/auth/services/supabase-auth-service";
import type { AuthSession } from "@/features/auth/types";

/**
 * SessionManager — guest vs authenticated identity.
 * Does not alter Learning Engine behaviour.
 */
export function createSessionManager(auth: AuthService) {
  return {
    isGuest(session: AuthSession | null): boolean {
      return session === null;
    },

    async resolve(accessToken: string | null | undefined): Promise<{
      guest: boolean;
      session: AuthSession | null;
    }> {
      if (!accessToken) {
        return { guest: true, session: null };
      }
      const session = await auth.getSessionFromToken(accessToken);
      if (!session) {
        return { guest: true, session: null };
      }
      return { guest: false, session };
    },

    requireAuth(session: AuthSession | null): AuthSession {
      if (!session) {
        throw new Error("سائن ان درکار ہے");
      }
      return session;
    },
  };
}

export type SessionManager = ReturnType<typeof createSessionManager>;

export function createAuthServiceFromEnv(options?: {
  forceMemory?: boolean;
}): AuthService {
  if (
    options?.forceMemory ||
    process.env.AUTH_PROVIDER === "memory" ||
    process.env.NODE_ENV === "test"
  ) {
    return createMemoryAuthService();
  }

  try {
    return createSupabaseAuthService();
  } catch {
    return createMemoryAuthService();
  }
}
