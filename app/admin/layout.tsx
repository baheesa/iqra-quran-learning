import Link from "next/link";

import { isAdminOpenLocalEnabled } from "@/lib/security/admin-open-local";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const openLocal = isAdminOpenLocalEnabled();
  const isProd = process.env.NODE_ENV === "production";

  return (
    <div>
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:bg-surface focus:text-foreground focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:px-3 focus:py-2"
      >
        مین مواد پر جائیں
      </a>
      <div className="border-border bg-surface/90 border-b px-4 py-2 text-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          <p className="text-muted">
            منتظم علاقہ — صرف تصدیق شدہ علم شائع ہوتا ہے۔
            {isProd
              ? " پروڈکشن میں ADMIN_OPEN_LOCAL بند ہے۔"
              : openLocal
                ? " ADMIN_OPEN_LOCAL فعال (مقامی)۔"
                : " عمل کے لیے سٹاف لاگ اِن / رول درکار ہے۔"}
          </p>
          <nav className="flex flex-wrap gap-3" aria-label="منتظم نیویگیشن">
            <Link href="/admin" className="text-primary">
              ڈیش بورڈ
            </Link>
            <Link href="/admin/knowledge" className="text-primary">
              کتب
            </Link>
            <Link href="/admin/search" className="text-primary">
              تلاش
            </Link>
            <Link href="/auth/login" className="text-muted">
              لاگ اِن
            </Link>
          </nav>
        </div>
      </div>
      <div id="admin-main">{children}</div>
    </div>
  );
}
