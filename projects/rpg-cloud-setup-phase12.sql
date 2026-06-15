-- ════════════════════════════════════════════════════════════════════
--  RPG Matematika — FÁZE 12: Věž legend — nástroje pro učitele
--  ────────────────────────────────────────────────────────────────────
--  Issue #103:
--   • Učitel chce vidět žebříček věže i bez vlastní třídy → tower_board
--     to už umí (není omezený na třídu), ale neumí vrátit user_id pro
--     správu. Přidáváme tower_board_admin (jen STAFF), který vrací i
--     user_id + runs, aby šlo žáka z žebříčku smazat.
--   • Smazání žáka z žebříčku věže → tower_delete_run (jen STAFF).
--
--  Model jako fáze 11: žádný přímý přístup k tabulkám, vše přes
--  SECURITY DEFINER RPC. Spustit PO fázi 11 (a po fázi 2 kvůli my_role()).
-- ════════════════════════════════════════════════════════════════════

-- ── 1) Žebříček sezóny pro učitele (vč. user_id a počtu pokusů) ───────
-- Stejná data jako tower_board, ale jen pro učitele/superadmina a navíc
-- s user_id (pro mazání) a runs (statistika). Není omezeno na třídu —
-- učitel vidí všechny, kdo v dané sezóně lezli, i bez vlastní třídy.
create or replace function public.tower_board_admin(p_game text)
returns table (user_id uuid, display_name text, best_floor int, runs int, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select
    t.user_id,
    coalesce(nullif(s.name, ''), nullif(s.full_name, ''), 'Hráč') as display_name,
    t.best_floor,
    t.runs,
    t.updated_at
  from public.tower_runs t
  left join public.saves s on s.user_id = t.user_id and s.game = t.game
  where t.game = p_game
    and t.season = _season_label()
    and (select my_role()) in ('teacher', 'superadmin')
  order by t.best_floor desc, t.updated_at asc
  limit 100;
$$;

-- ── 2) Smazání žáka z žebříčku věže (aktuální sezóna) ────────────────
-- Učitel/superadmin smaže pokus žáka v AKTUÁLNÍ sezóně dané hry. Síň
-- slávy (tower_hall) zůstává nedotčená — to je trvalý historický zápis.
-- Vrací počet smazaných řádků (0 = nic k smazání).
create or replace function public.tower_delete_run(p_user_id uuid, p_game text)
returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if (select my_role()) not in ('teacher', 'superadmin') then
    raise exception 'forbidden';
  end if;
  if p_user_id is null then raise exception 'missing user'; end if;
  delete from public.tower_runs
   where user_id = p_user_id and game = p_game and season = _season_label();
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- ── 3) Práva (vzor fáze 9/11: anon nikam, jen authenticated) ─────────
do $$
declare f text;
begin
  foreach f in array array[
    'public.tower_board_admin(text)',
    'public.tower_delete_run(uuid,text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon;', f);
    execute format('grant  execute on function %s to authenticated;',  f);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
--  Hotovo. Konzole (záložka VĚŽ LEGEND) teď u žebříčku sezóny ukáže
--  tlačítko 🗑 pro smazání žáka. Vstup učitele do věže (náhled) je čistě
--  klientský — server žádný zápis nepřijme (tower_submit hlídá ročník).
-- ════════════════════════════════════════════════════════════════════
