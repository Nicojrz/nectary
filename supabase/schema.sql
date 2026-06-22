-- ============================================================
-- NECTARY — Esquema Senior v2
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSIONES
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- búsqueda fuzzy / ILIKE rápido
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- normaliza tildes para búsqueda
CREATE EXTENSION IF NOT EXISTS "ltree";      -- árbol de forks estructurado

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
CREATE TYPE literary_category AS ENUM ('cuento','poesia','novela','ensayo');
CREATE TYPE wip_status        AS ENUM ('in-progress','blocked','resolved');
CREATE TYPE creative_state    AS ENUM ('flow','mild-block','severe-block');
CREATE TYPE post_type         AS ENUM ('spark','wip','post-mortem');
CREATE TYPE notification_type AS ENUM ('comment','fork','reaction','xp','badge','system');

-- Enum tipado para XP (evita strings mágicos en la app)
CREATE TYPE xp_action_type AS ENUM (
  'publish_spark',
  'publish_wip',
  'publish_post_mortem',
  'receive_reaction',
  'receive_comment',
  'fork_created',      -- quien forkea recibe XP
  'fork_received',     -- autor del original recibe XP
  'wip_resolved',
  'post_mortem_unblocked' -- alguien marcó "me desbloqueó"
);

-- ------------------------------------------------------------
-- FUNCIÓN UTILITARIA: updated_at automático
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- ------------------------------------------------------------
-- TABLA: profiles
-- ------------------------------------------------------------
CREATE TABLE profiles (
  id             UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT         NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  avatar_url     TEXT,
  bio            TEXT         CHECK (char_length(bio) <= 500),
  categories     literary_category[] NOT NULL DEFAULT '{}',
  creative_state creative_state      NOT NULL DEFAULT 'flow',
  xp_total       INTEGER      NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
  level          SMALLINT     NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 50),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_profiles_xp ON profiles(xp_total DESC);
COMMENT ON TABLE profiles IS 'Perfil público del escritor. xp_total/level se actualizan por trigger desde xp_events.';

