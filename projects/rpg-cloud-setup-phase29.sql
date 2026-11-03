-- ════════════════════════════════════════════════════════════════
-- RPG Matematika — FÁZE 29: ročníky živého souboje určuje JEN autor
-- Spusť v Supabase: SQL Editor → New query → Run.
-- (Spouštět AŽ PO phase7 a phase14. Idempotentní, kdykoli znovu.)
--
-- Dosud se v souboji ukládalo jen `game` ('RPG_MAT_8' nebo, když autor
-- v hubu zaškrtl víc ročníků, 'RPG_MAT_MIX'). Které ročníky to byly,
-- server nevěděl, a každý hráč si otázky ze seedu postavil ze SVÉ banky
-- (z ročníků, které měl zaškrtnuté u sebe v hubu, nebo ze hry, ve které
-- zrovna byl). Kdo se připojil s jiným výběrem, dostal jiné otázky než
-- autor — a hlavně se do souboje přimíchaly cizí ročníky.
--
-- Tahle fáze přidá sloupec `battles.grades` a funkci
--
--   create_battle_g(p_game, p_qcount, p_host_name, p_team_mode, p_grades)
--
-- která ročníky uloží při založení. battle_state vrací celý řádek
-- (`row_to_json(b)`), takže `grades` dorazí ke všem hráčům i k učiteli
-- bez další úpravy; rematch_battle mění týž řádek, takže ročníky drží
-- i po odvetě. Klient (rpg-battle-ui.js) staví otázky VÝHRADNĚ z nich.
--
-- Pravidla (žák si parametry píše sám, takže se nic nevěří):
--   • game = 'RPG_MAT_3'…'RPG_MAT_9' → grades = {ten ročník}; p_grades se
--     ignoruje (výběr autora JE hra, ve které soubor zakládá),
--   • game = 'RPG_MAT_MIX' → grades = rozumné p_grades (celá čísla 3–9,
--     bez duplicit, seřazená); po vyčištění musí zbýt aspoň 2, jinak
--     'invalid grades',
--   • jiné game → grades zůstane NULL (klient pak použije banku hráče
--     jako dřív),
--   • sloupec má CHECK: jen 1–7 hodnot, jen 3–9.
-- Původní create_battle a create_battle_tm zůstávají beze změny (starší
-- stránka z mezipaměti je dál volá); klient při chybějící fázi 29 spadne
-- na ně.
-- ════════════════════════════════════════════════════════════════

alter table public.battles add column if not exists grades smallint[];

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'battles_grades_chk') then
    alter table public.battles add constraint battles_grades_chk
      check (grades is null
             or (cardinality(grades) between 1 and 7
                 and grades <@ array[3, 4, 5, 6, 7, 8, 9]::smallint[]));
  end if;
end $$;

create or replace function public.create_battle_g(
  p_game text, p_qcount int, p_host_name text, p_team_mode boolean, p_grades int[])
returns battles language plpgsql security definer set search_path = public as $$
declare b battles; g text; gr smallint[];
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  g := coalesce(nullif(p_game, ''), 'RPG_MAT_9');

  if g ~ '^RPG_MAT_[3-9]$' then
    gr := array[substr(g, 9)::smallint];
  elsif g = 'RPG_MAT_MIX' then
    select array_agg(x order by x) into gr
      from (select distinct x::smallint as x
              from unnest(p_grades[1:20]) as x
             where x between 3 and 9) s;
    if gr is null or cardinality(gr) < 2 then raise exception 'invalid grades'; end if;
  else
    gr := null;
  end if;

  insert into battles (code, host_id, host_name, game, q_count, q_seed, team_mode, grades)
  values (_battle_gen_code(), auth.uid(), coalesce(nullif(p_host_name, ''), 'Host'),
          g,
          greatest(3, least(40, coalesce(p_qcount, 10))),
          (floor(random() * 2000000000))::bigint,
          coalesce(p_team_mode, false),
          gr)
  returning * into b;
  insert into battle_players (battle_id, user_id, display_name, team)
  values (b.id, auth.uid(), coalesce(nullif(p_host_name, ''), 'Host'),
          case when coalesce(p_team_mode, false) then 0 else null end);
  return b;
end; $$;

-- ── Práva (vzor fáze 9: anon nikam) ──────────────────────────────
revoke execute on function public.create_battle_g(text, int, text, boolean, int[]) from public, anon;
grant  execute on function public.create_battle_g(text, int, text, boolean, int[]) to authenticated;
