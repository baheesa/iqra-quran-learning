const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

function ascii(s) {
  return String(s)
    .replace(/[–—−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/•/g, '-')
    .replace(/→/g, '->')
    .replace(/…/g, '...')
    .replace(/[^\x00-\x7F]/g, '');
}

async function main() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28, H = 841.89, margin = 42;
  const maxW = W - margin * 2;
  const green = rgb(0.12, 0.29, 0.22);
  const greenSoft = rgb(0.93, 0.96, 0.94);
  const border = rgb(0.72, 0.80, 0.75);
  const ink = rgb(0.15, 0.15, 0.15);
  const mute = rgb(0.4, 0.4, 0.4);
  const cardBg = rgb(0.985, 0.985, 0.978);
  const accent = rgb(0.94, 0.96, 0.93);

  // Tablet frame size in PDF points (same for every UI shot)
  const TABLET_W = 250;
  const TABLET_H = 360; // ~820x1180 aspect

  let page = pdf.addPage([W, H]);
  let y = H - margin;
  let pageNo = 1;

  function footer() {
    page.drawText(ascii('Quran Learning App - User Manual'), { x: margin, y: 18, size: 8, font, color: mute });
    const t = String(pageNo);
    page.drawText(t, { x: W - margin - font.widthOfTextAtSize(t, 8), y: 18, size: 8, font, color: mute });
  }
  function newPage() { footer(); page = pdf.addPage([W, H]); pageNo++; y = H - margin; }
  function ensure(space) { if (y - space < margin + 28) newPage(); }
  function wrap(text, size, f, width = maxW) {
    text = ascii(text);
    const words = text.split(/\s+/);
    const lines = []; let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (f.widthOfTextAtSize(test, size) > width && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function title(t) {
    ensure(28);
    page.drawText(ascii(t), { x: margin, y: y - 17, size: 17, font: fontBold, color: green });
    y -= 26;
  }
  function h(t) {
    y -= 4; ensure(20);
    page.drawText(ascii(t), { x: margin, y: y - 12, size: 12.5, font: fontBold, color: green });
    y -= 18;
  }
  function p(t, size = 10) {
    for (const line of wrap(t, size, font)) {
      ensure(12.5);
      page.drawText(line, { x: margin, y: y - size, size, font, color: ink });
      y -= 12.5;
    }
    y -= 2;
  }
  function bullet(t) {
    for (const [i, line] of wrap(t, 9.6, font, maxW - 12).entries()) {
      ensure(12);
      page.drawText((i === 0 ? '-  ' : '   ') + line, { x: margin, y: y - 9.6, size: 9.6, font, color: ink });
      y -= 12;
    }
  }

  function card(titleText, badge, lines, fill = cardBg) {
    const padX = 9, padY = 8, tSize = 10.2, bSize = 9.2;
    const body = [];
    for (const raw of lines) body.push(...wrap(raw, bSize, font, maxW - padX * 2 - 8));
    const boxH = padY * 2 + tSize + 5 + (badge ? 13 : 0) + body.length * 11.2;
    ensure(boxH + 6);
    page.drawRectangle({ x: margin, y: y - boxH, width: maxW, height: boxH, color: fill, borderColor: border, borderWidth: 0.8 });
    page.drawRectangle({ x: margin, y: y - boxH, width: 3.2, height: boxH, color: green });
    let ty = y - padY - tSize;
    page.drawText(ascii(titleText), { x: margin + padX + 4, y: ty, size: tSize, font: fontBold, color: green });
    ty -= tSize + 3;
    if (badge) {
      const bw = fontBold.widthOfTextAtSize(ascii(badge), 7.5) + 8;
      page.drawRectangle({ x: margin + padX + 4, y: ty - 1, width: bw, height: 11, color: greenSoft });
      page.drawText(ascii(badge), { x: margin + padX + 8, y: ty + 1.5, size: 7.5, font: fontBold, color: green });
      ty -= 13;
    }
    for (const line of body) {
      page.drawText(line, { x: margin + padX + 4, y: ty, size: bSize, font, color: ink });
      ty -= 11.2;
    }
    y -= boxH + 7;
  }

  function pair(a, b) {
    const gap = 8, colW = (maxW - gap) / 2;
    const padX = 7, padY = 7, tSize = 9.6, bSize = 8.5;
    function measure(c) {
      const body = [];
      for (const raw of c.lines) body.push(...wrap(raw, bSize, font, colW - padX * 2 - 4));
      return { body, h: padY * 2 + tSize + 4 + (c.badge ? 12 : 0) + body.length * 10.5 };
    }
    const L = measure(a), R = measure(b);
    const boxH = Math.max(L.h, R.h);
    ensure(boxH + 6);
    function paint(c, x, m) {
      page.drawRectangle({ x, y: y - boxH, width: colW, height: boxH, color: c.fill || cardBg, borderColor: border, borderWidth: 0.75 });
      page.drawRectangle({ x, y: y - boxH, width: 2.8, height: boxH, color: green });
      let ty = y - padY - tSize;
      page.drawText(ascii(c.title), { x: x + padX + 3, y: ty, size: tSize, font: fontBold, color: green });
      ty -= tSize + 3;
      if (c.badge) {
        const bw = fontBold.widthOfTextAtSize(ascii(c.badge), 7) + 7;
        page.drawRectangle({ x: x + padX + 3, y: ty - 1, width: bw, height: 10, color: greenSoft });
        page.drawText(ascii(c.badge), { x: x + padX + 6.5, y: ty + 1, size: 7, font: fontBold, color: green });
        ty -= 12;
      }
      for (const line of m.body) {
        page.drawText(line, { x: x + padX + 3, y: ty, size: bSize, font, color: ink });
        ty -= 10.5;
      }
    }
    paint(a, margin, L);
    paint(b, margin + colW + gap, R);
    y -= boxH + 7;
  }

  /** One tablet screenshot, fixed size; detail text flows below (no duplicate). */
  async function tabletShot(rel, caption) {
    const full = path.join('docs/manual-screenshots', rel);
    if (!fs.existsSync(full)) { p('(Missing ' + rel + ')'); return; }
    const img = await pdf.embedPng(fs.readFileSync(full));
    const scale = Math.min(TABLET_W / img.width, TABLET_H / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ensure(h + 28);
    const x = margin + (maxW - w) / 2;
    // device frame
    page.drawRectangle({
      x: x - 4, y: y - h - 4, width: w + 8, height: h + 8,
      color: rgb(0.12, 0.12, 0.12),
    });
    page.drawRectangle({
      x: x - 1, y: y - h - 1, width: w + 2, height: h + 2,
      color: rgb(1, 1, 1),
    });
    page.drawImage(img, { x, y: y - h, width: w, height: h });
    y -= h + 8;
    for (const line of wrap(caption, 8.2, font)) {
      ensure(10);
      const cw = font.widthOfTextAtSize(line, 8.2);
      page.drawText(line, { x: margin + (maxW - cw) / 2, y: y - 8.2, size: 8.2, font, color: mute });
      y -= 10;
    }
    y -= 4;
  }

  async function sampleShot(rel, caption) {
    const full = path.join('docs/manual-screenshots', rel);
    if (!fs.existsSync(full)) return;
    const img = await pdf.embedPng(fs.readFileSync(full));
    const maxWImg = 300, maxHImg = 200;
    const scale = Math.min(maxWImg / img.width, maxHImg / img.height);
    const w = img.width * scale, h = img.height * scale;
    ensure(h + 24);
    const x = margin + (maxW - w) / 2;
    page.drawRectangle({ x: x - 2, y: y - h - 2, width: w + 4, height: h + 4, borderColor: border, borderWidth: 0.7, color: rgb(0.97, 0.97, 0.96) });
    page.drawImage(img, { x, y: y - h, width: w, height: h });
    y -= h + 6;
    for (const line of wrap(caption, 8, font)) {
      ensure(10);
      const cw = font.widthOfTextAtSize(line, 8);
      page.drawText(line, { x: margin + (maxW - cw) / 2, y: y - 8, size: 8, font, color: mute });
      y -= 10;
    }
    y -= 3;
  }

  // ========== CONTENT (short) ==========
  title('Quran Learning App - User Manual');
  p('Muallim-ul-Quran companion. Read -> recognize -> understand. ~15-20 min/day. Screenshots: tablet 820x1180.');

  card('Idea', 'ONCE', [
    'Arabic first; Urdu is a check. Mark learned only when true.',
  ], accent);

  h('1. Home');
  await tabletShot('home.png', 'Home');
  bullet('Resume mushaf / next word; quick links; Recognize (tap = Urdu, check = known).');
  bullet('Progress bars + unit focus grid. Bottom nav: Home, Quran, Duas, Words.');

  h('2. Quran');
  await tabletShot('quran.png', 'Quran');
  bullet('Page / Juz / Surah. A- A+ size. Tap words; bookmarks save a page.');

  h('3. Words');
  await tabletShot('words.png', 'Words');
  bullet('Pick a unit. Search forms. Mark learned only after you know them in the mushaf.');

  h('4. Ayahs');
  await tabletShot('ayahs.png', 'Ayahs');
  bullet('Same unit as Words. Spot known forms. Mark familiar when reading feels real.');

  h('5. Qawaid');
  await tabletShot('rules.png', 'Qawaid');
  bullet('Short patterns when stuck - then return to the mushaf.');

  h('6. Duas');
  await tabletShot('duas.png', 'Duas');
  bullet('Masnoon + Quranic (by juz). Search / filters. Memorized check. Open mushaf for context.');

  h('7. Samples');
  await sampleShot('examples/mushaf-example.png', 'Mushaf');
  await sampleShot('examples/word-example.png', 'Word');
  await sampleShot('examples/dua-quranic-example.png', 'Quranic dua');

  h('8. Quick plans');
  pair(
    { title: 'S1 First day', badge: '15 MIN', fill: accent, lines: ['Quran p.1 + Recognize x5 (Unit 1).'] },
    { title: 'S2 Daily', badge: '15-20', fill: accent, lines: ['Mushaf 5-8 min. Recognize 8-12. Stop.'] },
  );
  pair(
    { title: 'S3 Busy', badge: '8 MIN', lines: ['Masnoon OR Recognize x6.'] },
    { title: 'S4 Stuck word', badge: '12 MIN', lines: ['Notice in Quran -> Words search -> reread.'] },
  );
  pair(
    { title: 'S5 One unit', badge: 'DAILY', lines: ['One unit: Recognize + Words + short mushaf.'] },
    { title: 'S6 Dua', badge: '10 MIN', lines: ['One Quranic dua: recite 3x, Memorized.'] },
  );

  h('9. On your device');
  card('Web app (no APK yet)', 'NOTE', [
    'Same Wi-Fi as Mac: http://YOUR-MAC-IP:3000 -> Add to Home Screen.',
  ]);

  footer();
  const bytes = await pdf.save();
  fs.writeFileSync('docs/USER_MANUAL.pdf', bytes);
  console.log('OK', bytes.length, 'pages', pdf.getPageCount());
}
main().catch((e) => { console.error(e); process.exit(1); });