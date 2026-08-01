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
--
-- OPRAVA (revize 2026-07): trigger četl `credits`/`xp` přímým castem
-- `(data ->> 'xp')::bigint`. `data` ale píše ŽÁK, takže na "1,5", "abc",
-- objektu nebo přetečení cast VYHODIL CHYBU — a protože běží BEFORE UPDATE,
-- žákovi se od té chvíle NEULOŽILO NIC a sám se z toho nedostal. Navíc se
-- strop přeskočil úplně, když ve STARÉM savu klíč chyběl. Čte se teď přes
-- public._save_num() a podvržená hodnota se rovnou srovná.
-- ══════════════════════════════════════════════════════════════════════

-- ── Bezpečné čtení čísla ze žákovského JSONu ────────────────────────
-- Nikdy nespadne: co není nezáporné číslo, je 0. Desetinné se usekne
-- (1,5 kreditu → 1), ať žák nepřijde o zůstatek kvůli staré verzi klienta.
CREATE OR REPLACE FUNCTION public._save_num(j jsonb, k text)
RETURNS bigint LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN j IS NULL OR jsonb_typeof(j) <> 'object' THEN 0
    WHEN (j ->> k) ~ '^[0-9]{1,15}(\.[0-9]+)?$'   THEN floor((j ->> k)::numeric)::bigint
    ELSE 0
  END;
$$;

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
  -- Chybějící klíč ve STARÉM savu strop dřív vypnul úplně — teď se bere jako 0.
  IF NEW.game = '_wallet' AND NEW.data ? 'credits' THEN
    old_val := public._save_num(OLD.data, 'credits');
    new_val := public._save_num(NEW.data, 'credits');
    -- cokoli, co není čisté nezáporné celé číslo (text, objekt, záporné,
    -- desetinné), srovnej na přečtenou hodnotu
    IF (NEW.data ->> 'credits') IS DISTINCT FROM new_val::text THEN
      NEW.data := jsonb_set(NEW.data, '{credits}', to_jsonb(new_val));
    END IF;
    IF new_val - old_val > 500 THEN
      NEW.data := jsonb_set(NEW.data, '{credits}', to_jsonb(old_val + 500));
    END IF;
  END IF;

  -- ── XP v herních savech (RPG_MAT_*) ───────────────────────────
  IF NEW.game LIKE 'RPG_MAT_%' AND NEW.data ? 'xp' THEN
    old_val := public._save_num(OLD.data, 'xp');
    new_val := public._save_num(NEW.data, 'xp');
    IF (NEW.data ->> 'xp') IS DISTINCT FROM new_val::text THEN
      NEW.data := jsonb_set(NEW.data, '{xp}',    to_jsonb(new_val));
      NEW.data := jsonb_set(NEW.data, '{level}', to_jsonb(new_val / 100 + 1));
    END IF;
    IF new_val - old_val > 200 THEN
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
