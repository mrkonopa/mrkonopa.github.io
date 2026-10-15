-- ═════════════════════════════════════════════════════════════════════════
--  FÁZE 27 — anonymní počítadlo používání přijímaček
--
--  PROČ: děti používají přijímačky bez přihlášení, takže výsledky leží jen v jejich prohlížeči
--  a učitel nevidí, jestli to někdo vůbec použil (15. 10. 2026: v cloudu jediný řádek).
--
--  CO SE POČÍTÁ: kolikrát za den nastala která událost (spuštění testu, odevzdání, procvičování,
--  konec diagnostiky, vyhodnocení konstrukce, vstup na stránky). NIC jiného: žádný identifikátor
--  uživatele ani zařízení, žádná adresa, žádný čas přesnější než den, žádný obsah odpovědí.
--  Tabulka má tři sloupce (den, událost, počet) a jeden řádek na dvojici, takže nemůže růst
--  rychleji než dny × povolené události — ani kdyby ji někdo zasypal voláními.
--
--  PŘÍSTUP: tabulka je zavřená (RLS bez politik, žádná práva). Zapisuje jen `pz_event`
--  (SECURITY DEFINER, povolená jsou jen známá jména událostí, cokoli jiného se tiše zahodí),
--  čte jen `pz_usage_summary` pro učitele.
--
--  Idempotentní: lze spustit opakovaně (CREATE OR REPLACE, IF NOT EXISTS).
--  Nasazení: po fázi 2 (`my_role()`) a fázi 23 (`my_role()` nevrací NULL).
-- ═════════════════════════════════════════════════════════════════════════

create table if not exists public.pz_usage (
  day   date   not null,
  event text   not null,
  n     bigint not null default 0,
  primary key (day, event)
);
alter table public.pz_usage enable row level security;
revoke all on public.pz_usage from public, anon, authenticated;

-- Zapíše jednu událost. Volat smí kdokoli (i nepřihlášený žák) — proto allowlist a žádná identita.
create or replace function public.pz_event(p_event text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event is null or p_event not in
     ('vstup', 'test_start', 'test_done', 'procvic', 'diag_done', 'konstrukce_check') then
    return;   -- neznámé jméno se tiše zahodí (žádná chyba, ať se z toho nedá nic zjistit ani vynutit)
  end if;
  insert into public.pz_usage (day, event, n)
  values ((now() at time zone 'Europe/Prague')::date, p_event, 1)
  on conflict (day, event) do update set n = public.pz_usage.n + 1;
end;
$$;
revoke all on function public.pz_event(text) from public;
grant execute on function public.pz_event(text) to anon, authenticated;

-- STAFF: součty po dnech za posledních p_days dní (1–365). Žák ani nepřihlášený ho nezavolá.
-- Brána používá coalesce: `NULL not in (…)` je v SQL NULL, ne TRUE, a brána by se tiše otevřela (fáze 23).
create or replace function public.pz_usage_summary(p_days int default 30)
returns table (day date, event text, n bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((select public.my_role()), '') not in ('teacher', 'superadmin') then
    raise exception 'forbidden';
  end if;
  return query
    select u.day, u.event, u.n
    from public.pz_usage u
    where u.day >= (now() at time zone 'Europe/Prague')::date - (greatest(1, least(coalesce(p_days, 30), 365)) - 1)
    order by u.day desc, u.event;
end;
$$;
revoke all on function public.pz_usage_summary(int) from public, anon;
grant execute on function public.pz_usage_summary(int) to authenticated;
