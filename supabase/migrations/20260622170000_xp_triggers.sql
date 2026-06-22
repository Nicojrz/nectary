-- ============================================================
-- NECTARY — Migración: Triggers de Gamificación (M5)
-- Descripción: Otorga XP automáticamente al realizar acciones.
-- ============================================================

-- 1. Spark (Publicar)
CREATE OR REPLACE FUNCTION grant_xp_on_spark()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE xp_pts SMALLINT;
BEGIN
  SELECT points INTO xp_pts FROM xp_config WHERE action_type = 'publish_spark';
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  VALUES (NEW.author_id, 'publish_spark', xp_pts, NEW.id, 'publish_spark:' || NEW.id)
  ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_xp_spark AFTER INSERT ON sparks FOR EACH ROW EXECUTE FUNCTION grant_xp_on_spark();

-- 2. WIP (Publicar)
CREATE OR REPLACE FUNCTION grant_xp_on_wip()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE xp_pts SMALLINT;
BEGIN
  SELECT points INTO xp_pts FROM xp_config WHERE action_type = 'publish_wip';
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  VALUES (NEW.author_id, 'publish_wip', xp_pts, NEW.id, 'publish_wip:' || NEW.id)
  ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_xp_wip AFTER INSERT ON wips FOR EACH ROW EXECUTE FUNCTION grant_xp_on_wip();

-- 3. Post-Mortem (Publicar)
CREATE OR REPLACE FUNCTION grant_xp_on_pm()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE xp_pts SMALLINT;
BEGIN
  SELECT points INTO xp_pts FROM xp_config WHERE action_type = 'publish_post_mortem';
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  VALUES (NEW.author_id, 'publish_post_mortem', xp_pts, NEW.id, 'publish_post_mortem:' || NEW.id)
  ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_xp_pm AFTER INSERT ON post_mortems FOR EACH ROW EXECUTE FUNCTION grant_xp_on_pm();

-- 4. Reacción (Recibir)
CREATE OR REPLACE FUNCTION grant_xp_on_reaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_author UUID; xp_pts SMALLINT;
BEGIN
  IF NEW.target_type = 'spark' THEN SELECT author_id INTO target_author FROM sparks WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'wip' THEN SELECT author_id INTO target_author FROM wips WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'post-mortem' THEN SELECT author_id INTO target_author FROM post_mortems WHERE id = NEW.target_id;
  END IF;

  IF target_author IS NOT NULL AND target_author != NEW.user_id THEN
    SELECT points INTO xp_pts FROM xp_config WHERE action_type = 'receive_reaction';
    INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
    VALUES (target_author, 'receive_reaction', xp_pts, NEW.id, 'receive_reaction:' || NEW.id)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_xp_reaction AFTER INSERT ON reactions FOR EACH ROW EXECUTE FUNCTION grant_xp_on_reaction();

-- 5. Comentario (Dar feedback)
CREATE OR REPLACE FUNCTION grant_xp_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_author UUID; xp_pts SMALLINT;
BEGIN
  SELECT author_id INTO target_author FROM wips WHERE id = NEW.wip_id;
  IF target_author IS NOT NULL AND target_author != NEW.author_id THEN
    SELECT points INTO xp_pts FROM xp_config WHERE action_type = 'receive_comment';
    INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
    VALUES (NEW.author_id, 'receive_comment', xp_pts, NEW.id, 'receive_comment:' || NEW.id)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_xp_comment AFTER INSERT ON wip_comments FOR EACH ROW EXECUTE FUNCTION grant_xp_on_comment();

-- 6. Fork (Crear y Recibir)
CREATE OR REPLACE FUNCTION grant_xp_on_fork()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_author UUID; created_pts SMALLINT; received_pts SMALLINT;
BEGIN
  SELECT points INTO created_pts FROM xp_config WHERE action_type = 'fork_created';
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  VALUES (NEW.forker_id, 'fork_created', created_pts, NEW.id, 'fork_created:' || NEW.id)
  ON CONFLICT (idempotency_key) DO NOTHING;

  IF NEW.source_type = 'spark' THEN SELECT author_id INTO target_author FROM sparks WHERE id = NEW.source_id;
  ELSIF NEW.source_type = 'wip' THEN SELECT author_id INTO target_author FROM wips WHERE id = NEW.source_id;
  ELSIF NEW.source_type = 'post-mortem' THEN SELECT author_id INTO target_author FROM post_mortems WHERE id = NEW.source_id;
  END IF;

  IF target_author IS NOT NULL AND target_author != NEW.forker_id THEN
    SELECT points INTO received_pts FROM xp_config WHERE action_type = 'fork_received';
    INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
    VALUES (target_author, 'fork_received', received_pts, NEW.id, 'fork_received:' || NEW.id)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_xp_fork AFTER INSERT ON forks FOR EACH ROW EXECUTE FUNCTION grant_xp_on_fork();

-- 7. WIP Resuelto
CREATE OR REPLACE FUNCTION grant_xp_on_wip_resolved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE xp_pts SMALLINT;
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    SELECT points INTO xp_pts FROM xp_config WHERE action_type = 'wip_resolved';
    INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
    VALUES (NEW.author_id, 'wip_resolved', xp_pts, NEW.id, 'wip_resolved:' || NEW.id)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_xp_wip_resolved AFTER UPDATE ON wips FOR EACH ROW EXECUTE FUNCTION grant_xp_on_wip_resolved();
