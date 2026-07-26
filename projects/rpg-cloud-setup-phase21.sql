-- ════════════════════════════════════════════════════════════════
-- Přijímačkový hub — FÁZE 21: cloud sync pokroku + učitelská připravenost
-- Spusť v Supabase: SQL Editor → New query → Run
-- (Spouštět AŽ PO rpg-cloud-setup.sql, phase2 a phase3; navazuje na phase19.)
--
-- Co přidává:
--   • tabulku prijimacky_stats — per žák JEDEN řádek s JSON pokrokem hubu
--     (testy nanečisto, procvičování po tématech, poslední diagnostika,
--      předpočítaný odhad připravenosti). RLS: žák vidí/píše jen svůj řádek.
--   • pz_get_stats() / pz_save_stats(data) — self-only čtení/uložení.
--   • pz_class_readiness(class) — STAFF přehled připravenosti třídy:
--     vrací jen zobrazované jméno + % připravenosti (0–100, safe-cast+clamp
--     jako leaderboard v phase19). Žádný celý save, žádné e-maily → soukromí.
--
-- Bezpečnostní posture (dle security review): přijímačkový pokrok je
-- honor-based/informativní (ne tvrdá metrika), stejně jako XP/level ve hrách.
-- Server proto pokrok neověřuje, jen bezpečně čte a nikdy nespadne na
-- podvrženém JSONu (regex-gated cast + clamp).
-- ════════════════════════════════════════════════════════════════

-- ── 1) Tabulka pokroku ─────────────────────────────────────────────
create table if not exists public.prijimacky_stats (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.prijimacky_stats enable row level security;

-- žák čte/píše výhradně svůj vlastní řádek
drop policy if exists pz_stats_self_sel on public.prijimacky_stats;
create policy pz_stats_self_sel on public.prijimacky_stats
  for select using (auth.uid() = user_id);

drop policy if exists pz_stats_self_ins on public.prijimacky_stats;
create policy pz_stats_self_ins on public.prijimacky_stats
  for insert with check (auth.uid() = user_id);

drop policy if exists pz_stats_self_upd on public.prijimacky_stats;
create policy pz_stats_self_upd on public.prijimacky_stats
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 2) Self RPC: čtení a uložení vlastního pokroku ─────────────────
create or replace function public.pz_get_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select data from public.prijimacky_stats where user_id = auth.uid()),
    '{}'::jsonb);
$$;

create or replace function public.pz_save_stats(p_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.prijimacky_stats (user_id, data, updated_at)
    values (auth.uid(), coalesce(p_data, '{}'::jsonb), now())
  on conflict (user_id)
    do update set data = excluded.data, updated_at = now();
end;
$$;

revoke all on function public.pz_get_stats()      from public, anon;
revoke all on function public.pz_save_stats(jsonb) from public, anon;
grant execute on function public.pz_get_stats()      to authenticated;
grant execute on function public.pz_save_stats(jsonb) to authenticated;

-- ── 3) Staff RPC: připravenost třídy ───────────────────────────────
-- Vrací jen bezpečná pole. Připravenost (0–100) počítá klient a ukládá do
-- data->>'readiness'; server ji jen regex-gated castne a clampne (nikdy
-- nespadne na podvrženém JSONu — stejný vzor jako phase19 leaderboard).
create or replace function public.pz_class_readiness(p_class uuid)
returns table (
  user_id      uuid,
  display_name text,
  readiness    int,
  attempts     int,
  updated_at   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ps.user_id,
    coalesce(
      nullif((select s.full_name from public.saves s
              where s.user_id = ps.user_id and nullif(s.full_name,'') is not null
              limit 1), ''),
      'Žák') as display_name,
    (least(greatest(
       case when (ps.data->>'readiness') ~ '^[0-9]{1,3}$' then (ps.data->>'readiness')::int else 0 end,
       0), 100)) as readiness,
    (case when jsonb_typeof(ps.data->'attempts') = 'array'
          then jsonb_array_length(ps.data->'attempts') else 0 end) as attempts,
    ps.updated_at
  from public.prijimacky_stats ps
  where public.my_role() in ('teacher','superadmin')
    and exists (
      select 1 from public.class_members cm
      where cm.class_id = p_class and cm.user_id = ps.user_id)
  order by readiness desc, display_name asc;
$$;

revoke all on function public.pz_class_readiness(uuid) from public, anon;
grant execute on function public.pz_class_readiness(uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════
-- Hotovo. Po přihlášení školním účtem na hubu se pokrok synchronizuje
-- napříč zařízeními; učitel vidí připravenost třídy v konzoli (záložka
-- PŘIJÍMAČKY). Bez přihlášení/cloudu vše běží lokálně (graceful).
-- ════════════════════════════════════════════════════════════════