-- ------------------------------------------------------------
-- TABLA: sparks  (soft delete con deleted_at)
-- ------------------------------------------------------------
CREATE TABLE sparks (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content        TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  categories     literary_category[] NOT NULL CHECK (array_length(categories,1) >= 1),
  tags           TEXT[]      NOT NULL DEFAULT '{}',
  fork_count     INTEGER     NOT NULL DEFAULT 0 CHECK (fork_count >= 0),
  -- FTS: columna generada y mantenida por trigger
  search_vector  TSVECTOR,
  -- Soft delete: null = activo (CU-FK-01 A2: árbol persiste)
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sparks_author     ON sparks(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sparks_created    ON sparks(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_sparks_categories ON sparks USING GIN(categories);
CREATE INDEX idx_sparks_fts        ON sparks USING GIN(search_vector);
CREATE INDEX idx_sparks_tags       ON sparks USING GIN(tags);
COMMENT ON TABLE sparks IS 'Micro-posts de texto. Soft delete preserva árbol de forks.';

-- ------------------------------------------------------------
-- TABLA: wips  (soft delete)
-- ------------------------------------------------------------
CREATE TABLE wips (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description    TEXT        NOT NULL CHECK (char_length(description) >= 1),
  current_block  TEXT        CHECK (char_length(current_block) <= 1000),
  status         wip_status  NOT NULL DEFAULT 'in-progress',
  categories     literary_category[] NOT NULL CHECK (array_length(categories,1) >= 1),
  tags           TEXT[]      NOT NULL DEFAULT '{}',
  comment_count  INTEGER     NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  fork_count     INTEGER     NOT NULL DEFAULT 0 CHECK (fork_count >= 0),
  -- Enlace bidireccional al PM (CU-WP-03)
  post_mortem_id UUID,       -- FK añadida post-creación de post_mortems
  is_draft       BOOLEAN     NOT NULL DEFAULT FALSE,
  version        SMALLINT    NOT NULL DEFAULT 1 CHECK (version >= 1),
  search_vector  TSVECTOR,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_wips_updated_at
  BEFORE UPDATE ON wips FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_wips_author     ON wips(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_wips_created    ON wips(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_wips_status     ON wips(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_wips_categories ON wips USING GIN(categories);
CREATE INDEX idx_wips_fts        ON wips USING GIN(search_vector);
COMMENT ON TABLE wips IS 'Proyectos en progreso. is_draft oculta del feed público.';

-- ------------------------------------------------------------
-- TABLA: wip_versions
-- Cada comentario apunta a la revisión exacta que fue evaluada (RNF-WP-01)
-- ------------------------------------------------------------
CREATE TABLE wip_versions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wip_id        UUID        NOT NULL REFERENCES wips(id) ON DELETE CASCADE,
  version       SMALLINT    NOT NULL CHECK (version >= 1),
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  current_block TEXT,
  categories    literary_category[] NOT NULL,
  edited_by     UUID        NOT NULL REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wip_id, version)
);
CREATE INDEX idx_wip_versions_wip ON wip_versions(wip_id, version DESC);

CREATE OR REPLACE FUNCTION bump_wip_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_wip_bump_version
  BEFORE UPDATE ON wips FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title
     OR OLD.description IS DISTINCT FROM NEW.description
     OR OLD.current_block IS DISTINCT FROM NEW.current_block
     OR OLD.categories IS DISTINCT FROM NEW.categories)
  EXECUTE FUNCTION bump_wip_version();

CREATE OR REPLACE FUNCTION capture_wip_version()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO wip_versions(
    wip_id, version, title, description, current_block, categories, edited_by
  ) VALUES (
    NEW.id, NEW.version, NEW.title, NEW.description, NEW.current_block,
    NEW.categories, COALESCE(auth.uid(), NEW.author_id)
  );
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_wip_capture_initial
  AFTER INSERT ON wips FOR EACH ROW EXECUTE FUNCTION capture_wip_version();
CREATE TRIGGER trg_wip_capture_update
  AFTER UPDATE ON wips FOR EACH ROW
  WHEN (OLD.version IS DISTINCT FROM NEW.version)
  EXECUTE FUNCTION capture_wip_version();

-- ------------------------------------------------------------
-- TABLA: wip_comments  (soft delete)
-- CU-WP-02: autor no puede comentar su propio WIP → trigger (no CHECK)
-- BUG v1: CHECK con subquery es inválido en PostgreSQL
-- ------------------------------------------------------------
CREATE TABLE wip_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wip_id     UUID        NOT NULL REFERENCES wips(id) ON DELETE CASCADE,
  wip_version SMALLINT   NOT NULL DEFAULT 1,
  author_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_comment_wip_version
    FOREIGN KEY (wip_id, wip_version) REFERENCES wip_versions(wip_id, version)
);
CREATE INDEX idx_comments_wip ON wip_comments(wip_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON wip_comments(author_id);

-- Trigger: bloquea auto-comentario (reemplaza el CHECK inválido de v1)
CREATE OR REPLACE FUNCTION prevent_self_comment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.author_id = (SELECT author_id FROM wips WHERE id = NEW.wip_id) THEN
    RAISE EXCEPTION 'El autor no puede comentar en su propio WIP (CU-WP-02)';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_no_self_comment
  BEFORE INSERT ON wip_comments FOR EACH ROW EXECUTE FUNCTION prevent_self_comment();

-- ------------------------------------------------------------
-- TABLA: post_mortems  (soft delete)
-- ------------------------------------------------------------
CREATE TABLE post_mortems (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  context         TEXT        NOT NULL CHECK (char_length(context) >= 1),
  failed_attempts TEXT        NOT NULL CHECK (char_length(failed_attempts) >= 1),
  solution        TEXT        NOT NULL CHECK (char_length(solution) >= 1),
  lessons_learned TEXT        NOT NULL CHECK (char_length(lessons_learned) >= 1),
  categories      literary_category[] NOT NULL CHECK (array_length(categories,1) >= 1),
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  wip_origin_id   UUID        REFERENCES wips(id) ON DELETE SET NULL,
  unblocked_count INTEGER     NOT NULL DEFAULT 0 CHECK (unblocked_count >= 0),
  version         SMALLINT    NOT NULL DEFAULT 1,
  search_vector   TSVECTOR,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_pm_updated_at
  BEFORE UPDATE ON post_mortems FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_pm_author  ON post_mortems(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_created ON post_mortems(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_wip     ON post_mortems(wip_origin_id);
CREATE UNIQUE INDEX uq_pm_wip_origin ON post_mortems(wip_origin_id)
  WHERE wip_origin_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_pm_fts     ON post_mortems USING GIN(search_vector);
COMMENT ON TABLE post_mortems IS '4 secciones obligatorias. Versionado en post_mortem_versions.';

-- FK bidireccional wips ↔ post_mortems
ALTER TABLE wips ADD CONSTRAINT fk_wips_post_mortem
  FOREIGN KEY (post_mortem_id) REFERENCES post_mortems(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- TABLA: post_mortem_versions  (historial CU-PM-01 A2)
-- BUG v1: solo existía campo version sin almacenar el contenido anterior
-- ------------------------------------------------------------
CREATE TABLE post_mortem_versions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_mortem_id  UUID        NOT NULL REFERENCES post_mortems(id) ON DELETE CASCADE,
  version         SMALLINT    NOT NULL,
  title           TEXT        NOT NULL,
  context         TEXT        NOT NULL,
  failed_attempts TEXT        NOT NULL,
  solution        TEXT        NOT NULL,
  lessons_learned TEXT        NOT NULL,
  edited_by       UUID        NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_mortem_id, version)
);
CREATE INDEX idx_pmv_pm ON post_mortem_versions(post_mortem_id, version DESC);
COMMENT ON TABLE post_mortem_versions IS 'Historial inmutable de ediciones de Post-Mortems (CU-PM-01 A2).';

-- Versionado: incrementa la revisión y conserva cada estado publicado.
CREATE OR REPLACE FUNCTION bump_post_mortem_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_pm_bump_version
  BEFORE UPDATE ON post_mortems FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title
     OR OLD.context IS DISTINCT FROM NEW.context
     OR OLD.solution IS DISTINCT FROM NEW.solution
     OR OLD.failed_attempts IS DISTINCT FROM NEW.failed_attempts
     OR OLD.lessons_learned IS DISTINCT FROM NEW.lessons_learned
     OR OLD.categories IS DISTINCT FROM NEW.categories)
  EXECUTE FUNCTION bump_post_mortem_version();

CREATE OR REPLACE FUNCTION capture_post_mortem_version()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO post_mortem_versions(
    post_mortem_id, version, title, context,
    failed_attempts, solution, lessons_learned, edited_by
  ) VALUES (
    NEW.id, NEW.version, NEW.title, NEW.context,
    NEW.failed_attempts, NEW.solution, NEW.lessons_learned,
    COALESCE(auth.uid(), NEW.author_id)
  );
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_pm_capture_initial
  AFTER INSERT ON post_mortems FOR EACH ROW
  EXECUTE FUNCTION capture_post_mortem_version();
CREATE TRIGGER trg_pm_capture_update
  AFTER UPDATE ON post_mortems FOR EACH ROW
  WHEN (OLD.version IS DISTINCT FROM NEW.version)
  EXECUTE FUNCTION capture_post_mortem_version();

-- Mantiene visible el vínculo en ambos sentidos (RF-PM-02).
CREATE OR REPLACE FUNCTION link_post_mortem_wip()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.wip_origin_id IS DISTINCT FROM NEW.wip_origin_id
     AND OLD.wip_origin_id IS NOT NULL THEN
    UPDATE wips SET post_mortem_id = NULL
    WHERE id = OLD.wip_origin_id AND post_mortem_id = NEW.id;
  END IF;
  IF NEW.wip_origin_id IS NOT NULL THEN
    UPDATE wips SET post_mortem_id = NEW.id WHERE id = NEW.wip_origin_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_pm_link_wip
  AFTER INSERT OR UPDATE OF wip_origin_id ON post_mortems FOR EACH ROW
  EXECUTE FUNCTION link_post_mortem_wip();

-- ------------------------------------------------------------
-- TABLA: forks  (árbol con ltree)
-- BUG v1: source_id/result_id sin FK real → validación por trigger
-- ------------------------------------------------------------
CREATE TABLE forks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  forker_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_id   UUID        NOT NULL,
  source_type post_type   NOT NULL,
  source_version SMALLINT NOT NULL DEFAULT 1 CHECK (source_version >= 1),
  result_id   UUID        NOT NULL,
  result_type post_type   NOT NULL,
  motivation  TEXT        NOT NULL CHECK (char_length(motivation) BETWEEN 1 AND 500),
  -- ltree path: permite consultas eficientes de árbol completo
  -- Ej: 'root_id.parent_id.this_id' (UUIDs sin guiones)
  tree_path   LTREE       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT forks_one_per_source_version UNIQUE (forker_id, source_id, source_type, source_version)
);
CREATE INDEX idx_forks_source    ON forks(source_id, source_type);
CREATE INDEX idx_forks_result    ON forks(result_id);
CREATE INDEX idx_forks_tree_path ON forks USING GIST(tree_path);
COMMENT ON TABLE forks IS 'ltree tree_path permite consultar ancestros/descendientes en O(log n).';

-- ------------------------------------------------------------
-- TABLA: reactions (polimórfica con validación por trigger)
-- BUG v1: target_id sin FK real → ahora con trigger de validación
-- ------------------------------------------------------------
CREATE TABLE reactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id   UUID        NOT NULL,
  target_type post_type   NOT NULL,
  emoji       TEXT        NOT NULL CHECK (emoji IN ('✍️','💡','🔥','🌱','🎯','📖','🧩','👏')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_id, emoji)
);
CREATE INDEX idx_reactions_target ON reactions(target_id, target_type);
CREATE INDEX idx_reactions_user   ON reactions(user_id);

-- Trigger: valida que target_id existe según target_type
CREATE OR REPLACE FUNCTION validate_reaction_target()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.target_type = 'spark' AND NOT EXISTS (
    SELECT 1 FROM sparks WHERE id = NEW.target_id AND deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'Spark no encontrado o eliminado';
  ELSIF NEW.target_type = 'wip' AND NOT EXISTS (
    SELECT 1 FROM wips WHERE id = NEW.target_id AND deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'WIP no encontrado o eliminado';
  ELSIF NEW.target_type = 'post-mortem' AND NOT EXISTS (
    SELECT 1 FROM post_mortems WHERE id = NEW.target_id AND deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'Post-Mortem no encontrado o eliminado';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_reaction
  BEFORE INSERT ON reactions FOR EACH ROW EXECUTE FUNCTION validate_reaction_target();

-- ------------------------------------------------------------
-- TABLA: xp_events (tipado con enum)
-- BUG v1: action_type era TEXT sin validación
-- BUG v1: trigger hacía 2 UPDATEs separados → ahora 1
-- ------------------------------------------------------------
CREATE TABLE xp_events (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type     xp_action_type NOT NULL,
  points          SMALLINT       NOT NULL CHECK (points > 0),
  reference_id    UUID,
  idempotency_key TEXT           NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_xp_user ON xp_events(user_id, created_at DESC);

-- Tabla de puntos por acción (configurable sin deploy)
CREATE TABLE xp_config (
  action_type xp_action_type PRIMARY KEY,
  points      SMALLINT        NOT NULL CHECK (points > 0)
);
INSERT INTO xp_config VALUES
  ('publish_spark',            10),
  ('publish_wip',              20),
  ('publish_post_mortem',      30),
  ('receive_reaction',          5),
  ('receive_comment',          10),
  ('fork_created',             15),
  ('fork_received',            10),
  ('wip_resolved',             25),
  ('post_mortem_unblocked',    20);

-- Trigger XP: 1 solo UPDATE con cálculo de nivel integrado
CREATE OR REPLACE FUNCTION accumulate_xp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles SET
    xp_total = xp_total + NEW.points,
    level    = LEAST(FLOOR((xp_total + NEW.points) / 100.0) + 1, 50)::SMALLINT
  WHERE id = NEW.user_id;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_xp_accumulate
  AFTER INSERT ON xp_events FOR EACH ROW EXECUTE FUNCTION accumulate_xp();

-- "Me desbloqueó": contador durable + XP idempotente para el autor (RF-PM-04).
CREATE OR REPLACE FUNCTION maintain_post_mortem_useful()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pm_author UUID;
  xp_points SMALLINT;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post-mortem' AND NEW.emoji = '🔥' THEN
    SELECT author_id INTO pm_author FROM post_mortems WHERE id = NEW.target_id;
    IF pm_author = NEW.user_id THEN
      RAISE EXCEPTION 'No puedes marcar como útil tu propio Post-Mortem';
    END IF;
    UPDATE post_mortems SET unblocked_count = unblocked_count + 1 WHERE id = NEW.target_id;
    SELECT points INTO xp_points FROM xp_config WHERE action_type = 'post_mortem_unblocked';
    INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
    VALUES (
      pm_author, 'post_mortem_unblocked', xp_points, NEW.target_id,
      'post_mortem_unblocked:' || NEW.user_id || ':' || NEW.target_id
    ) ON CONFLICT (idempotency_key) DO NOTHING;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post-mortem' AND OLD.emoji = '🔥' THEN
    UPDATE post_mortems SET unblocked_count = GREATEST(unblocked_count - 1, 0)
    WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_post_mortem_useful
  AFTER INSERT OR DELETE ON reactions FOR EACH ROW
  EXECUTE FUNCTION maintain_post_mortem_useful();

-- ------------------------------------------------------------
-- TABLA: badges y user_badges
-- ------------------------------------------------------------
CREATE TABLE badges (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT    NOT NULL UNIQUE,  -- identificador estable para el código
  name          TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  icon          TEXT    NOT NULL,
  xp_threshold  INTEGER NOT NULL DEFAULT 0
);
INSERT INTO badges(slug, name, description, icon, xp_threshold) VALUES
  ('first_spark',    'Primera chispa',     'Publicaste tu primer Spark',          '✍️',   0),
  ('first_wip',      'En progreso',        'Publicaste tu primer WIP',            '📖',   0),
  ('first_pm',       'Reflexión',          'Publicaste tu primer Post-Mortem',    '💡',   0),
  ('unblocker',      'Desbloqueador',      'Tu PM desbloqueó a alguien',          '🔥', 100),
  ('forker',         'Bifurcador',         'Hiciste fork de una idea',            '🌱',  50),
  ('level_5',        'Nivel 5',            'Alcanzaste el nivel 5',               '🎯', 500),
  ('level_10',       'Nivel 10',           'Alcanzaste el nivel 10',              '🧩',1500);

CREATE TABLE user_badges (
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id   UUID        NOT NULL REFERENCES badges(id)   ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- ------------------------------------------------------------
-- TABLA: notifications
-- ------------------------------------------------------------
CREATE TABLE notifications (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         notification_type NOT NULL,
  message      TEXT              NOT NULL,
  reference_id UUID,
  read         BOOLEAN           NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_user ON notifications(user_id, read, created_at DESC);

-- ------------------------------------------------------------
-- TRIGGERS: FTS (full-text search) con unaccent
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_spark_fts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.content,''))), 'A') ||
    setweight(to_tsvector('spanish', unaccent(array_to_string(NEW.tags,' '))), 'B');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_spark_fts BEFORE INSERT OR UPDATE ON sparks
  FOR EACH ROW EXECUTE FUNCTION update_spark_fts();

CREATE OR REPLACE FUNCTION update_wip_fts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.title,''))), 'A') ||
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.description,''))), 'B') ||
    setweight(to_tsvector('spanish', unaccent(array_to_string(NEW.tags,' '))), 'C');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_wip_fts BEFORE INSERT OR UPDATE ON wips
  FOR EACH ROW EXECUTE FUNCTION update_wip_fts();

