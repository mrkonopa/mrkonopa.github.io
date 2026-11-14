-- Co žáci v misi PSALI, když chybovali (agregace bez jmen) — zdroj: `data.wrong`, který od 14. 11. 2026 zapisuje `zapisChybnou` (rpg-shared.js).
-- Jen ČTE tabulku `saves`; pouští se v Supabase (SQL editor nebo konektor). Změň hru a misi v prvním řádku.
--
-- CO DATA JSOU:  `data.wrong[<oblast>-<mise>]` = nejvýš 3 POSLEDNÍ chybné odpovědi žáka v misi, každá `[zadání, správně, napsal]`
--                (zadání ≤ 70 znaků, odpovědi ≤ 14; „⏱“ = vypršel čas). Starší hry (před 14. 11.) nic nezapsaly, takže před
--                první hodinou po nasazení je výsledek prázdný — to není chyba dotazu.
-- CO DATA NEJSOU: úplný záznam. Při víc než 3 chybách se starší zahodí, takže u žáka s 30 chybami vidíš jen poslední tři.
--                Čítač „kolikrát“ je tedy počet ZAZNAMENANÝCH odpovědí, ne počet všech chyb v misi (ty jsou v `data.errs`).
-- METODA:        žáci = účty mimo tabulku `roles`; hodnoty se čtou obranně (jsou psané žákem, žádný slepý cast).
with param as (select 'RPG_MAT_6'::text as hra, '1-2'::text as mise),
s as (
  select sv.user_id, sv.data from public.saves sv, param p
  where sv.game = p.hra and lower(sv.email) not in (select lower(email) from public.roles)
),
w as (
  select s.user_id, e.value as zaznam
  from s, param p,
       jsonb_array_elements(case when jsonb_typeof(s.data -> 'wrong' -> p.mise) = 'array' then s.data -> 'wrong' -> p.mise else '[]'::jsonb end) e
  where jsonb_typeof(e.value) = 'array'
)
select left(zaznam ->> 0, 70) as zadani,
       left(zaznam ->> 1, 14) as spravne,
       left(zaznam ->> 2, 14) as napsal,
       count(*)               as kolikrat,
       count(distinct user_id) as zaku
from w
group by 1, 2, 3
order by kolikrat desc, zadani
limit 80;
