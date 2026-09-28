'use strict';
// Startovní hook .claude/hooks/podpis-commitu.sh — commity z cloudu se mají
// podepisovat Vojtovým klíčem (GitHub pak ukáže „Verified"), a když klíč
// chybí nebo je vadný, musí zůstat podpis prostředí a commit nesmí spadnout.
//
// Prostředí se tu napodobuje věrně: globální konfigurace podepisuje přes
// vlastní program, který parametr -f IGNORUJE a vždy použije „klíč
// prostředí" — stejně jako /tmp/code-sign v cloudu (tam je user.signingkey
// dokonce prázdný soubor). Kdyby hook přepsal jen user.signingkey a ne
// gpg.ssh.program, podepisovalo by se dál cizím klíčem; proto se u každého
// případu dělá SKUTEČNÝ commit a ověřuje se, KTERÝ klíč ho podepsal.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.join(__dirname, '..', '.claude', 'hooks', 'podpis-commitu.sh');
let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('✅ ' + msg); } else { fail++; console.log('❌ ' + msg); }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'podpis-commitu-'));
const home = path.join(tmp, 'home');
fs.mkdirSync(home);
const envZaklad = { ...process.env, HOME: home, GIT_CONFIG_NOSYSTEM: '1' };
for (const k of ['GIT_PODPIS_KLIC', 'GIT_CONFIG_GLOBAL', 'CLAUDE_CODE_REMOTE', 'CLAUDE_PROJECT_DIR']) delete envZaklad[k];

function spust(cmd, args, env, cwd) {
  return execFileSync(cmd, args, { encoding: 'utf8', env: env || envZaklad, cwd, timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] });
}

// Dva klíče: „prostředí" (cizí, jako Anthropic) a „Vojtův"; k tomu Vojtův s heslem.
const klicProstredi = path.join(tmp, 'klic-prostredi');
const klicVojta = path.join(tmp, 'klic-vojta');
const klicHeslo = path.join(tmp, 'klic-heslo');
spust('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-C', 'prostredi', '-f', klicProstredi]);
spust('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-C', 'vojta', '-f', klicVojta]);
spust('ssh-keygen', ['-q', '-t', 'ed25519', '-N', 'tajne-heslo', '-C', 'heslo', '-f', klicHeslo]);
const otisk = f => spust('ssh-keygen', ['-lf', f + '.pub']).split(' ')[1];
const OTISK_PROSTREDI = otisk(klicProstredi);
const OTISK_VOJTA = otisk(klicVojta);

// Napodobenina /tmp/code-sign: -f zahodí a podepíše klíčem prostředí.
const falesnyPodpis = path.join(tmp, 'code-sign');
fs.writeFileSync(falesnyPodpis, [
  '#!/bin/bash',
  'out=()',
  'while [ $# -gt 0 ]; do',
  `  if [ "$1" = "-f" ]; then out+=(-f "${klicProstredi}"); shift 2; else out+=("$1"); shift; fi`,
  'done',
  'exec ssh-keygen "${out[@]}"',
  '',
].join('\n'), { mode: 0o755 });
const prazdnyPub = path.join(tmp, 'commit_signing_key.pub');
fs.writeFileSync(prazdnyPub, '');
fs.writeFileSync(path.join(home, '.gitconfig'), [
  '[user]', '\tname = Claude', '\temail = noreply@anthropic.com', `\tsigningkey = ${prazdnyPub}`,
  '[gpg]', '\tformat = ssh',
  '[gpg "ssh"]', `\tprogram = ${falesnyPodpis}`,
  '[commit]', '\tgpgsign = true', '',
].join('\n'));

const povoleni = path.join(tmp, 'allowed_signers');
fs.writeFileSync(povoleni, [klicProstredi, klicVojta]
  .map(f => '* ' + fs.readFileSync(f + '.pub', 'utf8').trim()).join('\n') + '\n');

const b64 = f => fs.readFileSync(f).toString('base64');
let cislo = 0;

// Jeden případ: čisté repo, hook (volitelně víckrát), skutečný commit, kdo podepsal.
function pripad(promenne, { behu = 1, repo } = {}) {
  repo = repo || path.join(tmp, 'repo-' + (++cislo));
  if (!fs.existsSync(repo)) { fs.mkdirSync(repo); spust('git', ['init', '-q', repo]); }
  const env = { ...envZaklad, CLAUDE_PROJECT_DIR: repo, ...promenne };
  let vystup = '', kod = 0;
  for (let i = 0; i < behu; i++) {
    try { vystup += spust('bash', [HOOK], env, repo); } catch (e) { kod = e.status; vystup += String(e.stdout || ''); }
  }
  fs.writeFileSync(path.join(repo, 'soubor.txt'), String(Math.random()));
  spust('git', ['-C', repo, 'add', 'soubor.txt']);
  let commitOk = true;
  try { spust('git', ['-C', repo, 'commit', '-q', '-m', 'test']); } catch (e) { commitOk = false; }
  let podpis = '', klic = '', autor = '';
  if (commitOk) {
    const log = spust('git', ['-C', repo, '-c', 'gpg.ssh.program=ssh-keygen',
      '-c', 'gpg.ssh.allowedSignersFile=' + povoleni, 'log', '-1', '--format=%G?|%GK|%an <%ae>']).trim();
    [podpis, klic, autor] = log.split('|');
  }
  const cfg = k => { try { return spust('git', ['-C', repo, 'config', '--local', '--get-all', k]).trim().split('\n'); } catch (e) { return []; } };
  return { repo, vystup, kod, commitOk, podpis, klic, autor, cfg };
}

const VOJTA = 'Vojtěch Konopa <vojtech.konopa@gmail.com>';