CREATE OR REPLACE FUNCTION update_pm_fts()
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
CREATE TRIGGER trg_pm_fts BEFORE INSERT OR UPDATE ON post_mortems
  FOR EACH ROW EXECUTE FUNCTION update_pm_fts();

-- ------------------------------------------------------------
-- TRIGGER: comment_count y fork_count
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION maintain_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE wips SET comment_count = comment_count + 1 WHERE id = NEW.wip_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE wips SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = NEW.wip_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_comment_count
  AFTER INSERT OR UPDATE ON wip_comments
  FOR EACH ROW EXECUTE FUNCTION maintain_comment_count();

CREATE OR REPLACE FUNCTION maintain_fork_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.source_type = 'spark' THEN
    UPDATE sparks SET fork_count = fork_count + 1 WHERE id = NEW.source_id;
  ELSIF NEW.source_type = 'wip' THEN
    UPDATE wips   SET fork_count = fork_count + 1 WHERE id = NEW.source_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_fork_count
  AFTER INSERT ON forks FOR EACH ROW EXECUTE FUNCTION maintain_fork_count();

-- ------------------------------------------------------------
-- TRIGGER: auto-crear perfil al registrar usuario en Auth
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles(id, name, avatar_url) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ------------------------------------------------------------
-- VISTA MATERIALIZADA: leaderboard (costosa → cacheada)
-- Refrescar periódicamente: SELECT refresh_leaderboard();
-- ------------------------------------------------------------
CREATE MATERIALIZED VIEW leaderboard AS
SELECT
  ROW_NUMBER() OVER (ORDER BY p.xp_total DESC) AS rank,
  p.id, p.name, p.avatar_url, p.level, p.xp_total,
  COUNT(DISTINCT s.id)  AS spark_count,
  COUNT(DISTINCT w.id)  AS wip_count,
  COUNT(DISTINCT pm.id) AS pm_count
