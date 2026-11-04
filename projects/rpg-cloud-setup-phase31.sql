-- ════════════════════════════════════════════════════════════════
-- RPG Matematika — FÁZE 31: spolužáci uvidí můj vzhled i ve Věži legend
-- Spusť v Supabase: SQL Editor → New query → Run.
-- (Spouštět AŽ PO phase11 a phase28. Idempotentní, kdykoli znovu.)
--
-- Žebříček Věže (tower_board) ukazoval jen jméno a patro. Rámeček,
-- barvu jména, titul a mazlíčka z obchodu už vidí spolužáci v žebříčku
-- třídy (fáze 28) a v živém souboji; tahle fáze je přidá i do Věže.
--
-- tower_board dostane čtvrtý sloupec `look jsonb` — stejný ověřený
-- vzhled jako look_of() (jen koupené, jen čtyři klíče, žádné kredity).
-- Server ho vyplní JEN u řádků, které smí volající vidět (sebe,
-- spolužáky ze sdílené třídy, učitel/superadmin všechny); u zbytku
-- ročníku je NULL a řádek je prostý jako dřív.
--
-- Vědomě se NEVRACÍ user_id: Věž ukazuje celý ročník (i žáky z jiných
-- tříd) a cizí identifikátory žáků do prohlížeče nepatří. Vzhled
-- přichází rovnou hotový, klient nemusí volat look_of podruhé.
-- Síň slávy (tower_hall_of_fame) zůstává prostá: jsou v ní jména
-- zapsaná natrvalo i po odchodu žáka ze třídy.
--
-- Změna návratového typu → CREATE OR REPLACE nestačí, funkce se maže
-- a zakládá znovu (a tedy se znovu nastavují práva). Starý klient
-- čte sloupce podle jména, takže přidaný sloupec nevadí; nový klient
-- se starým SQL dostane look = undefined a vykreslí prostý řádek.
-- ════════════════════════════════════════════════════════════════

drop function if exists public.tower_board(text);

create function public.tower_board(p_game text)
returns table (display_name text, best_floor int, is_me boolean, look jsonb)
language sql stable security definer set search_path = public as $$
  select
    coalesce(nullif(s.name, ''), nullif(s.full_name, ''), 'Hráč') as display_name,
    t.best_floor,
    (t.user_id = auth.uid()) as is_me,
    case
      when t.user_id = auth.uid()
        or (select public.my_role()) in ('teacher', 'superadmin')
        or exists (
          select 1
          from public.class_members me
          join public.class_members other on other.class_id = me.class_id
          where me.user_id = auth.uid()
            and other.user_id = t.user_id
        )
      then nullif(public._look_z_penezenky(w.data), '{}'::jsonb)
    end as look
  from public.tower_runs t
  left join public.saves s on s.user_id = t.user_id and s.game = t.game
  left join public.saves w on w.user_id = t.user_id and w.game = '_wallet'
  where t.game = p_game
    and t.season = _season_label()
    and t.best_floor > 0
    and auth.uid() is not null
  order by t.best_floor desc, t.updated_at asc
  limit 30;
$$;

-- práva (vzor fáze 9: anon nikam)
revoke execute on function public.tower_board(text) from public, anon;
grant  execute on function public.tower_board(text) to authenticated;
