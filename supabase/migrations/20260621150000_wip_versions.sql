-- RF-WP-02 / RNF-WP-01: durable comments tied to an immutable WIP revision.

ALTER TABLE public.wips
  ADD COLUMN IF NOT EXISTS version SMALLINT NOT NULL DEFAULT 1 CHECK (version >= 1);

CREATE TABLE IF NOT EXISTS public.wip_versions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wip_id        UUID        NOT NULL REFERENCES public.wips(id) ON DELETE CASCADE,
  version       SMALLINT    NOT NULL CHECK (version >= 1),
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  current_block TEXT,
  categories    literary_category[] NOT NULL,
  edited_by     UUID        NOT NULL REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wip_id, version)
);

CREATE INDEX IF NOT EXISTS idx_wip_versions_wip
  ON public.wip_versions(wip_id, version DESC);

-- Backfill the current state as version 1 before comments receive their FK.
INSERT INTO public.wip_versions(
  wip_id, version, title, description, current_block, categories, edited_by, created_at
)
SELECT id, version, title, description, current_block, categories, author_id, created_at
FROM public.wips
ON CONFLICT (wip_id, version) DO NOTHING;

ALTER TABLE public.wip_comments
  ADD COLUMN IF NOT EXISTS wip_version SMALLINT NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_comment_wip_version'
  ) THEN
    ALTER TABLE public.wip_comments
      ADD CONSTRAINT fk_comment_wip_version
      FOREIGN KEY (wip_id, wip_version)
      REFERENCES public.wip_versions(wip_id, version);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_wip_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wip_bump_version ON public.wips;
CREATE TRIGGER trg_wip_bump_version
  BEFORE UPDATE ON public.wips FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title
     OR OLD.description IS DISTINCT FROM NEW.description
     OR OLD.current_block IS DISTINCT FROM NEW.current_block
     OR OLD.categories IS DISTINCT FROM NEW.categories)
  EXECUTE FUNCTION public.bump_wip_version();

CREATE OR REPLACE FUNCTION public.capture_wip_version()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wip_versions(
    wip_id, version, title, description, current_block, categories, edited_by
  ) VALUES (
    NEW.id, NEW.version, NEW.title, NEW.description, NEW.current_block,
    NEW.categories, COALESCE(auth.uid(), NEW.author_id)
  )
  ON CONFLICT (wip_id, version) DO NOTHING;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_wip_capture_initial ON public.wips;
CREATE TRIGGER trg_wip_capture_initial
  AFTER INSERT ON public.wips FOR EACH ROW
  EXECUTE FUNCTION public.capture_wip_version();

DROP TRIGGER IF EXISTS trg_wip_capture_update ON public.wips;
CREATE TRIGGER trg_wip_capture_update
  AFTER UPDATE ON public.wips FOR EACH ROW
  WHEN (OLD.version IS DISTINCT FROM NEW.version)
  EXECUTE FUNCTION public.capture_wip_version();

ALTER TABLE public.wip_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wip_versions_select" ON public.wip_versions;
CREATE POLICY "wip_versions_select"
  ON public.wip_versions FOR SELECT USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.wip_versions FROM anon, authenticated;
GRANT SELECT ON public.wip_versions TO anon, authenticated;
