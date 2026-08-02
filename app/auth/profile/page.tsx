"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  authHeaders,
  clearClientSession,
  loadClientSession,
} from "@/features/auth/client/session-store";
import { OfflineIndicator } from "@/features/auth/components/OfflineIndicator";
import { SyncStatusBar } from "@/features/auth/components/SyncStatusBar";
import type { AuthUser } from "@/features/auth/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [guest, setGuest] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const session = loadClientSession();
    if (!session) {
      setGuest(true);
      setUser(null);
      return;
    }
    startTransition(async () => {
      const response = await fetch("/api/v1/auth/profile", {
        headers: authHeaders(),
      });
      const data = (await response.json()) as {
        guest: boolean;
        user: AuthUser | null;
      };
      setGuest(data.guest);
      setUser(data.user);
    });
  }, []);

  function signOut() {
    startTransition(async () => {
      await fetch("/api/v1/auth/signout", {
        method: "POST",
        headers: authHeaders(),
      });
      clearClientSession();
      router.push("/");
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg space-y-6 px-6 py-12">
      <div>
        <p className="text-muted text-sm">اکاؤنٹ</p>
        <h1 className="text-primary text-4xl">پروفائل</h1>
      </div>

      <OfflineIndicator />
      <SyncStatusBar />

      {guest || !user ? (
        <div className="space-y-3">
          <p>آپ مہمان موڈ میں ہیں۔ قراءت بغیر اکاؤنٹ کے جاری رہ سکتی ہے۔</p>
          <Link
            href="/auth/login"
            className="bg-primary text-on-primary inline-block rounded-2xl px-5 py-3"
          >
            سائن ان
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p>
            {user.displayName ?? "متعلم"} · <span dir="ltr">{user.email}</span>
          </p>
          <p className="text-muted text-sm">
            ای میل تصدیق: {user.emailConfirmed ? "ہاں" : "زیر التوا"}
          </p>
          <button
            type="button"
            className="border-border rounded-2xl border px-5 py-3"
            disabled={pending}
            onClick={signOut}
          >
            سائن آؤٹ
          </button>
        </div>
      )}

      <div className="flex gap-4 text-sm">
        <Link href="/">Home</Link>
        <Link href="/quran">Quran</Link>
        <Link href="/">صفحہ اول</Link>
      </div>
    </main>
  );
}
