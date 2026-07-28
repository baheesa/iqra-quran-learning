import { AppShell } from "@/features/i18n/AppShell";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-static";

async function loadManualMarkdown(): Promise<string> {
  const filePath = path.join(
    process.cwd(),
    "docs",
    "learner",
    "features-manual.md",
  );
  return readFile(filePath, "utf8");
}

/** Very small markdown → HTML for the learner manual (headings + lists + tables). */
function renderManual(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  let inTable = false;

  function closeList() {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("|")) {
      closeList();
      if (!inTable) {
        inTable = true;
        out.push('<table class="w-full text-sm border-collapse my-3">');
      }
      if (/^\|?\s*-+/.test(line.replace(/\|/g, " "))) continue;
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      out.push(
        `<tr>${cells
          .map(
            (c) =>
              `<td class="border-border border px-2 py-1.5 text-start">${escapeHtml(c)}</td>`,
          )
          .join("")}</tr>`,
      );
      continue;
    }
    if (inTable) {
      out.push("</table>");
      inTable = false;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      out.push(
        `<h1 class="text-primary text-2xl font-medium mt-2 mb-3">${escapeHtml(line.slice(2))}</h1>`,
      );
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      out.push(
        `<h2 class="text-primary text-lg font-medium mt-6 mb-2">${escapeHtml(line.slice(3))}</h2>`,
      );
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        out.push('<ul class="list-disc pe-5 space-y-1 text-sm leading-relaxed">');
        inList = true;
      }
      out.push(`<li>${formatInline(line.slice(2))}</li>`);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      closeList();
      out.push(
        `<p class="text-sm leading-relaxed my-1">${formatInline(line)}</p>`,
      );
      continue;
    }
    if (line.startsWith("---")) {
      closeList();
      out.push('<hr class="border-border my-5" />');
      continue;
    }
    closeList();
    out.push(
      `<p class="text-foreground/90 text-sm leading-relaxed my-2">${formatInline(line)}</p>`,
    );
  }
  closeList();
  if (inTable) out.push("</table>");
  return out.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="text-xs bg-primary/10 rounded px-1">$1</code>');
}

export default async function HelpPage() {
  const md = await loadManualMarkdown();
  const html = renderManual(md);

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
        <article
          className="border-border bg-surface/90 rounded-2xl border px-4 py-5 sm:px-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </AppShell>
  );
}
