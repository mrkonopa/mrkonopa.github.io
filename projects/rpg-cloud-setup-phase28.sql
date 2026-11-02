-- ════════════════════════════════════════════════════════════════
-- RPG Matematika — FÁZE 28: spolužáci uvidí můj vzhled z obchodu
-- Spusť v Supabase: SQL Editor → New query → Run.
-- (Spouštět AŽ PO phase4 a phase23. Idempotentní, kdykoli znovu.)
--
-- Rámeček avatara, barva jména, titul a mazlíček z obchodu se dosud
-- ukazovaly jen jejich majiteli (žebříček, souboj a Věž znaly jen jméno
-- a body). Peněženka každého žáka leží v tabulce `saves` jako řádek
-- game = '_wallet' (data.cosmetics.active = vybrané položky,
-- data.cosmetics.owned = koupené). Tahle fáze přidá JEDNU funkci:
--
--   look_of(p_ids uuid[])  →  (user_id, look jsonb)
--
-- Vrací jen to, co smí vidět spolužák, a jen čtyři klíče:
--   {"border":"border-gold","badge":"badge-purple","title":"title-lovec","pet":"pet-sova"}
-- Žádné kredity, e-maily ani zbytek peněženky.
--
-- Žák si peněženku píše sám (client-trusted), takže se NIKDY nevěří:
--   • id musí mít předponu své kategorie a tvar ^kategorie-[a-z0-9-]{1,26}$
--     (nic jiného než krátký slug; žádný HTML řetězec, číslo, objekt),
--   • id musí být mezi KOUPENÝMI (data.cosmetics.owned) — nikdo si
--     nepřidá cizí legendární rám, který nemá,
--   • seznam koupených nad 300 položek se bere jako prázdný,
--   • žádný slepý cast (vzor fází 19 a 24) — funkce nikdy nespadne
--     a podvržený JSON nemůže shodit žebříček celé třídě.
-- Kdo smí koho vidět: sebe, spolužáky ze sdílené třídy (stejné pravidlo
-- jako leaderboard) a učitel/superadmin všechny. Nejvýš 60 id na volání.
-- ════════════════════════════════════════════════════════════════

-- ── 1) jedno id: jen slug s předponou své kategorie ──────────────
create or replace function public._look_id(p jsonb, p_kat text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when jsonb_typeof(p) = 'string'
     and (p #>> '{}') ~ ('^' || p_kat || '-[a-z0-9-]{1,26}$')
    then p #>> '{}'
  end;
$$;

-- ── 2) z peněženky vybrat bezpečný vzhled ─────────────────────────
create or replace function public._look_z_penezenky(p_data jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  with w as (
    select
      case when jsonb_typeof(p_data #> '{cosmetics,active}') = 'object'
           then p_data #> '{cosmetics,active}' else '{}'::jsonb end as act,
      case when jsonb_typeof(p_data #> '{cosmetics,owned}') = 'array'
            and jsonb_array_length(p_data #> '{cosmetics,owned}') <= 300
           then p_data #> '{cosmetics,owned}' else '[]'::jsonb end as own
  ),
  k as (
    select kat, public._look_id(w.act -> kat, kat) as id, w.own
    from w cross join unnest(array['border', 'badge', 'title', 'pet']) as kat
  )
  select coalesce(
    jsonb_object_agg(kat, id) filter (where id is not null and own ? id),
    '{}'::jsonb)
  from k;
$$;

-- ── 3) veřejná funkce: vzhled spolužáků ───────────────────────────
create or replace function public.look_of(p_ids uuid[])
returns table (user_id uuid, look jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select t.user_id, t.look
  from (
    select s.user_id, public._look_z_penezenky(s.data) as look
    from public.saves s
    where s.game = '_wallet'
      and auth.uid() is not null
      and s.user_id = any (p_ids[1:60])
      and (
        s.user_id = auth.uid()
        or (select public.my_role()) in ('teacher', 'superadmin')
        or exists (
          select 1
          from public.class_members me
          join public.class_members other on other.class_id = me.class_id
          where me.user_id = auth.uid()
            and other.user_id = s.user_id
        )
      )
  ) t
  where t.look <> '{}'::jsonb;
$$;

-- ── 4) práva (vzor fáze 9: anon nikam; pomocné jen zevnitř) ──────
revoke all on function public._look_id(jsonb, text)        from public, anon, authenticated;
revoke all on function public._look_z_penezenky(jsonb)     from public, anon, authenticated;
revoke all on function public.look_of(uuid[])              from public, anon;
grant  execute on function public.look_of(uuid[])          to authenticated;