// 0. Měřidlo: bez hooku podepisuje „prostředí" — jinak by zbytek nic nedokazoval.
{
  const r = pripad({});
  ok(r.commitOk && r.podpis === 'G' && r.klic === OTISK_PROSTREDI,
    `napodobené prostředí podepisuje svým klíčem (${r.podpis} ${r.klic})`);
}

// 1. Mimo cloud hook nedělá nic.
{
  const r = pripad({ GIT_PODPIS_KLIC: b64(klicVojta) });
  ok(r.kod === 0 && r.vystup === '', 'mimo cloud hook mlčí a končí nulou');
  ok(r.klic === OTISK_PROSTREDI && r.autor === 'Claude <noreply@anthropic.com>',
    `mimo cloud se nic nemění (podpis ${r.klic}, autor ${r.autor})`);
}

// 2. Cloud bez proměnné: autor Vojta, podpis zůstává prostředí.
{
  const r = pripad({ CLAUDE_CODE_REMOTE: 'true' });
  ok(r.kod === 0 && r.commitOk, 'bez proměnné commit projde');
  ok(r.autor === VOJTA, `bez proměnné je autor Vojta (${r.autor})`);
  ok(r.klic === OTISK_PROSTREDI, 'bez proměnné zůstává podpis prostředí');
  ok(/GIT_PODPIS_KLIC není nastavená/.test(r.vystup), 'bez proměnné hook řekne proč');
}

// 3. Cloud s Vojtovým klíčem: podepisuje Vojtův klíč, i přes cizí gpg.ssh.program.
{
  const r = pripad({ CLAUDE_CODE_REMOTE: 'true', GIT_PODPIS_KLIC: b64(klicVojta) });
  ok(r.commitOk && r.podpis === 'G', `s klíčem je commit podepsaný a ověřitelný (${r.podpis})`);
  ok(r.klic === OTISK_VOJTA, `s klíčem podepisuje Vojtův klíč (${r.klic}, čekáno ${OTISK_VOJTA})`);
  ok(r.autor === VOJTA, 's klíčem je autor Vojta');
  ok(r.cfg('gpg.ssh.program')[0] === 'ssh-keygen', 'hook přebil program prostředí (gpg.ssh.program)');
  const soubor = path.join(home, '.ssh', 'podpis_commitu');
  ok(fs.existsSync(soubor) && (fs.statSync(soubor).mode & 0o777) === 0o600, 'soukromý klíč leží s právy 600');
  ok(r.vystup.includes(OTISK_VOJTA), 'hook vypíše otisk klíče');
  const tajne = b64(klicVojta).slice(20, 60);
  ok(!r.vystup.includes(tajne) && !/PRIVATE KEY/.test(r.vystup), 'výstup hooku neobsahuje soukromý klíč');
}

// 4. Vadný obsah proměnné: commit projde, podpis zůstává prostředí, soubor po klíči nezůstane.
{
  fs.rmSync(path.join(home, '.ssh'), { recursive: true, force: true });
  const r = pripad({ CLAUDE_CODE_REMOTE: 'true', GIT_PODPIS_KLIC: 'tohle-neni-klic' });
  ok(r.kod === 0 && r.commitOk && r.klic === OTISK_PROSTREDI, 'vadná proměnná: commit projde s podpisem prostředí');
  ok(!fs.existsSync(path.join(home, '.ssh', 'podpis_commitu')), 'vadná proměnná: po klíči nezůstane soubor');
  ok(/není platný soukromý klíč/.test(r.vystup), 'vadná proměnná: hook řekne proč');
}

// 5. Veřejná část místo soukromé (snadná záměna): totéž jako vadná.
{
  const r = pripad({ CLAUDE_CODE_REMOTE: 'true', GIT_PODPIS_KLIC: b64(klicVojta + '.pub') });
  ok(r.commitOk && r.klic === OTISK_PROSTREDI, 'veřejná část místo soukromé se nepoužije');
}

// 6. Klíč s heslem: nesmí viset na dotazu na heslo (timeout 30 s by shodil test).
{
  const r = pripad({ CLAUDE_CODE_REMOTE: 'true', GIT_PODPIS_KLIC: b64(klicHeslo) });
  ok(r.kod === 0 && r.commitOk && r.klic === OTISK_PROSTREDI, 'klíč s heslem: hook nevisí a nechá podpis prostředí');
}

// 7. Base64 zalomené po řádcích s CRLF (schránka ve Windows): pořád Vojtův klíč.
{
  const zalomene = b64(klicVojta).replace(/(.{64})/g, '$1\r\n') + '\r\n';
  const r = pripad({ CLAUDE_CODE_REMOTE: 'true', GIT_PODPIS_KLIC: zalomene });
  ok(r.klic === OTISK_VOJTA, `zalomená base64 s CRLF funguje (${r.klic})`);
}

// 8. Idempotence: dva běhy za sebou, nastavení bez duplicit a podpis dál Vojtův.
{
  const r = pripad({ CLAUDE_CODE_REMOTE: 'true', GIT_PODPIS_KLIC: b64(klicVojta) }, { behu: 2 });
  ok(r.klic === OTISK_VOJTA, 'po dvou bězích podepisuje Vojtův klíč');
  const dup = ['user.signingkey', 'gpg.ssh.program', 'user.email'].filter(k => r.cfg(k).length !== 1);
  ok(dup.length === 0, 'po dvou bězích žádné zdvojené nastavení' + (dup.length ? ': ' + dup.join(', ') : ''));
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nPodpis commitů: ${pass} ✅ / ${fail} ❌`);
process.exit(fail > 0 ? 1 : 0);
