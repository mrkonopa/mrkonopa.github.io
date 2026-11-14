-- Chyby v misích (agregace bez jmen) — zdroj čísel „chyb na splněný úkol“ v CLAUDE.md a tests/KONTROLY.md #134.
-- Jen ČTE tabulku `saves`; pouští se v Supabase (SQL editor nebo konektor). Změň hru v prvním řádku.
--
-- METODA (srovnávej vždy stejnou, jinak se čísla nedají porovnat):
--   * hráči = žáci; účty z tabulky `roles` (učitelé, testovací postavy) se vynechají,
--   * úkoly  = počet klíčů `data.done` tvaru `<oblast>-<mise>-<úkol>` ve dané misi,
--   * chyby  = součet `data.errs[<oblast>-<mise>]` VŠECH žáků, i těch, kdo v misi nesplnili ani jeden úkol
--              (právě ti, kdo se v misi zasekli, dělají nejvíc chyb; bez nich se obtížnost podhodnotí),
--   * chyb_na_ukol = chyby / úkoly. Doba odpovědi ani šablona úlohy se do `saves` neukládají.
with param as (select 'RPG_MAT_5'::text as hra),
s as (
  select sv.user_id, sv.data from public.saves sv, param p
  where sv.game = p.hra and lower(sv.email) not in (select lower(email) from public.roles)
),
d as (
  select s.user_id, (regexp_match(k, '^(\d+-\d+)-\d+$'))[1] as mid, count(*) as splneno
  from s, jsonb_object_keys(case when jsonb_typeof(s.data->'done') = 'object' then s.data->'done' else '{}'::jsonb end) k
  group by 1, 2
),
e as (
  select s.user_id, ek.key as mid, (ek.value)::int as chyb
  from s, jsonb_each_text(case when jsonb_typeof(s.data->'errs') = 'object' then s.data->'errs' else '{}'::jsonb end) ek
  where ek.value ~ '^[0-9]{1,6}$'
),
vse as (
  select coalesce(d.user_id, e.user_id) as user_id, coalesce(d.mid, e.mid) as mid,
         coalesce(d.splneno, 0) as splneno, coalesce(e.chyb, 0) as chyb
  from d full join e on e.user_id = d.user_id and e.mid = d.mid
)
select mid,
       count(*) filter (where splneno > 0)                    as hracu_s_postupem,
       count(*) filter (where splneno = 0 and chyb > 0)       as zaseknutych,
       sum(splneno)                                           as splneno,
       sum(chyb)                                              as chyb,
       round(sum(chyb)::numeric / nullif(sum(splneno), 0), 2) as chyb_na_ukol,
       sum(chyb) filter (where splneno = 0)                   as chyb_zaseknutych
from vse
where mid ~ '^\d+-\d+$'
group by mid
order by (regexp_match(mid, '^(\d+)-'))[1]::int, (regexp_match(mid, '-(\d+)$'))[1]::int;
