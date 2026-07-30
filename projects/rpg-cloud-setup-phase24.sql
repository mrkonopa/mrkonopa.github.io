-- ════════════════════════════════════════════════════════════════
-- FÁZE 24 — BEZPEČNOSTNÍ OPRAVA: cast žákovského JSONu shazoval
--            učiteli přehled splnění úkolů (DoS)
--
-- CO SE NAŠLO (strojovým ověřením fází proti skutečnému PostgreSQL)
-- --------------------------------------------------------------------
-- `assignment_progress()` z fáze 20 zjišťovala „splněno" takto:
--
--     coalesce((s.data -> 'mastery' -> a.mission_id ->> 'mastered')::boolean, false)
--
-- `s.data` je ale ŽÁKOVSKÝ save (client-trusted, viz CLAUDE.md), takže tam
-- žák může mít cokoli. A `::boolean` v PostgreSQLu VYHODÍ CHYBU na všem, co
-- není platný boolean:
--
--     ('lol')::boolean  →  ERROR: invalid input syntax for type boolean
--     ('5')::boolean    →  ERROR
--
-- ⇒ jediný žák s `mastery: {"2-3": {"mastered": "lol"}}` (nebo prostě
--   s poškozeným savem) shodí učiteli přehled splnění pro CELOU třídU.
--   Je to stejná rodina vady jako DoS na žebříčku z fáze 19 — jen na
--   booleanu místo intu.
--
-- OPRAVA
-- --------------------------------------------------------------------
-- Nový pomocník `_jsonb_true(jsonb)`, který NIKDY nevyhodí výjimku:
-- rozhoduje podle `jsonb_typeof`, ne slepým castem. `assignment_progress`
-- ho používá místo castu. Hra ukládá `mastered` jako JSON boolean, takže
-- pro poctivé savy se chování nemění.
--
-- Zapracováno i do rpg-cloud-setup-phase20.sql, aby opětovné spuštění
-- fáze 20 vadu znovu nezavedlo. Stejně tak je ve fázi 4 (původní žebříček)
-- doplněn bezpečný cast z fáze 19 — jinak by re-run fáze 4 vrátil DoS
-- na žebříčku, který fáze 19 opravila.
--
-- Spustit v Supabase SQL editoru KDYKOLI (idempotentní), po fázi 20.
-- ════════════════════════════════════════════════════════════════

-- ── 1) bezpečné čtení booleanu ze žákovského JSONu ───────────────
-- Nikdy nevyhodí výjimku. Bere v potaz i to, že klient mohl uložit
-- boolean jako string ("true") nebo číslo (1) — pak se chová rozumně.
create or replace function public._jsonb_true(v jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case
    when v is null                     then false
    when jsonb_typeof(v) = 'boolean'   then v::text = 'true'
    when jsonb_typeof(v) = 'string'    then lower(v #>> '{}') in ('true','t','yes','y','1','on')
    when jsonb_typeof(v) = 'number'    then (v #>> '{}') <> '0'
    else false                          -- objekt, pole, null, cokoli jiného
  end;
$$;

-- ── 2) assignment_progress bez slepého castu ────────────────────
create or replace function public.assignment_progress(p_id uuid)
returns table (display_name text, mastered boolean)
language sql stable security definer set search_path = public as $$
  select
    coalesce(nullif(s.name, ''), nullif(s.full_name, ''), 'Hráč') as display_name,
    public._jsonb_true(s.data -> 'mastery' -> a.mission_id -> 'mastered') as mastered
  from public.assignments a
  join public.class_members cm on cm.class_id = a.class_id
  left join public.saves s on s.user_id = cm.user_id and s.game = a.game
  where a.id = p_id
    and (select my_role()) in ('teacher', 'superadmin')
  order by mastered desc, display_name asc;
$$;

revoke all on function public._jsonb_true(jsonb) from public, anon;
grant execute on function public._jsonb_true(jsonb) to authenticated;
revoke all on function public.assignment_progress(uuid) from public, anon;
grant execute on function public.assignment_progress(uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════
-- Kontrola po spuštění: v konzoli (záložka ÚKOLY) rozklikni splnění
-- úkolu — musí se zobrazit i tehdy, když má někdo ve třídě poškozený
-- save. Dřív se v takovém případě nezobrazilo nic.
-- ════════════════════════════════════════════════════════════════