FROM profiles p
LEFT JOIN sparks      s  ON s.author_id  = p.id AND s.deleted_at  IS NULL
LEFT JOIN wips        w  ON w.author_id  = p.id AND w.deleted_at  IS NULL AND w.is_draft = FALSE
LEFT JOIN post_mortems pm ON pm.author_id = p.id AND pm.deleted_at IS NULL
GROUP BY p.id, p.name, p.avatar_url, p.level, p.xp_total
ORDER BY p.xp_total DESC;

CREATE UNIQUE INDEX idx_leaderboard_id ON leaderboard(id);

CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void LANGUAGE sql AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;
$$;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE wips               ENABLE ROW LEVEL SECURITY;
ALTER TABLE wip_versions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE wip_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_mortems       ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_mortem_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges        ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_all"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id);

-- Sparks (excluye soft-deleted)
CREATE POLICY "sparks_select_public"  ON sparks FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "sparks_insert_own"     ON sparks FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "sparks_update_own"     ON sparks FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "sparks_delete_own"     ON sparks FOR DELETE USING (auth.uid() = author_id);

-- WIPs
CREATE POLICY "wips_select_public"    ON wips FOR SELECT
  USING (deleted_at IS NULL AND (is_draft = FALSE OR auth.uid() = author_id));
CREATE POLICY "wips_insert_own"       ON wips FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "wips_update_own"       ON wips FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "wips_delete_own"       ON wips FOR DELETE USING (auth.uid() = author_id);

