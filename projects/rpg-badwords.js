/* rpg-badwords.js — filtr nevhodných jmen (sdílený pro všechny hry i HUB).
   API:  RPGBadWords.contains(name) → true, pokud jméno obsahuje zakázané slovo.
         RPGBadWords.norm(name)     → normalizovaná podoba (pro ladění/testy).
         RPGBadWords.list           → pole zakázaných kořenů.

   ZDROJE (čas od času aktualizovat podle nich — přidat nová slova do WORDS):
     • https://github.com/censor-text/profanity-list   (list/cs.txt, list/en.txt)
     • https://en.wiktionary.org/wiki/Category:Czech_vulgarities
     • https://github.com/valentinh/swear-words

   Kontrola je odolná proti obcházení: normalizuje diakritiku, leetspeak
   (0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s), odstraní mezery i interpunkci
   ("F U C K", "F.U.C.K" → "fuck") a zkrátí 3+ opakování písmen ("fuuuck" →
   "fuck"). Pak hledá zakázané KOŘENY jako podřetězce. Jména jsou krátká
   (≤14 znaků), takže podřetězec je přijatelný; učitel je poslední pojistka.

   Pozn.: kořeny jsou psané už NORMALIZOVANĚ (bez diakritiky, malými písmeny),
   protože se porovnávají proti normalizovanému vstupu. Záměrně VYNECHÁNO pár
   krátkých kořenů kvůli falešným shodám ve jménech (např. "heil"⊂Sheila,
   "anus"⊂Janusz) — necháváme delší/jednoznačné varianty.
*/
(function () {
  'use strict';

  var WORDS = [
    // ── ČEŠTINA (censor-text/cs + wiktionary + běžné nadávky/slury) ──
    'kurva', 'kokot', 'kokotina', 'pica', 'picus', 'picka', 'kunda', 'pizda',
    'curak', 'cural', 'chuj', 'mrdat', 'mrdka', 'mrdnik', 'mamrd', 'konomrd',
    'oslosoust', 'vypicenec', 'zkurvit', 'zkurvysyn', 'zmrd', 'prcat', 'soustat',
    'sulin', 'hovno', 'sracka', 'srat', 'prdel', 'prdelka', 'hajzl', 'debil',
    'chcanky', 'drstka', 'drzka', 'flundra', 'sperma',
    // české slury (rasové / homofobní / ableistické)
    'cikan', 'cigan', 'zidak', 'negr', 'buzna', 'buzerant', 'teplous', 'kripl',
    'mongol', 'nacek', 'retard',
    // ── ANGLIČTINA — profanity ──
    'fuck', 'motherfuck', 'fucker', 'fuk', 'shit', 'bullshit', 'cunt', 'dick',
    'dickhead', 'cock', 'pussy', 'bitch', 'bastard', 'asshole', 'arsehole',
    'jackass', 'dumbass', 'wank', 'wanker', 'twat', 'prick', 'bollock', 'bugger',
    'slut', 'whore', 'piss', 'fisting', 'blowjob', 'handjob', 'jerkoff', 'arse',
    'tosser', 'knob', 'shag', 'tits', 'titties', 'nutsack', 'ballsack', 'scrotum',
    'jizz', 'ejaculat', 'masturbat', 'orgasm', 'penis', 'vagina', 'rimjob',
    'felch', 'smegma', 'boner', 'dildo', 'buttplug', 'deepthroat', 'cumshot',
    // ── SLURY (rasové / homofobní / ableistické) ──
    'nigger', 'nigga', 'negro', 'coon', 'spic', 'chink', 'gook', 'kike',
    'wetback', 'beaner', 'paki', 'raghead', 'jigaboo', 'darkie', 'kaffir',
    'faggot', 'fag', 'dyke', 'tranny', 'shemale', 'ladyboy', 'spastic',
    'mongoloid', 'cripple',
    // ── HATE / nacismus ──
    'nazi', 'hitler', 'sieghei', 'kkk', 'holocaust', 'genocide',
    // ── SEXUÁLNÍ / explicitní ──
    'sex', 'porn', 'rape', 'rapist', 'pedo', 'pedophil', 'molest', 'incest',
    'bestial', 'orgy', 'gangbang', 'creampie', 'bukkake', 'hentai', 'milf'
  ];

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // pryč diakritika
      .replace(/[0@]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e')
      .replace(/4/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't')  // leetspeak
      .replace(/[^a-z]/g, '')                              // jen písmena (pryč mezery/tečky)
      .replace(/(.)\1{2,}/g, '$1');                        // 3+ opakování → 1
  }

  function contains(str) {
    var n = norm(str);
    if (!n) return false;
    for (var i = 0; i < WORDS.length; i++) { if (n.indexOf(WORDS[i]) !== -1) return true; }
    return false;
  }

  window.RPGBadWords = { contains: contains, norm: norm, list: WORDS };
})();
