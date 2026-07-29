-- ════════════════════════════════════════════════════════════════
-- FÁZE 22 — PŘIJÍMAČKY: diagnostika okruhů pro celou třídu
--
-- Fáze 21 dala učiteli připravenost PER ŽÁK (jedno %). Chybělo to, co se
-- podle toho dá naplánovat: VE KTERÝCH OKRUZÍCH třída tápe. Tady je RPC,
-- které agreguje pokrok po okruzích přes všechny žáky vybrané třídy —
-- zvlášť z klidného procvičování a zvlášť z ostrého testu nanečisto.
--
-- BEZPEČNOST (lekce z fáze 19 — DoS na žebříčku):
--   `prijimacky_stats.data` píše ŽÁK, takže tam může být cokoli. Kdyby se
--   castovalo naivně (`->>'ok'`::int) nebo se rozbalovalo `jsonb_each` nad
--   ne-objektem, jeden podvržený řádek shodí dotaz CELÉ třídě. Proto:
--     • `jsonb_typeof(...) = 'object'` před každým rozbalením,
--     • čísla přes `_pz_num()` (regex-gate + clamp), nikdy přímý cast,
--     • délka klíče okruhu omezená (anti-flood), počet řádků limitovaný.
--   Funkce je SECURITY DEFINER a čte jen pro učitele (`my_role()`), anon
--   je odvolaný — stejně jako ostatní RPC od fáze 9.
--
-- Spustit v Supabase SQL editoru PO fázi 21.
-- ════════════════════════════════════════════════════════════════

-- ── 1) bezpečný číselný cast z žákovského JSONu ──────────────────
-- Nikdy nevyhodí výjimku: co není celé číslo v rozumném rozsahu → 0.
create or replace function public._pz_num(t text)
returns bigint
language sql
immutable
set search_path = public
as $$
  select least(greatest(
    case when t ~ '^[0-9]{1,12}$' then t::bigint else 0 end,
  0), 1000000);
$$;

-- ── 2) agregace okruhů přes třídu ───────────────────────────────
-- Vrací jeden řádek na okruh: kolik žáků na něm má data, souhrn
-- správně/celkem z procvičování a totéž z testu nanečisto.
-- Nejslabší okruhy první (podle společné úspěšnosti).
create or replace function public.pz_class_topics(p_class uuid)
returns table (
  topic      text,
  students   int,
  prac_ok    bigint,
  prac_total bigint,
  test_ok    bigint,
  test_total bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with cls as (
    select ps.user_id, ps.data
    from public.prijimacky_stats ps
    where public.my_role() in ('teacher','superadmin')
      and exists (
        select 1 from public.class_members cm
        where cm.class_id = p_class and cm.user_id = ps.user_id)
  ),
  -- procvičování: rozbal jen když je to skutečně objekt (jinak prázdno)
  prac as (
    select c.user_id, e.key as topic,
           public._pz_num(e.value->>'ok')    as ok,
           public._pz_num(e.value->>'total') as total
    from cls c
    cross join lateral jsonb_each(
      case when jsonb_typeof(c.data->'practice') = 'object'
           then c.data->'practice' else '{}'::jsonb end) e
    where jsonb_typeof(e.value) = 'object'
  ),
  -- test nanečisto: stejná obrana
  tst as (
    select c.user_id, e.key as topic,
           public._pz_num(e.value->>'ok')    as ok,
           public._pz_num(e.value->>'total') as total
    from cls c
    cross join lateral jsonb_each(
      case when jsonb_typeof(c.data->'test') = 'object'
           then c.data->'test' else '{}'::jsonb end) e
    where jsonb_typeof(e.value) = 'object'
  ),
  merged as (
    select topic, user_id, ok as p_ok, total as p_total, 0::bigint as t_ok, 0::bigint as t_total from prac
    union all
    select topic, user_id, 0::bigint, 0::bigint, ok, total from tst
  )
  select
    m.topic,
    count(distinct m.user_id)::int as students,
    sum(m.p_ok)::bigint    as prac_ok,
    sum(m.p_total)::bigint as prac_total,
    sum(m.t_ok)::bigint    as test_ok,
    sum(m.t_total)::bigint as test_total
  from merged m
  -- Jen skutečné okruhy přijímaček. Klíče v JSONu píše žák, takže bez tohoto
  -- allowlistu může jeden podvržený save vyrobit stovky vymyšlených okruhů a
  -- vytlačit z výsledku ty pravé (ověřeno: 200 fake klíčů zaplnilo limit).
  where m.topic in ('vyrazy-mocniny','zlomky','procenta','pomer','vyrazy-promenna',
                    'rovnice','slovni','geometrie','telesa','data')
  group by m.topic
  order by
    case when sum(m.p_total) + sum(m.t_total) > 0
         then (sum(m.p_ok) + sum(m.t_ok))::numeric / (sum(m.p_total) + sum(m.t_total))
         else 2 end asc,                      -- nejslabší okruhy nahoru, bez dat naposled
    m.topic asc
  limit 60;
$$;

revoke all on function public._pz_num(text) from public, anon;
grant execute on function public._pz_num(text) to authenticated;
revoke all on function public.pz_class_topics(uuid) from public, anon;
grant execute on function public.pz_class_topics(uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════
-- Hotovo. Učitel v konzoli (záložka PŘIJÍMAČKY) uvidí pod seznamem žáků
-- heatmapu okruhů celé třídy — kde je úspěšnost nízká, tam má smysl
-- zacílit výuku. Bez spuštění tohoto SQL konzole jen skryje heatmapu
-- (graceful, zbytek záložky funguje dál).
-- ════════════════════════════════════════════════════════════════
