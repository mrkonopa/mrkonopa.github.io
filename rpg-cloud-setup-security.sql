-- ══════════════════════════════════════════════════════════════════════
-- RPG Matematika — Serverové stropy kreditů a XP (Fáze Security)
-- Spusť v Supabase SQL editoru JEDNOU po Fázi 1 (saves tabulka musí existovat).
--
-- Co to dělá:
--   • BEFORE UPDATE trigger na tabulce `saves`
--   • Zastaví skok kreditů > +500 za jeden save (_wallet)
--   • Zastaví skok XP > +200 za jeden save (RPG_MAT_*)
--   • Učitelé a superadmini mají bypass (my_role() >= teacher)
--   • Přímý DB přístup (auth.uid() IS NULL) má bypass automaticky
--   • INSERT se nekontroluje — první přihlášení žáka je vždy ok
-- ══════════════════════════════════════════════════════════════════════

-- ── Trigger funkce ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_validate_save_delta()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public AS $$
DECLARE
  v_role  text   := 'student';
  old_val bigint;
  new_val bigint;
  capped  bigint;
BEGIN
  -- Přímý DB přístup (no JWT) → bypass
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Bypass pro učitele a superadminy
  BEGIN
    SELECT COALESCE(role, 'student') INTO v_role
      FROM public.roles
      WHERE email = lower(auth.jwt() ->> 'email')
      LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'student';
  END;
  IF v_role IN ('teacher', 'superadmin') THEN
    RETURN NEW;
  END IF;

  -- ── Kredity v peněžence (_wallet) ─────────────────────────────
  IF NEW.game = '_wallet'
     AND NEW.data ? 'credits'
     AND OLD.data ? 'credits'
  THEN
    old_val := COALESCE((OLD.data ->> 'credits')::bigint, 0);
    new_val := COALESCE((NEW.data ->> 'credits')::bigint, 0);
    IF new_val < 0 THEN
      NEW.data := jsonb_set(NEW.data, '{credits}', '0');
    ELSIF new_val - old_val > 500 THEN
      NEW.data := jsonb_set(NEW.data, '{credits}', to_jsonb(old_val + 500));
    END IF;
  END IF;

  -- ── XP v herních savech (RPG_MAT_*) ───────────────────────────
  IF NEW.game LIKE 'RPG_MAT_%'
     AND NEW.data ? 'xp'
     AND OLD.data ? 'xp'
  THEN
    old_val := COALESCE((OLD.data ->> 'xp')::bigint, 0);
    new_val := COALESCE((NEW.data ->> 'xp')::bigint, 0);
    IF new_val < 0 THEN
      NEW.data := jsonb_set(NEW.data, '{xp}',    '0');
      NEW.data := jsonb_set(NEW.data, '{level}', '1');
    ELSIF new_val - old_val > 200 THEN
      capped   := old_val + 200;
      NEW.data := jsonb_set(NEW.data, '{xp}',    to_jsonb(capped));
      NEW.data := jsonb_set(NEW.data, '{level}', to_jsonb(capped / 100 + 1));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ── Trigger ─────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_validate_save_delta ON public.saves;
CREATE TRIGGER trg_validate_save_delta
  BEFORE UPDATE ON public.saves
  FOR EACH ROW EXECUTE FUNCTION fn_validate_save_delta();

COMMENT ON FUNCTION fn_validate_save_delta IS
  'Serverové stropy: max +500 kr/save pro _wallet, max +200 XP/save pro RPG_MAT_*. Bypass pro teacher/superadmin a přímý DB přístup.';

-- ── Rychlý test (spusť ručně pro ověření) ──────────────────────────
-- Zkontroluje, že trigger existuje a funkce je na místě:
-- SELECT trigger_name, event_manipulation, action_timing
--   FROM information_schema.triggers
--   WHERE event_object_table = 'saves' AND trigger_name = 'trg_validate_save_delta';
