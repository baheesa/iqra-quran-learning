# Fonts

## Required (AGENTS.md)

| File | Role |
|------|------|
| `IndoPakQuran.ttf` (+ optional `.woff2`) | Quran — Indo-Pak / Taj-style nastaleeq |
| `JameelNooriNastaleeqRegular.ttf` | Urdu UI — Jameel Noori Nastaleeq (preferred when licensed file is available) |

## Currently bundled

- **IndoPak Quran** (`IndoPakQuran.ttf` / `.woff2`) — Indo-Pak nastaleeq (same family style as Pakistani printed mushafs such as Taj Company).
- **Noto Nastaliq Urdu** (`.woff` / `.woff2`) — open-licensed Urdu face used until the licensed Jameel file is added.

Place your licensed `JameelNooriNastaleeqRegular.ttf` here, then restore the `@font-face` block in `app/globals.css` and put Jameel first in `--font-urdu`.
