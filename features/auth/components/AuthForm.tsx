"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { saveClientSession } from "@/features/auth/client/session-store";
import { MergeProgressDialog } from "@/features/auth/components/MergeProgressDialog";
import type { AuthSession } from "@/features/auth/types";

type Mode = "login" | "register" | "forgot";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMerge, setShowMerge] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      if (mode === "forgot") {
        const response = await fetch("/api/v1/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = (await response.json()) as {
          message?: string;
          error?: string;
        };
        if (!response.ok) {
          setError(data.error ?? "ناکام");
          return;
        }
        setMessage(data.message ?? "ہدایات بھیج دی گئیں");
        return;
      }

      const endpoint =
        mode === "register" ? "/api/v1/auth/signup" : "/api/v1/auth/signin";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || undefined,
        }),
      });
      const data = (await response.json()) as {
        session?: AuthSession;
        error?: string;
        message?: string;
        migrationHint?: boolean;
      };
      if (!response.ok || !data.session) {
        setError(data.error ?? "ناکام");
        return;
      }
      saveClientSession(data.session);
      setMessage(data.message ?? "کامیاب");
      if (data.migrationHint) {
        setShowMerge(true);
      } else {
        router.push("/auth/profile");
      }
    });
  }

  return (
    <>
      <form onSubmit={submit} className="mx-auto max-w-md space-y-4">
        <h1 className="text-primary text-3xl">
          {mode === "login"
            ? "سائن ان"
            : mode === "register"
              ? "نیا اکاؤنٹ"
              : "پاس ورڈ بھول گئے؟"}
        </h1>
        <p className="text-muted text-sm">
          مہمان موڈ میں قراءت جاری رکھ سکتے ہیں۔ اکاؤنٹ صرف ہم آہنگی کے لیے ہے۔
        </p>

        {mode === "register" ? (
          <label className="block space-y-1">
            <span>نام (اختیاری)</span>
            <input
              className="border-border bg-surface w-full rounded-2xl border p-3"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
        ) : null}

        <label className="block space-y-1">
          <span>ای میل</span>
          <input
            type="email"
            required
            dir="ltr"
            className="border-border bg-surface w-full rounded-2xl border p-3 text-left"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        {mode !== "forgot" ? (
          <label className="block space-y-1">
            <span>پاس ورڈ</span>
            <input
              type="password"
              required
              minLength={6}
              dir="ltr"
              className="border-border bg-surface w-full rounded-2xl border p-3 text-left"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-on-primary w-full rounded-2xl px-4 py-3 disabled:opacity-50"
        >
          {mode === "forgot" ? "ہدایات بھیجیں" : "جاری رکھیں"}
        </button>

        {error ? <p className="text-warning text-sm">{error}</p> : null}
        {message ? <p className="text-muted text-sm">{message}</p> : null}

        <div className="text-muted flex flex-wrap gap-3 text-sm">
          {mode !== "login" ? (
            <Link href="/auth/login">سائن ان</Link>
          ) : (
            <Link href="/auth/register">نیا اکاؤنٹ</Link>
          )}
          {mode !== "forgot" ? (
            <Link href="/auth/forgot">پاس ورڈ بھول گئے؟</Link>
          ) : null}
          <Link href="/">مہمان کے طور پر جاری رکھیں</Link>
        </div>
      </form>

      <MergeProgressDialog
        open={showMerge}
        onClose={() => {
          setShowMerge(false);
          router.push("/auth/profile");
        }}
        onDone={(note) => setMessage(note)}
      />
    </>
  );
}