-- WIP Versions (historial inmutable, solo lectura)
CREATE POLICY "wip_versions_select"   ON wip_versions FOR SELECT USING (true);

-- WIP Comments
CREATE POLICY "comments_select_all"   ON wip_comments FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "comments_insert_auth"  ON wip_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_update_own"   ON wip_comments FOR UPDATE USING (auth.uid() = author_id);

-- Post-Mortems
CREATE POLICY "pm_select_all"         ON post_mortems FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "pm_insert_own"         ON post_mortems FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "pm_update_own"         ON post_mortems FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "pm_delete_own"         ON post_mortems FOR DELETE USING (auth.uid() = author_id);

-- PM Versions (solo lectura, escritura por trigger con SECURITY DEFINER)
CREATE POLICY "pmv_select_all"        ON post_mortem_versions FOR SELECT USING (true);

-- Forks
CREATE POLICY "forks_select_all"      ON forks FOR SELECT USING (true);
CREATE POLICY "forks_insert_auth"     ON forks FOR INSERT WITH CHECK (auth.uid() = forker_id);

-- Reactions
CREATE POLICY "reactions_select_all"  ON reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert_auth" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete_own"  ON reactions FOR DELETE USING (auth.uid() = user_id);

-- XP (inmutable desde el cliente)
CREATE POLICY "xp_select_own"         ON xp_events FOR SELECT USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "notif_select_own"      ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own"      ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- User Badges
CREATE POLICY "badges_select_all"     ON user_badges FOR SELECT USING (true);

-- Catálogo de medallas (solo lectura pública)
CREATE POLICY "badge_catalog_select"  ON badges FOR SELECT USING (true);

-- Configuración de XP (solo lectura pública)
CREATE POLICY "xp_config_select"      ON xp_config FOR SELECT USING (true);

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

-- ============================================================
-- FIN DEL ESQUEMA v2
-- ============================================================
