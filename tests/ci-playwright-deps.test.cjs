/* ══════════════════════════════════════════════════════════════════════
   Pojistka proti pomalému zrcadlu apt při instalaci knihoven Chromia
   (`tools/ci-playwright-deps.sh`).

   PROČ. Na CI (běh 39813340771, 22. 10. 2026) trvala instalace Chromia 8,6 min
   u dvou dílů ze čtyř, protože apt stahoval z azure.archive.ubuntu.com
   37 kB/s; zbytek došel z jiného zrcadla za 3 s. Skript dává limit na celý pokus
   a po nezdaru vyřadí azure ze seznamu zrcadel. Na CI se projeví jen když je zrcadlo
   pomalé, takže ho nejde zkoušet pouhým během brány — proto tenhle test s falešným
   `npx`, který se zasekne přesně tak, jak se zasekl apt.

   CO SE HLÍDÁ.
     1. Bez potíží: jeden pokus, seznam zrcadel se nedotkne.
     2. Zaseknutý první pokus: skript ho utne podle limitu (ne po 30 s, co by spal
        falešný npx), zrcadlo azure z seznamu zmizí, ostatní zůstanou, druhý pokus projde.
     3. Zaseknutý potomek (apt-get pod npxem) se zabije taky, ne jen přímý potomek.
     4. Zaseknuté všechny pokusy: skript skončí chybou, ne zelenou.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const SKRIPT = path.join(__dirname, '..', 'tools', 'ci-playwright-deps.sh');
const jeBash = spawnSync('bash', ['-c', 'command -v timeout >/dev/null']);
if (jeBash.status !== 0) { console.log('⏭️ SKIP: chybí bash nebo timeout'); process.exit(0); }

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log('  ❌ ' + m)); };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-apt-'));
const ZRC = 'http://azure.archive.ubuntu.com/ubuntu/ priority:1\nhttps://archive.ubuntu.com/ubuntu/ priority:2\n';

/* Falešný npx: zapíše pokus do počítadla; v režimu 'zasekne-1' se první pokus zasekne
   (potomek spí 30 s), v režimu 'vzdy' se zasekne každý. PID potomka zapíše do souboru. */
const FAKE = path.join(tmp, 'npx');
fs.writeFileSync(FAKE, `#!/usr/bin/env bash
n=$(( $(cat "${tmp}/pocet" 2>/dev/null || echo 0) + 1 )); echo $n > "${tmp}/pocet"
if { [ "$FAKE_REZIM" = zasekne-1 ] && [ $n -eq 1 ]; } || [ "$FAKE_REZIM" = vzdy ]; then
  sleep 30 & echo $! > "${tmp}/potomek"; wait
fi
exit 0
`, { mode: 0o755 });

function beh(rezim) {
  for (const f of ['pocet', 'potomek']) try { fs.unlinkSync(path.join(tmp, f)); } catch (e) { /* nebyl */ }
  fs.writeFileSync(path.join(tmp, 'zrcadla.txt'), ZRC);
  const t0 = Date.now();
  const r = spawnSync('bash', [SKRIPT], {
    encoding: 'utf8', timeout: 60000,
    env: { ...process.env, FAKE_REZIM: rezim, NPX: FAKE, LIMIT_S: '1', POKUSU: '3', SUDO: '', OPRAVA: ':', ZRCADLA: path.join(tmp, 'zrcadla.txt') },
  });
  const pocet = +(fs.existsSync(path.join(tmp, 'pocet')) ? fs.readFileSync(path.join(tmp, 'pocet'), 'utf8') : 0);
  const potomek = fs.existsSync(path.join(tmp, 'potomek')) ? +fs.readFileSync(path.join(tmp, 'potomek'), 'utf8') : 0;
  return { r, pocet, potomek, sec: (Date.now() - t0) / 1000, zrc: fs.readFileSync(path.join(tmp, 'zrcadla.txt'), 'utf8') };
}
/* Zabitý proces, který nikdo nesebral (v kontejneru bez initu), zůstane jako zombie: kill(pid, 0) na něj uspěje,
   i když neběží. Na Linuxu proto čteme stav z /proc, jinde stačí kill(pid, 0). */
const zije = pid => {
  try { process.kill(pid, 0); } catch (e) { return false; }
  try { return fs.readFileSync(`/proc/${pid}/stat`, 'utf8').replace(/^.*\) /, '')[0] !== 'Z'; } catch (e) { return true; }
};

/* 1 */
let a = beh('ok');
ok(a.r.status === 0 && a.pocet === 1, `bez potíží: kód ${a.r.status}, pokusů ${a.pocet} (má být 0 a 1)`);
ok(a.zrc === ZRC, 'bez potíží: seznam zrcadel se změnil');

/* 2 + 3 */
a = beh('zasekne-1');
ok(a.r.status === 0 && a.pocet === 2, `zaseknutý první pokus: kód ${a.r.status}, pokusů ${a.pocet} (má být 0 a 2)`);
ok(a.sec < 20, `zaseknutý první pokus trval ${a.sec.toFixed(1)} s, limit 1 s + 10 s na dobití; falešný npx by spal 30 s`);
ok(!/azure/.test(a.zrc) && /archive\.ubuntu\.com/.test(a.zrc), `zrcadlo azure měl skript vyřadit a ostatní nechat; seznam: ${JSON.stringify(a.zrc)}`);
ok(a.potomek > 0 && !zije(a.potomek), 'potomek zaseknutého pokusu zůstal naživu (timeout musí zabít celou skupinu)');

/* 4 */
a = beh('vzdy');
ok(a.r.status === 1 && a.pocet === 3, `všechny pokusy zaseknuté: kód ${a.r.status}, pokusů ${a.pocet} (má být 1 a 3)`);
ok(/::error::/.test(a.r.stdout), 'selhání neohlásilo ::error::');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nVÝSLEDEK: ${pass} ✅ / ${fail} ❌`);
process.exit(fail ? 1 : 0);
