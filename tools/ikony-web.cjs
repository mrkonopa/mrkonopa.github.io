/* Ikony pro „přidat na plochu“ (apple-touch-icon.png 180, icon-192.png, icon-512.png) z favicon.svg.
   Plná plocha bez zaoblených rohů (iOS i Android si ikonu zaoblí/ořežou samy); znak je ve středu
   ve 64 % šířky, takže ho maskovatelná ikona neuřízne. Spuštění: node tools/ikony-web.cjs */
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const znak = '<path d="M8 9 L15 16 L8 23" fill="none" stroke="#33ff7a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="16.5" y="20" width="9" height="3" rx="1.5" fill="#33ff7a"/>';
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0b0f0a"/><g transform="translate(16 16) scale(.8) translate(-16.75 -16)">' + znak + '</g></svg>';
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [soubor, px] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
    const p = await b.newPage({ viewport: { width: px, height: px } });
    await p.setContent('<body style="margin:0;background:#0b0f0a"><div style="width:' + px + 'px;height:' + px + 'px">' + svg.replace('<svg ', '<svg width="' + px + '" height="' + px + '" ') + '</div></body>');
    await p.screenshot({ path: path.join(ROOT, soubor), clip: { x: 0, y: 0, width: px, height: px } });
    console.log(soubor, fs.statSync(path.join(ROOT, soubor)).size, 'B');
    await p.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
