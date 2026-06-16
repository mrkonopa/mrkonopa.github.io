-- ═══════════════════════════════════════════════════════════════
--  RPG Matematika — FÁZE 10: zpětná vazba hráčů (feedback)
--  ─────────────────────────────────────────────────────────────
--  Hráči mohou z HUBu nebo ze hry odeslat anonymní nápad/návrh.
--  Zprávy čte a maže jen učitel/superadmin v záložce ZPĚTNÁ VAZBA.
--  Spustit po fázi 9.
-- ═══════════════════════════════════════════════════════════════

-- ── Tabulka ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text        DEFAULT '',
  body         text        NOT NULL CHECK (char_length(body) <= 2000),
  created_at   timestamptz DEFAULT now()
);

-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- přihlášený žák smí vložit vlastní záznam
DROP POLICY IF EXISTS "feedback_insert" ON public.feedback;
CREATE POLICY "feedback_insert" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- učitel/superadmin čte všechny
DROP POLICY IF EXISTS "feedback_staff_select" ON public.feedback;
CREATE POLICY "feedback_staff_select" ON public.feedback
  FOR SELECT USING (public.my_role() IN ('teacher', 'superadmin'));

-- učitel/superadmin maže
DROP POLICY IF EXISTS "feedback_staff_delete" ON public.feedback;
CREATE POLICY "feedback_staff_delete" ON public.feedback
  FOR DELETE USING (public.my_role() IN ('teacher', 'superadmin'));

-- ── Oprávnění ───────────────────────────────────────────────────
REVOKE ALL ON public.feedback FROM public, anon;
GRANT INSERT, SELECT, DELETE ON public.feedback TO authenticated;

-- ═══════════════════════════════════════════════════════════════
--  Po spuštění:
--    1. Žáci mohou odesílat zpětnou vazbu z HUBu (rpg-matematika.html).
--    2. Učitel ji čte v záložce ZPĚTNÁ VAZBA učitelské konzole.
-- ═══════════════════════════════════════════════════════════════
