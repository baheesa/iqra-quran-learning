import { AppShell } from "@/features/i18n/AppShell";
import Link from "next/link";

export const dynamic = "force-static";

const LIVE = "https://iqra-quran-learning-eight.vercel.app";
const APK = "/downloads/iqra-quran-learning.apk";
const REPO = "https://github.com/baheesa/iqra-quran-learning";
const PDF =
  "https://github.com/baheesa/iqra-quran-learning/blob/main/docs/Quran-Learning-System-User-Manual.pdf";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Daily habit (15–20 minutes)",
    body: [
      "Open Quran and read a page calmly.",
      "Tap any word you are unsure about — its Urdu tip appears on the word.",
      "Mark unit words / ayahs / qawaid as you become familiar.",
      "Optionally revise My words, Qawaid, or a short dua.",
    ],
  },
  {
    title: "Quran (mushaf)",
    body: [
      "Indo-Pak script with page, juz, and surah navigation.",
      "Tap a word for a short Urdu meaning tip. Tap elsewhere to dismiss.",
      "Search Arabic or Urdu; open a match on the mushaf with highlight.",
      "Optional ayah Urdu on demand — recognition first, translation second.",
      "Bookmarks and last page are remembered on this device.",
    ],
  },
  {
    title: "Qawaid, words, ayahs, duas",
    body: [
      "Qawaid: short Muallim-ul-Quran patterns (units 1–7) with examples.",
      "Unit words & ayahs: curriculum practice; mark familiar as you recognize them.",
      "Duas: masnoon daily moments + Qur’anic duas by juz; mark memorized when ready.",
      "My words: personal list of words you tapped while reading.",
    ],
  },
  {
    title: "Tips for better learning",
    body: [
      "Prefer reading over collecting tips.",
      "Use tips to confirm, not to replace thinking.",
      "Return to the same pages until words feel familiar.",
      "Use Qawaid when a pattern repeats and you want the short rule.",
    ],
  },
];

export default function HelpPage() {
  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
        <header className="space-y-2">
          <p className="text-muted text-xs tracking-wide uppercase">Help</p>
          <h1 className="text-primary text-2xl font-medium">How to use Iqra</h1>
          <p className="text-foreground/90 text-sm leading-relaxed">
            Read the Quran, recognize words, and depend less on translation. Full
            write-up with screenshots lives in the project README on GitHub.
          </p>
        </header>

        <section className="border-primary/25 from-primary/[0.08] rounded-2xl border bg-gradient-to-br to-surface/95 px-4 py-4 sm:px-5">
          <p className="text-primary text-sm font-medium">Quick links</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap">
            <li>
              <a
                href={LIVE}
                target="_blank"
                rel="noreferrer"
                className="bg-primary text-surface inline-flex min-h-10 items-center justify-center rounded-lg px-3.5 font-medium"
              >
                Open live app
              </a>
            </li>
            <li>
              <a
                href={APK}
                download
                className="border-border text-primary inline-flex min-h-10 items-center justify-center rounded-lg border px-3.5 font-medium"
              >
                Download Android APK
              </a>
            </li>
            <li>
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="border-border text-primary inline-flex min-h-10 items-center justify-center rounded-lg border px-3.5 font-medium"
              >
                GitHub source
              </a>
            </li>
            <li>
              <Link
                href="/"
                className="border-border text-primary inline-flex min-h-10 items-center justify-center rounded-lg border px-3.5 font-medium"
              >
                Back to Home
              </Link>
            </li>
          </ul>
          <p className="text-muted mt-3 text-xs leading-relaxed">
            Full guide with screenshots:{" "}
            <a
              href={`${REPO}#readme`}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              README on GitHub
            </a>
            {" · "}
            <a
              href={PDF}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              PDF user manual
            </a>
            .
          </p>
        </section>

        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="border-border bg-surface/90 rounded-2xl border px-4 py-4 sm:px-5"
          >
            <h2 className="text-primary text-lg font-medium">{section.title}</h2>
            <ul className="mt-2 list-disc space-y-1 pe-5 text-sm leading-relaxed">
              {section.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}

        <section className="border-border bg-surface/90 rounded-2xl border px-4 py-4 sm:px-5">
          <h2 className="text-primary text-lg font-medium">Web vs offline</h2>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Web needs the server for some features. The APK bundles mushaf and
            curriculum data so you can read offline. Progress stays on this
            device in both cases.
          </p>
        </section>
      </main>
    </AppShell>
  );
}
