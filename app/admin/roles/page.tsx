"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authHeaders } from "@/features/auth/client/session-store";
import type { StaffMembership, StaffRole } from "@/features/admin/types";

export default function AdminRolesPage() {
  const [memberships, setMemberships] = useState<StaffMembership[]>([]);
  const [email, setEmail] = useState("");
  const [authUserId, setAuthUserId] = useState("");
  const [role, setRole] = useState<StaffRole>("REVIEWER");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/v1/admin/roles", {
      headers: { ...authHeaders() },
    });
    const payload = (await response.json()) as {
      success: boolean;
      data?: StaffMembership[];
      error?: { message: string };
    };
    if (!response.ok || !payload.success) {
      setMessage(payload.error?.message ?? "Failed to load roles");
      return;
    }
    setMemberships(payload.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function assign(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/v1/admin/roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ email, authUserId, role }),
    });
    const payload = (await response.json()) as {
      success: boolean;
      message?: string;
      error?: { message: string };
    };
    if (!response.ok || !payload.success) {
      setMessage(payload.error?.message ?? "Failed");
      return;
    }
    setMessage(payload.message ?? "Assigned");
    setEmail("");
    setAuthUserId("");
    await load();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8" dir="rtl">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-muted text-sm">منتظم</p>
          <h1 className="text-primary text-2xl">کردار و اجازتیں</h1>
        </div>
        <Link href="/admin" className="text-muted text-sm">
          ڈیش بورڈ
        </Link>
      </header>

      <form
        onSubmit={(event) => void assign(event)}
        className="border-border bg-surface/80 mb-6 space-y-3 rounded-2xl border p-4"
      >
        <input
          className="border-border bg-background w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="ای میل"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          dir="ltr"
        />
        <input
          className="border-border bg-background w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="authUserId"
          value={authUserId}
          onChange={(event) => setAuthUserId(event.target.value)}
          dir="ltr"
        />
        <select
          className="border-border bg-background w-full rounded-xl border px-3 py-2 text-sm"
          value={role}
          onChange={(event) => setRole(event.target.value as StaffRole)}
          dir="ltr"
        >
          <option value="ADMIN">ADMIN</option>
          <option value="REVIEWER">REVIEWER</option>
          <option value="VIEWER">VIEWER</option>
        </select>
        <button
          type="submit"
          className="border-border bg-surface rounded-xl border px-4 py-2 text-sm"
        >
          تفویض کریں
        </button>
        {message ? <p className="text-muted text-sm">{message}</p> : null}
      </form>

      <ul className="space-y-2 text-sm">
        {memberships.map((item) => (
          <li
            key={item.id}
            className="border-border flex justify-between gap-2 rounded-xl border px-3 py-3"
          >
            <span dir="ltr">
              {item.email} · {item.role}
            </span>
            <span className="text-muted" dir="ltr">
              {item.authUserId}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
