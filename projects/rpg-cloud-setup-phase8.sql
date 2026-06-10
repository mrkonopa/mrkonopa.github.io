-- ════════════════════════════════════════════════════════════════════
--  RPG Matematika — FÁZE 8: stav vzkazů (přečteno / smazáno žákem)
--  ────────────────────────────────────────────────────────────────────
--  Rozšiřuje tabulku `notes` (Fáze 3) o:
--    • read_at     — kdy si žák vzkaz přečetl (otevřel panel Vzkazy)
--    • deleted_at  — kdy ho žák smazal (soft-delete: učiteli zůstává)
--    • batch_id    — seskupení hromadného vzkazu do jedné „zprávy",
--                    aby šlo spočítat „přečteno X/N · smazáno Y/N"
--
--  Žák nemůže měnit text vzkazu — stav přepínají jen bezpečné RPC
--  funkce (SECURITY DEFINER) omezené na vlastní řádky.
--
--  Spustit AŽ po Fázi 3 (tabulka notes musí existovat).
-- ════════════════════════════════════════════════════════════════════

-- ── 1) Nové sloupce ─────────────────────────────────────────────────────────
alter table public.notes add column if not exists read_at    timestamptz;
alter table public.notes add column if not exists deleted_at timestamptz;
alter table public.notes add column if not exists batch_id   uuid;

-- Existujícím vzkazům dej každému vlastní batch_id (samostatná zpráva).
update public.notes set batch_id = id where batch_id is null;

-- Nové vzkazy bez batch_id dostanou unikátní automaticky.
alter table public.notes alter column batch_id set default gen_random_uuid();

create index if not exists notes_batch_idx on public.notes(batch_id);

-- ── 2) RPC: žák si označí vzkazy jako přečtené (otevření panelu) ─────────────
create or replace function public.mark_my_notes_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.notes
     set read_at = now()
   where student_id = auth.uid()
     and read_at is null
     and deleted_at is null;
$$;

-- ── 3) RPC: žák smaže vzkaz (soft-delete — učiteli zůstane viditelný) ────────
create or replace function public.soft_delete_my_note(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notes
     set deleted_at = now()
   where id = p_id
     and student_id = auth.uid()
     and deleted_at is null;
$$;

grant execute on function public.mark_my_notes_read()        to authenticated;
grant execute on function public.soft_delete_my_note(uuid)   to authenticated;

-- Hotovo. notes má stav přečteno/smazáno; učitel vidí agregaci přes batch_id.
