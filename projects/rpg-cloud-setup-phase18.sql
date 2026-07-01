-- ════════════════════════════════════════════════════════════════════
--  Fáze 18 — bezpečnostní úklid podle Supabase database linter
--  Spustit v Supabase SQL editoru (po fázích 11, 12, 17). Idempotentní.
--
--  Kontext: adversariální audit 42 funkcí NENAŠEL žádnou skutečnou díru.
--  Architektura „RLS zamkne tabulky + přístup jen přes vetované SECURITY
--  DEFINER RPC" je záměrná a správná — proto varování „Signed-In Users Can
--  Execute SECURITY DEFINER Function" (u ~28 funkcí) NEŘEŠÍME: každá funkce
--  si dělá vlastní kontrolu (auth.uid() vlastník / my_role() staff /
--  eligibilita) a revoke EXECUTE by appku rozbil.
--
--  Tady jsou jen tři reálné drobnosti + dvě kosmetické zpevnění vzoru:
-- ════════════════════════════════════════════════════════════════════

-- ── 1) function_search_path_mutable (3 nálezy) ───────────────────────
--  Interní pomocné funkce neměly zafixovaný search_path (ostatní funkce
--  ho mají). Zafixujeme ho — best practice proti manipulaci search_path.
alter function public._school_year_start() set search_path = pg_catalog, public;
alter function public._season_label()      set search_path = pg_catalog, public;
alter function public._tower_open()        set search_path = pg_catalog, public;

-- ── 2) extension_in_public: unaccent ─────────────────────────────────
--  Extension `unaccent` se do public schema dostala jen kvůli JEDNORÁZOVÉMU
--  audit dotazu na jména — žádná aplikační funkce ji nepoužívá. Odstraníme.
--  (Kdybys ten audit dotaz chtěl znovu, stačí `create extension unaccent;`.)
drop extension if exists unaccent;

-- ── 3) tower_board_admin: kontrola role až v ORDER BY/WHERE → tvrdý guard ─
--  Nešlo o díru (nestaff dostal prázdný výsledek), ale vzor byl slabý:
--  role se kontrolovala uvnitř dotazu. Převedeme na plpgsql s explicitním
--  `raise exception 'forbidden'` na začátku (stejně jako tower_delete_run).
create or replace function public.tower_board_admin(p_game text)
returns table (user_id uuid, display_name text, best_floor int, runs int, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if (select my_role()) not in ('teacher', 'superadmin') then
    raise exception 'forbidden';
  end if;
  return query
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
    order by t.best_floor desc, t.updated_at asc
    limit 100;
end $$;
revoke all    on function public.tower_board_admin(text) from public, anon;
grant  execute on function public.tower_board_admin(text) to authenticated;

-- ── 4) invite_battle_email: validace formátu e-mailu ─────────────────
--  Nešlo o díru (chráněno _battle_can_control + RLS, e-maily se nečtou
--  zpět), jen se do battle_invites daly uložit nesmysly. Přidáme kontrolu
--  formátu, ať tam nejdou náhodné řetězce.
create or replace function public.invite_battle_email(p_battle uuid, p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email));
begin
  if not _battle_can_control(p_battle) then raise exception 'forbidden'; end if;
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid email';
  end if;
  insert into battle_invites (battle_id, email) values (p_battle, v_email)
  on conflict (battle_id, email) do nothing;
end; $$;
revoke all    on function public.invite_battle_email(uuid, text) from public, anon;
grant  execute on function public.invite_battle_email(uuid, text) to authenticated;

-- ── 5) auth_leaked_password_protection ───────────────────────────────
--  NENÍ TŘEBA NIC. Aplikace používá výhradně Google OAuth (@husovaliberec.cz),
--  žádná email+heslo registrace → žádná hesla k úniku. Varování je irelevantní.
--  (Klidně přepínač v Auth zapni — nemá to žádný efekt ani náklad.)
