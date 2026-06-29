// Audit: žádný sprite nesmí vykreslit fallback '#f0f' (chybějící znak v paletě).
// Runtime: mock DOM, projeď všechny bossy (oblasti 1..7), hrdinovy módy a parťáka,
// nech render() běžet mnoho ticků a hlídej fillStyle === '#f0f'.
const fs = require('fs');
const vm = require('vm');

let failures = [];

function makeEnv(file) {
  const magenta = [];
  let rafCb = null;
  const ctx = new Proxy({ canvas: null }, {
    get(t, p) {
      if (p === 'fillStyle') return t._fs;
      if (p === 'imageSmoothingEnabled') return false;
      // všechny kreslicí metody = no-op
      return (...a) => {};
    },
    set(t, p, v) {
      if (p === 'fillStyle') { t._fs = v; if (v === '#f0f') magenta.push(1); }
      else t[p] = v;
      return true;
    }
  });
  function mkEl() {
    const el = {
      style: {}, width: 600, height: 200, clientWidth: 600, isConnected: true,
      id: '', getContext: () => ctx, appendChild() {}, insertBefore() {}, removeChild() {},
      querySelector: () => null, addEventListener() {}, parentNode: null,
    };
    el.parentNode = el; return el;
  }
  const topEl = mkEl();
  const win = {
    devicePixelRatio: 1,
    addEventListener() {}, removeEventListener() {},
    requestAnimationFrame(cb) { rafCb = cb; return 1; },
    cancelAnimationFrame() {},
    performance: { now: () => Date.now() },
  };
  const doc = {
    createElement: () => mkEl(),
    getElementById: () => mkEl(),
    querySelector: () => null,
    documentElement: { classList: { contains: () => false } },
  };
  const sandbox = {
    window: win, document: doc, performance: win.performance,
    requestAnimationFrame: win.requestAnimationFrame,
    cancelAnimationFrame: win.cancelAnimationFrame,
    Math, Date, Object, Array, console, parseInt, parseFloat, String, Number,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox);
  return { win, topEl, magenta, getRaf: () => rafCb };
}

for (const n of [3, 4, 5, 6, 7, 8, 9]) {
  const file = `projects/rpg-sprites-${n}.js`;
  const { win, topEl, magenta, getRaf } = makeEnv(file);
  const API = win['RPGSprites' + n];
  if (!API) { failures.push(`${file}: window.RPGSprites${n} nedefinováno`); continue; }
  API.attach(topEl);
  const cb = getRaf();
  const modes = ['spawn', 'heroAttack', 'bossAttack', 'defeat'];
  let t = 0;
  for (let area = 1; area <= 7; area++) {
    if (API.setProgress) API.setProgress(area, 0);
    for (const mode of modes) {
      try { if (typeof API[mode] === 'function') API[mode](); } catch (e) {}
      // proběhni ~12 snímků (cyklí tick, prohodí frame fáze)
      for (let f = 0; f < 12; f++) { t += 100; if (cb) cb(t); }
    }
  }
  if (magenta.length) failures.push(`${file}: ${magenta.length}× fallback '#f0f' (chybějící znak v paletě)`);
  else console.log(`sprites-${n}: OK — žádné magenta pixely (${7 * modes.length * 12} snímků)`);
}

if (failures.length) { console.error('\nFAIL:\n' + failures.join('\n')); process.exit(1); }
console.log('\nVšech 7 sprite sad čisté — žádný #f0f fallback.');
