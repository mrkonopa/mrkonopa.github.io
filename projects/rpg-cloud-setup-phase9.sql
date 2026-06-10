-- ════════════════════════════════════════════════════════════════════
--  RPG Matematika — FÁZE 9: bezpečnostní utažení (reakce na Security Advisor)
--  ────────────────────────────────────────────────────────────────────
--  Supabase Security Advisor hlásí, že SECURITY DEFINER funkce jsou
--  spustitelné rolemi `anon` (nepřihlášený) a `authenticated`.
--
--  Náš model: CELÁ aplikace vyžaduje přihlášení → `anon` nemá nikdy volat
--  žádnou z RPC funkcí. Dva pomocníci s prefixem `_` jsou navíc čistě
--  interní (volají je jiné funkce) a nemá je volat ani přihlášený žák.
--
--  Tato fáze:
--    • odebere EXECUTE roli `anon` u všech RPC,
--    • odebere EXECUTE i roli `authenticated` u interních `_` pomocníků
--      a u údržbové `cleanup_battles` (tu spouštěj z dashboardu/cronu),
--    • přihlášeným (`authenticated`) ponechá to, co reálně volají.
--
--  Spustit klidně opakovaně (idempotentní). Po Fázi 7 (a ideálně i 8).
-- ════════════════════════════════════════════════════════════════════

-- ── 1) Interní pomocníci — nesmí je volat NIKDO zvenčí ──────────────────────
--    (fungují dál, protože je volají jiné SECURITY DEFINER funkce jako vlastník)
revoke execute on function public._battle_can_control(uuid) from public, anon, authenticated;
revoke execute on function public._battle_gen_code()        from public, anon, authenticated;

-- ── 2) Údržba — jen servisní role (dashboard / cron), ne žák ────────────────
revoke execute on function public.cleanup_battles()         from public, anon, authenticated;

-- ── 3) Veřejné RPC — odeber `anon`, ponech `authenticated` ──────────────────
--    Vzor: zruš default grant PUBLIC, pak vrať jen přihlášeným.
do $$
declare f text;
begin
  foreach f in array array[
    'public.my_role()',
    'public.leaderboard(text)',
    'public.create_battle(text,int,text)',
    'public.join_battle(text,text)',
    'public.advance_battle(uuid,int)',
    'public.set_battle_status(uuid,text)',
    'public.submit_battle_answer(uuid,int,boolean,int)',
    'public.battle_state(uuid)',
    'public.list_active_battles()',
    'public.invite_battle_email(uuid,text)',
    'public.my_battle_invites()'
  ]
  loop
    execute format('revoke execute on function %s from public, anon;', f);
    execute format('grant  execute on function %s to authenticated;',  f);
  end loop;
end $$;

-- ── 4) Fáze 8 (vzkazy — přečteno/smazáno), pokud už je nasazená ─────────────
do $$
begin
  if exists (select 1 from pg_proc where proname='mark_my_notes_read') then
    execute 'revoke execute on function public.mark_my_notes_read() from public, anon';
    execute 'grant  execute on function public.mark_my_notes_read() to authenticated';
  end if;
  if exists (select 1 from pg_proc where proname='soft_delete_my_note') then
    execute 'revoke execute on function public.soft_delete_my_note(uuid) from public, anon';
    execute 'grant  execute on function public.soft_delete_my_note(uuid) to authenticated';
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════
--  Po spuštění zmizí všechny varování „anon_security_definer_*".
--  Zůstanou jen „authenticated_security_definer_*" u veřejných RPC —
--  to je ZÁMĚR (přihlášený žák je volat MUSÍ) a je to bezpečné: každá
--  funkce si uvnitř ověřuje auth.uid()/roli. Tyto zbylé WARN ignoruj.
--
--  PERFORMANCE varování (auth_rls_initplan, multiple_permissive_policies)
--  jsou při desítkách žáků zanedbatelná — neřešíme.
-- ════════════════════════════════════════════════════════════════════
