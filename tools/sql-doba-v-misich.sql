-- Doba hraní po misích (agregace bez jmen) — zdroj: `data.cas`, který od 17. 11. 2026 zapisují `casSpusteni` / `casOdpoved` (rpg-shared.js).
-- Jen ČTE tabulku `saves`; pouští se v Supabase (SQL editor nebo konektor). Změň hru v prvním řádku.
--
-- CO DATA JSOU:  `data.cas[<oblast>-<mise>] = {s, n, o, d}`
--                s = součet dob odpovědí v sekundách (od zobrazení úlohy nebo od předchozí odpovědi; jedna odpověď nejvýš 90 s),
--                n = počet započítaných odpovědí (boj i trénink; minihry a Věž ne), o = kolikrát se boj v misi spustil,
--                d = poslední den hraní v misi jako RRMMDD.
-- CO DATA NEJSOU: čas strávený čtením teorie ani prohlížením mapy; u starších postav nic (měří se od 17. 11. 2026, takže před první
--                hodinou po nasazení je výsledek prázdný — to není chyba dotazu). `d` je z hodin zařízení, ne ze serveru.
-- JAK ČÍST:      „zaseknutých" = hráči se záznamem v misi (aspoň jedno spuštění nebo odpověď) a BEZ splněného úkolu v ní. Když mise
--                nemá zaseknuté a hráči se zastavují, jejich poslední den (`posledni_dny`) ukáže, jestli šlo o konec hodiny (všichni
--                v jeden den) nebo o postupné odpadání. `s_na_odpoved` srovnávej mezi misemi téže hry, ne mezi hrami (jiný limit úlohy).
-- METODA:        žáci = účty mimo tabulku `roles`; hodnoty se čtou obranně (jsou psané žákem, žádný slepý cast).
with param as (select 'RPG_MAT_9'::text as hra),
s as (
  select sv.user_id, sv.data from public.saves sv, param p
  where sv.game = p.hra and lower(sv.email) not in (select lower(email) from public.roles)
),
c as (
  select s.user_id, k.key as mid,
         case when jsonb_typeof(k.value) = 'object' then k.value else '{}'::jsonb end as v
  from s, jsonb_each(case when jsonb_typeof(s.data -> 'cas') = 'object' then s.data -> 'cas' else '{}'::jsonb end) k
  where k.key ~ '^[1-9]-[1-9]$'
),
n as (
  select user_id, mid,
         case when (v ->> 's') ~ '^[0-9]{1,7}(\.[0-9])?$' then (v ->> 's')::numeric else 0 end as sek,
         case when (v ->> 'n') ~ '^[0-9]{1,6}$' then (v ->> 'n')::int else 0 end as odp,
         case when (v ->> 'o') ~ '^[0-9]{1,6}$' then (v ->> 'o')::int else 0 end as spust,
         case when (v ->> 'd') ~ '^[0-9]{6}$' then (v ->> 'd')::int else 0 end as den
  from c
),
d as (
  select s.user_id, (regexp_match(k, '^(\d+-\d+)-\d+$'))[1] as mid, count(*) as splneno
  from s, jsonb_object_keys(case when jsonb_typeof(s.data -> 'done') = 'object' then s.data -> 'done' else '{}'::jsonb end) k
  group by 1, 2
),
j as (
  select n.*, coalesce(d.splneno, 0) as splneno
  from n left join d on d.user_id = n.user_id and d.mid = n.mid
)
select j.mid as mise,
       count(*)                                                                   as hracu,
       sum(j.spust)                                                               as spusteni,
       sum(j.odp)                                                                 as odpovedi,
       round(sum(j.sek) / nullif(sum(j.odp), 0), 1)                               as s_na_odpoved,
       round(avg(j.spust), 1)                                                     as spusteni_na_hrace,
       count(*) filter (where j.splneno = 0 and (j.odp > 0 or j.spust > 0))       as zaseknutych,
       round(sum(j.sek) filter (where j.splneno = 0)
             / nullif(sum(j.odp) filter (where j.splneno = 0), 0), 1)             as s_na_odpoved_zaseknutych,
       (select string_agg(x.dd || '×' || x.p, '  ' order by x.den desc)
          from (select j2.den, substring(j2.den::text, 5, 2) || '.' || substring(j2.den::text, 3, 2) || '.' as dd, count(*) as p
                  from j j2 where j2.mid = j.mid and j2.den > 0
                 group by j2.den order by j2.den desc limit 6) x)                 as posledni_dny
from j
group by j.mid
order by (regexp_match(j.mid, '^(\d+)-'))[1]::int, (regexp_match(j.mid, '-(\d+)$'))[1]::int;
