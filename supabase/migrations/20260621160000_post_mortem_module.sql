-- RF-PM-01..04 / RNF-PM-02: complete Post-Mortem persistence behavior.

CREATE UNIQUE INDEX IF NOT EXISTS uq_pm_wip_origin
  ON public.post_mortems(wip_origin_id)
  WHERE wip_origin_id IS NOT NULL AND deleted_at IS NULL;

-- Preserve the current state of existing Post-Mortems before replacing triggers.
INSERT INTO public.post_mortem_versions(
  post_mortem_id, version, title, context,
  failed_attempts, solution, lessons_learned, edited_by, created_at
)
SELECT id, version, title, context, failed_attempts, solution,
       lessons_learned, author_id, updated_at
FROM public.post_mortems
ON CONFLICT (post_mortem_id, version) DO NOTHING;

DROP TRIGGER IF EXISTS trg_pm_snapshot ON public.post_mortems;
DROP FUNCTION IF EXISTS public.snapshot_post_mortem();

CREATE OR REPLACE FUNCTION public.bump_post_mortem_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_bump_version ON public.post_mortems;
CREATE TRIGGER trg_pm_bump_version
  BEFORE UPDATE ON public.post_mortems FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title
     OR OLD.context IS DISTINCT FROM NEW.context
     OR OLD.solution IS DISTINCT FROM NEW.solution
     OR OLD.failed_attempts IS DISTINCT FROM NEW.failed_attempts
     OR OLD.lessons_learned IS DISTINCT FROM NEW.lessons_learned
     OR OLD.categories IS DISTINCT FROM NEW.categories)
  EXECUTE FUNCTION public.bump_post_mortem_version();

CREATE OR REPLACE FUNCTION public.capture_post_mortem_version()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.post_mortem_versions(
    post_mortem_id, version, title, context,
    failed_attempts, solution, lessons_learned, edited_by
  ) VALUES (
    NEW.id, NEW.version, NEW.title, NEW.context,
    NEW.failed_attempts, NEW.solution, NEW.lessons_learned,
    COALESCE(auth.uid(), NEW.author_id)
  ) ON CONFLICT (post_mortem_id, version) DO NOTHING;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_capture_initial ON public.post_mortems;
CREATE TRIGGER trg_pm_capture_initial
  AFTER INSERT ON public.post_mortems FOR EACH ROW
  EXECUTE FUNCTION public.capture_post_mortem_version();

DROP TRIGGER IF EXISTS trg_pm_capture_update ON public.post_mortems;
CREATE TRIGGER trg_pm_capture_update
  AFTER UPDATE ON public.post_mortems FOR EACH ROW
  WHEN (OLD.version IS DISTINCT FROM NEW.version)
  EXECUTE FUNCTION public.capture_post_mortem_version();

CREATE OR REPLACE FUNCTION public.link_post_mortem_wip()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.wip_origin_id IS DISTINCT FROM NEW.wip_origin_id
     AND OLD.wip_origin_id IS NOT NULL THEN
    UPDATE public.wips SET post_mortem_id = NULL
    WHERE id = OLD.wip_origin_id AND post_mortem_id = NEW.id;
  END IF;
  IF NEW.wip_origin_id IS NOT NULL THEN
    UPDATE public.wips SET post_mortem_id = NEW.id WHERE id = NEW.wip_origin_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_link_wip ON public.post_mortems;
CREATE TRIGGER trg_pm_link_wip
  AFTER INSERT OR UPDATE OF wip_origin_id ON public.post_mortems FOR EACH ROW
  EXECUTE FUNCTION public.link_post_mortem_wip();

-- Backfill the reverse link for existing rows.
UPDATE public.wips w
SET post_mortem_id = pm.id
FROM public.post_mortems pm
WHERE pm.wip_origin_id = w.id AND pm.deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.maintain_post_mortem_useful()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pm_author UUID;
  xp_points SMALLINT;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post-mortem' AND NEW.emoji = '🔥' THEN
    SELECT author_id INTO pm_author FROM public.post_mortems WHERE id = NEW.target_id;
    IF pm_author = NEW.user_id THEN
      RAISE EXCEPTION 'No puedes marcar como útil tu propio Post-Mortem';
    END IF;
    UPDATE public.post_mortems SET unblocked_count = unblocked_count + 1 WHERE id = NEW.target_id;
    SELECT points INTO xp_points FROM public.xp_config WHERE action_type = 'post_mortem_unblocked';
    INSERT INTO public.xp_events(user_id, action_type, points, reference_id, idempotency_key)
    VALUES (
      pm_author, 'post_mortem_unblocked', xp_points, NEW.target_id,
      'post_mortem_unblocked:' || NEW.user_id || ':' || NEW.target_id
    ) ON CONFLICT (idempotency_key) DO NOTHING;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post-mortem' AND OLD.emoji = '🔥' THEN
    UPDATE public.post_mortems SET unblocked_count = GREATEST(unblocked_count - 1, 0)
    WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_mortem_useful ON public.reactions;
CREATE TRIGGER trg_post_mortem_useful
  AFTER INSERT OR DELETE ON public.reactions FOR EACH ROW
  EXECUTE FUNCTION public.maintain_post_mortem_useful();

CREATE OR REPLACE FUNCTION public.update_pm_fts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.title,''))), 'A') ||
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.context,''))), 'B') ||
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.solution,''))), 'B') ||
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.failed_attempts,''))), 'C') ||
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.lessons_learned,''))), 'C') ||
    setweight(to_tsvector('spanish', unaccent(array_to_string(NEW.tags,' '))), 'D');
  RETURN NEW;
END;
$$;

ALTER TABLE public.post_mortems DISABLE TRIGGER trg_pm_updated_at;
UPDATE public.post_mortems SET updated_at = updated_at;
ALTER TABLE public.post_mortems ENABLE TRIGGER trg_pm_updated_at;
