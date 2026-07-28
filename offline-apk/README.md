# Iqra (mobile companion APK)

Independent Android companion for the Quran Learning App.

The main Next.js web app stays at the repo root.
This folder only builds the mobile app named **Iqra**.

## Preview on your laptop (before phone install)

```bash
cd offline-apk
npm run sync:data
npm run dev
```

Open: **http://localhost:5173**

Use Chrome DevTools → device toolbar for a phone-sized view.

## Install APK

`dist-apk/quran-learn-offline-debug.apk` (rebuild after UI changes with `npm run apk:debug`)

## Name ideas (one word)

| Name | Why |
|------|-----|
| **Iqra** (chosen) | “Read” — matches reading-first mission |
| Nur | Light / guidance |
| Fahm | Understanding |
| Muallim | Ties to curriculum |
| Ayat | Verses |

## Rebuild

```bash
npm run apk:debug
```
