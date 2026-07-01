/* rpg-badwords.js — filtr nevhodných jmen (sdílený pro všechny hry i HUB).
   AUTOMATICKY GENEROVÁNO: tools/build-badwords.cjs (spusť pro aktualizaci ze zdrojů).
   API: RPGBadWords.contains(name) → true; .norm(name); .SUBSTR; .EXACT.

   Zdroje: LDNOOBW (en,cs), chucknorris-io/swear-words (en,cs),
   censor-text/profanity-list (cs) + kurátorské CZ/SK doplňky (SK sdílí kořeny s CZ).
   Celkem ~494 kořenů (375 podřetězcových + 119 celotokenových).

   Normalizace vstupu: malá písmena, pryč diakritika, leetspeak (0→o,1→i,3→e,4→a,
   5→s,7→t,@→a,$→s), pryč mezery/interpunkce ("F U C K"→"fuck"), 3+ opakování→1.
   SUBSTR = jednoznačné kořeny (podřetězec — chytí složeniny i "FUCK NIGGERS").
   EXACT  = krátká/kolizní slova (ass,sex,dick,pica…) jen jako CELÝ token, aby
            neblokovala běžná jména (Dickens, Picasso, Assunta, Massimo…).
*/
(function () {
  'use strict';
  var SUBSTR = [
    'acrotomophilia','alabamahotpocket','alaskanpipeline','anilingus','apeshit','arsehole','asshole','assmunch','autoerotic','babeland',
    'babybatter','babyjuice','balicking','ballgag','ballgravy','ballkicking','ballsack','ballsucking','bangbros','bangbus',
    'bareback','barelylegal','barenaked','bastard','bastardo','bastinado','beaner','beaners','beastiality','beavercleaver',
    'beaverlips','bestiality','bigblack','bigbreasts','bigknockers','bigtits','bimbos','birdlock','bitch','bitches',
    'blackcock','blondeaction','blondeonblondeaction','blowjob','blowyourload','bluewaffle','blumpkin','bollocks','bondage','bootycall',
    'bordel','brownshowers','brunetteaction','bukkake','bulldyke','bulletvibe','bullshit','bunghole','buttcheeks','butthole',
    'buzerant','buzna','cameltoe','camgirl','camslut','camwhore','carpetmuncher','chcanky','chocolaterosebuds','chuj',
    'cialis','cigan','cikan','circlejerk','clevelandsteamer','clitoris','cloverclamps','clusterfuck','cock','coprolagnia',
    'coprophilia','cornhole','creampie','cripple','cumming','cumshot','cumshots','cunnilingus','cunt','curak',
    'darkie','daterape','deepthroat','dendrophilia','dickhead','dingleberries','dingleberry','dirtypillows','dirtysanchez','doggiestyle',
    'doggystyle','dogstyle','dolcett','domination','dominatrix','dommes','donkeypunch','dopice','doprdele','doriti',
    'doubledong','doublepenetration','dpaction','drstka','dryhump','dumbass','eatmyass','ejaculate','ejaculation','erotic',
    'erotism','escort','eunuch','faggot','fellatio','feltch','femalesquirting','femdom','figging','fingerbang',
    'fingering','fisting','flundra','footfetish','footjob','frotting','fuck','fuckbuttons','fuckin','fucking',
    'fucktards','fudgepacker','futanari','gangbang','gaysex','genitals','giantcock','girlon','girlontop','girlsgonewild',
    'girlsicup','goatcx','goatse','goddamn','gokkun','goldenshower','goodpoop','googirl','goregasm','groupsex',
    'hajzl','handjob','hardcore','hentai','hitler','holocaust','homoerotic','honkey','hooker','hotcarl',
    'hotchick','hovno','howtokill','howtomurder','hugefat','humping','incest','intercourse','jackass','jackoff',
    'jailbait','jebat','jellydonut','jerkoff','jigaboo','jiggaboo','jiggerboo','kaffir','kinbaku','kinkster',
    'knobbing','kokot','kokotina','konomrd','kreten','kunda','kurva','leatherrestraint','leatherstraightjacket','lemonparty',
    'livesex','lolita','lovemaking','makemecome','malesquirting','masturbate','masturbating','masturbation','menageatrois','missionaryposition',
    'molest','mongoloid','motherfucker','moundofvenus','mrdat','mrdka','mrdnik','mrhands','muffdiver','muffdiving',
    'nambla','nawashi','neonazi','nigga','nigger','nignog','nimphomania','nipple','nipples','nsfwimages',
    'nudity','nutten','nympho','nymphomania','octopussy','omorashi','onecuptwogirls','oneguyonejar','orgasm','oslosoust',
    'paedophile','panties','pedobear','pedophile','pegging','penis','phonesex','pichat','picus','pieceofshit',
    'pissing','pisspig','pizda','playboy','pleasurechest','polesmoker','ponyplay','poontang','poopchute','pornography',
    'prdel','prdelka','prick','princealbertpiercing','punany','pussy','raghead','ragingboner','raping','rapist',
    'rectum','retard','reversecowgirl','rimjob','rimming','rosypalm','rosypalmandherssisters','rustytrombone','sadism','santorum',
    'schlong','scissoring','scrotum','sexcam','sexual','sexuality','sexually','shavedbeaver','shavedpussy','shemale',
    'shibari','shit','shitblimp','shitty','shrimping','skurveny','skurvy','skurvysyn','slanteye','slut',
    'snatch','snowballing','sodomize','sodomy','soustat','spastic','splooge','sploogemoose','spooge','spreadlegs',
    'sracka','strapon','strappado','stripclub','styledoggy','suicidegirls','sulin','sultrywomen','swastika','swinger',
    'taintedlove','tastemy','teabagging','teplos','teplous','threesome','throating','thumbzilla','tiedup','tightwhite',
    'titties','tongueina','topless','tosser','towelhead','tranny','tribadism','tubgirl','twat','twinkie',
    'twogirlsonecup','undressing','upskirt','urethraplay','urophilia','vagina','venusmound','viagra','vibrator','violetwand',
    'vorarephilia','voyeur','voyeurweb','voyuer','vyjeb','vyjebany','vymrd','vymrdat','vypicenec','wank',
    'wanker','wetback','wetdream','whitepower','whore','worldsex','wrappingmen','wrinkledstarfish','yellowshowers','zidak',
    'zkurvit','zkurvy','zkurvysyn','zmrd','zoophilia'
  ];
  var EXACT = new Set([
    'anal','anus','arse','ass','bbw','bdsm','boner','boob','boobs','busty',
    'butt','chink','clit','cocks','cokl','coon','coons','crap','cum','cumet',
    'dago','damn','debil','dick','dik','dildo','drzka','dvda','dyke','ecchi',
    'fag','fap','fatass','fecal','felch','gay','gic','gook','grope','gspot',
    'guro','heil','hell','hoe','homo','homos','horny','jap','jizz','juggs',
    'kike','kinky','knob','kraut','mamrd','milf','mong','nacek','nazi','negr',
    'negro','nsfw','nude','omg','orgy','paki','panty','pica','picka','pico',
    'pikey','pis','piss','poo','poof','poon','porn','porno','prcat','pron',
    'pthc','pubes','queaf','queef','quim','rape','scat','semen','sex','sexo',
    'sexy','shag','shota','simp','skeet','smut','spic','spunk','srac','srat',
    'std','suck','sucks','svina','thot','tit','tits','titty','turd','tushy',
    'twink','vulva','wang','wog','wtf','xxx','yaoi','yiffy','zrat'
  ]);
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[0@]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e')
      .replace(/4/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't')
      .replace(/[^a-z]/g, '').replace(/(.)\1{2,}/g, '$1');
  }
  function contains(str) {
    var joined = norm(str);
    if (!joined) return false;
    for (var i = 0; i < SUBSTR.length; i++) { if (joined.indexOf(SUBSTR[i]) !== -1) return true; }
    var toks = String(str).toLowerCase().split(/[^a-z0-9@$!|\u00e0-\u017f]+/i);
    for (var j = 0; j < toks.length; j++) { var t = norm(toks[j]); if (t && EXACT.has(t)) return true; }
    if (EXACT.has(joined)) return true;
    return false;
  }
  window.RPGBadWords = { contains: contains, norm: norm, SUBSTR: SUBSTR, EXACT: EXACT };
})();
