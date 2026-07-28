"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useUiLocale } from "@/features/i18n/locale-context";
import type { UiMessageKey } from "@/features/i18n/messages";
import { ThemeToggle } from "@/features/theme/theme-provider";
import { APP_NAME_ENGLISH } from "@/lib/constants";

const PRIMARY_LINKS: Array<{ href: string; key: UiMessageKey; short: string }> = [
  { href: "/", key: "nav.home", short: "Home" },
  { href: "/quran", key: "nav.quran", short: "Quran" },
  { href: "/rules", key: "nav.rules", short: "Qawaid" },
  { href: "/duas", key: "nav.duas", short: "Duas" },
  { href: "/curriculum", key: "nav.unitWords", short: "Words" },
  { href: "/ayahs", key: "nav.unitAyahs", short: "Ayahs" },
];

const DESKTOP_LINKS: Array<{ href: string; key: UiMessageKey }> = [
  { href: "/quran", key: "nav.quran" },
  { href: "/duas", key: "nav.duas" },
  { href: "/rules", key: "nav.rules" },
  { href: "/curriculum", key: "nav.unitWords" },
  { href: "/ayahs", key: "nav.unitAyahs" },
  { href: "/vocabulary", key: "nav.myWords" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "var(--primary)" : "currentColor";
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke,
    strokeWidth: 1.8,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "/":
      return (
        <svg {...common}>
          <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" />
        </svg>
      );
    case "/quran":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
    case "/rules":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h10M4 18h14" />
          <path d="M18 10l2 2-2 2" />
        </svg>
      );
    case "/duas":
      return (
        <svg {...common}>
          <path d="M12 3v2" />
          <path d="M7 8c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5c0 2.2-1.5 3.5-3 4.5v2" />
          <path d="M10 18h4" />
          <path d="M9 21h6" />
        </svg>
      );
    case "/curriculum":
      return (
        <svg {...common}>
          <path d="M4 7h8a3 3 0 010 6H4" />
          <path d="M4 5v14" />
          <path d="M14 19l3.5-14H20" />
        </svg>
      );
    case "/ayahs":
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case "/vocabulary":
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z" />
        </svg>
      );
    default:
      return null;
  }
}

export function AppShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { t } = useUiLocale();
  const pathname = usePathname();

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="border-border/60 bg-surface/85 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link
            href="/"
            className="text-primary text-base font-medium tracking-tight sm:text-lg"
          >
            {APP_NAME_ENGLISH}
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav
              aria-label="Primary"
              className="text-muted hidden items-center gap-x-1 text-sm md:flex"
            >
              {DESKTOP_LINKS.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={t(link.key)}
                    aria-label={t(link.key)}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium"
                        : "hover:text-foreground hover:bg-primary/5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
                    }
                  >
                    <NavIcon name={link.href} active={active} />
                    <span className="hidden lg:inline">{t(link.key)}</span>
                  </Link>
                );
              })}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className={className}>{children}</div>

      <nav
        aria-label="Mobile"
        className="border-border/70 bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-0.5 py-1.5">
          {PRIMARY_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <li key={link.href} className="flex-1">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "text-primary flex flex-col items-center gap-0.5 rounded-lg bg-primary/10 px-0.5 py-1.5 text-[10px] font-semibold"
                      : "text-muted flex flex-col items-center gap-0.5 px-0.5 py-1.5 text-[10px]"
                  }
                >
                  <NavIcon name={link.href} active={active} />
                  <span>{link.short}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
