#!/usr/bin/env node
// Scrapes CERMAT website for the next JPZ math exam date (1. kolo).
// Writes result to projects/cermat-date.json.
// Called by .github/workflows/update-cermat.yml weekly.
// If date cannot be found, exits 0 and leaves existing JSON unchanged.

const https = require('https');
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../../projects/cermat-date.json');

const CERMAT_URLS = [
  'https://www.cermat.cz/terminy-zkousek/',
  'https://www.cermat.cz/prijimaci-rizeni/terminy/',
  'https://www.cermat.cz/terminy/',
];

// Czech month names → month index (0-based)
const CS_MONTHS = {
  ledna:0, února:1, března:2, dubna:3, května:4, června:5,
  července:6, srpna:7, září:8, října:9, listopadu:10, prosince:11,
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (cermat-date-bot/1.0)' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow one redirect
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

function parseDate(html, currentYear) {
  // Strip HTML tags for easier text matching
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  // Patterns for Czech date near "JPZ" / "přijímací zkouška" / "1. termín" / "1. kolo"
  // e.g. "14. dubna 2027" or "14. dubna 2027"
  const dateRe = /(\d{1,2})[.\s ]+([a-záéíóúůžšřčďťňě]+)[.\s ]+(\d{4})/gi;

  // Context keywords that indicate this is the JPZ math exam
  const contextRe = /jednotn[áé]\s+p[řr][íi]j[íi]mac[íi]\s+zkou[šs]k[ay]|JPZ|1\.\s*term[íi]n|1\.\s*kolo/i;

  // Split into windows around context keywords
  const hits = [];
  let m;
  while ((m = dateRe.exec(text)) !== null) {
    const day = parseInt(m[1], 10);
    const monthName = m[2].toLowerCase();
    const year = parseInt(m[3], 10);
    const month = CS_MONTHS[monthName];

    if (month === undefined) continue;
    if (year < currentYear || year > currentYear + 2) continue;
    if (day < 1 || day > 31) continue;

    // Check context window (500 chars before match)
    const start = Math.max(0, m.index - 500);
    const window = text.slice(start, m.index + 100);
    if (!contextRe.test(window)) continue;

    // Prefer April (typical JPZ month), then March/May
    const score = (month === 3) ? 10 : (month === 2 || month === 4) ? 5 : 1;
    hits.push({ day, month, year, score });
  }

  if (!hits.length) return null;

  // Pick highest score, then earliest date
  hits.sort((a, b) => b.score - a.score || a.year - b.year || a.month - b.month || a.day - b.day);
  const best = hits[0];

  const mm = String(best.month + 1).padStart(2, '0');
  const dd = String(best.day).padStart(2, '0');
  return { date: `${best.year}-${mm}-${dd}`, year: best.year, round: 1 };
}

async function run() {
  const now = new Date();
  // Look for next upcoming exam — skip dates already more than a week past
  const cutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const currentYear = now.getFullYear();

  let found = null;
  for (const url of CERMAT_URLS) {
    try {
      console.log(`Fetching ${url} ...`);
      const html = await fetchUrl(url);
      const parsed = parseDate(html, currentYear);
      if (parsed) {
        const d = new Date(parsed.date + 'T08:00:00');
        if (d >= cutoff) {
          found = parsed;
          console.log(`Found: ${parsed.date}`);
          break;
        } else {
          console.log(`Found ${parsed.date} but it's in the past — continuing`);
        }
      } else {
        console.log('No date found in page');
      }
    } catch (e) {
      console.log(`Error fetching ${url}: ${e.message}`);
    }
  }

  if (!found) {
    console.log('Could not determine next CERMAT date — leaving existing JSON unchanged');
    process.exit(0);
  }

  const existing = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  if (existing.next && existing.next.date === found.date) {
    console.log('Date unchanged');
    process.exit(0);
  }

  const updated = {
    next: {
      date: found.date,
      label: `1. termín ${found.year}`,
      round: 1,
      year: found.year,
    },
    source: 'auto',
    updated: now.toISOString().slice(0, 10),
    note: existing.note || '',
  };

  fs.writeFileSync(JSON_PATH, JSON.stringify(updated, null, 2) + '\n');
  console.log(`Updated cermat-date.json → ${found.date}`);
}

run().catch(e => { console.error(e); process.exit(0); }); // exit 0 to never block CI
