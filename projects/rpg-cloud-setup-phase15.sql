-- ════════════════════════════════════════════════════════════════════
--  RPG Matematika — FÁZE 15: AUDIT LOG akcí učitelů a superadminů
--  ────────────────────────────────────────────────────────────────────
--  Superadmin vidí, co kterému žákovi který učitel udělal: přidání/odebrání
--  XP a kreditů, odemčení misí, smazání postavy, vzkazy, role, třídy, archiv.
--
--  Model (vzor Fáze 9+11): žádný přímý zápis přes table API — zapisuje se
--  jen přes SECURITY DEFINER RPC log_action (actor = auth.uid()). Čte jen
--  superadmin přes audit_log_list. Spustit po fázích 1–3.
-- ════════════════════════════════════════════════════════════════════

-- ── 1) Tabulka ───────────────────────────────────────────────────────
create table if not exists public.audit_log (
  id           bigint generated always as identity primary key,
  actor_id     uuid not null,            -- kdo akci provedl (učitel/superadmin)
  actor_email  text,
  action       text not null,            -- 'give_xp','give_credits','del_char','class_xp',
                                          -- 'unlock','note','role','class','archive',...
  target_id    uuid,                     -- dotčený žák (nullable)
  target_email text,
  game         text,                     -- 'RPG_MAT_X' nebo null
  detail       jsonb not null default '{}'::jsonb,  -- volné podrobnosti (delta, mid, text…)
  created_at   timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
create index if not exists audit_log_actor_idx   on public.audit_log (actor_id);
create index if not exists audit_log_target_idx  on public.audit_log (target_id);

alter table public.audit_log enable row level security;

-- jen superadmin smí číst přímo (kdyby četl přes table API); zápis nikdo napřímo
drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select
  using ((select my_role()) = 'superadmin');

-- ── 2) Zápis (jen staff, actor = auth.uid()) ─────────────────────────
create or replace function public.log_action(
  p_action text,
  p_target uuid default null,
  p_target_email text default null,
  p_game text default null,
  p_detail jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  if (select my_role()) not in ('teacher', 'superadmin') then
    raise exception 'not staff';
  end if;
  select email into v_email from auth.users where id = auth.uid();
  insert into public.audit_log (actor_id, actor_email, action, target_id, target_email, game, detail)
  values (auth.uid(), v_email, left(coalesce(p_action, '?'), 40),
          p_target, p_target_email, p_game, coalesce(p_detail, '{}'::jsonb));
end $$;

-- ── 3) Čtení (jen superadmin, stránkování přes created_at) ───────────
create or replace function public.audit_log_list(
  p_limit int default 200,
  p_before timestamptz default null,
  p_actor uuid default null,
  p_target uuid default null)
returns setof public.audit_log
language sql stable security definer set search_path = public as $$
  select * from public.audit_log
  where (select my_role()) = 'superadmin'
    and (p_before is null or created_at < p_before)
    and (p_actor  is null or actor_id  = p_actor)
    and (p_target is null or target_id = p_target)
  order by created_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;

-- ── 4) Práva (vzor Fáze 9: anon nikam) ───────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'public.log_action(text,uuid,text,text,jsonb)',
    'public.audit_log_list(int,timestamptz,uuid,uuid)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon;', f);
    execute format('grant  execute on function %s to authenticated;',  f);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
--  Hotovo. Konzole volá RPGCloud.logAction(...) po každé měnící akci a
--  superadmin čte v záložce AKTIVITA přes RPGCloud.listAuditLog(...).
--  Graceful: když tabulka/RPC chybí, logování i čtení tiše selžou (hra
--  ani konzole se nerozbijí).
-- ════════════════════════════════════════════════════════════════════
