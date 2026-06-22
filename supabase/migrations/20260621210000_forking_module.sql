-- RF-FK-01..03 / RNF-FK-01..02: transactional, version-bound forks.

ALTER TABLE public.forks
  ADD COLUMN IF NOT EXISTS source_version SMALLINT NOT NULL DEFAULT 1
  CHECK (source_version >= 1);

ALTER TABLE public.forks
  DROP CONSTRAINT IF EXISTS forks_forker_id_source_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS forks_one_per_source_version
  ON public.forks(forker_id, source_id, source_type, source_version);

CREATE OR REPLACE FUNCTION public.create_fork(
  p_source_id UUID,
  p_source_type post_type,
  p_source_version SMALLINT,
  p_motivation TEXT,
  p_result JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_source_author UUID;
  v_result_id UUID := gen_random_uuid();
  v_fork_id UUID := gen_random_uuid();
  v_parent_path LTREE;
  v_tree_path LTREE;
  v_points SMALLINT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión' USING ERRCODE = '42501';
  END IF;
  IF p_source_type NOT IN ('spark'::post_type, 'wip'::post_type) THEN
    RAISE EXCEPTION 'Solo se pueden derivar Sparks y WIPs' USING ERRCODE = '22023';
  END IF;
  IF p_source_version IS NULL OR p_source_version < 1 THEN
    RAISE EXCEPTION 'La versión de origen no es válida' USING ERRCODE = '22023';
  END IF;
  IF char_length(btrim(COALESCE(p_motivation, ''))) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'La motivación debe tener entre 1 y 500 caracteres' USING ERRCODE = '22023';
  END IF;

  IF p_source_type = 'spark' THEN
    IF p_source_version <> 1 THEN
      RAISE EXCEPTION 'Los Sparks solo tienen la versión 1' USING ERRCODE = '22023';
    END IF;
    SELECT author_id INTO v_source_author
    FROM public.sparks WHERE id = p_source_id AND deleted_at IS NULL;
    IF v_source_author IS NULL THEN
      RAISE EXCEPTION 'Spark de origen no encontrado' USING ERRCODE = 'P0002';
    END IF;
    IF char_length(btrim(COALESCE(p_result->>'content', ''))) NOT BETWEEN 1 AND 2000 THEN
      RAISE EXCEPTION 'El Spark derivado debe tener entre 1 y 2000 caracteres' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.sparks(id, author_id, content, categories)
    VALUES (
      v_result_id, v_user, btrim(p_result->>'content'),
      ARRAY[(p_result->>'category')::literary_category]
    );
  ELSE
    SELECT author_id INTO v_source_author
    FROM public.wips WHERE id = p_source_id AND deleted_at IS NULL AND is_draft = FALSE;
    IF v_source_author IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.wip_versions
      WHERE wip_id = p_source_id AND version = p_source_version
    ) THEN
      RAISE EXCEPTION 'WIP o versión de origen no encontrados' USING ERRCODE = 'P0002';
    END IF;
    IF char_length(btrim(COALESCE(p_result->>'title', ''))) NOT BETWEEN 1 AND 200
       OR char_length(btrim(COALESCE(p_result->>'content', ''))) < 1 THEN
      RAISE EXCEPTION 'El WIP derivado necesita título y contenido' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.wips(
      id, author_id, title, description, current_block, status, categories, is_draft
    ) VALUES (
      v_result_id, v_user, btrim(p_result->>'title'), btrim(p_result->>'content'),
      NULLIF(btrim(COALESCE(p_result->>'currentBlock', '')), ''),
      COALESCE((p_result->>'status')::wip_status, 'in-progress'::wip_status),
      ARRAY[(p_result->>'category')::literary_category], FALSE
    );
  END IF;

  SELECT tree_path INTO v_parent_path
  FROM public.forks
  WHERE result_id = p_source_id AND result_type = p_source_type
  ORDER BY created_at DESC LIMIT 1;

  v_tree_path := COALESCE(
    v_parent_path,
    text2ltree(replace(p_source_id::TEXT, '-', ''))
  ) || text2ltree(replace(v_fork_id::TEXT, '-', ''));

  INSERT INTO public.forks(
    id, forker_id, source_id, source_type, source_version,
    result_id, result_type, motivation, tree_path
  ) VALUES (
    v_fork_id, v_user, p_source_id, p_source_type, p_source_version,
    v_result_id, p_source_type, btrim(p_motivation), v_tree_path
  );

  SELECT points INTO v_points FROM public.xp_config WHERE action_type = 'fork_created';
  INSERT INTO public.xp_events(user_id, action_type, points, reference_id, idempotency_key)
  VALUES (v_user, 'fork_created', v_points, v_fork_id, 'fork_created:' || v_fork_id)
  ON CONFLICT (idempotency_key) DO NOTHING;

  IF v_source_author <> v_user THEN
    SELECT points INTO v_points FROM public.xp_config WHERE action_type = 'fork_received';
    INSERT INTO public.xp_events(user_id, action_type, points, reference_id, idempotency_key)
    VALUES (v_source_author, 'fork_received', v_points, v_fork_id, 'fork_received:' || v_fork_id)
    ON CONFLICT (idempotency_key) DO NOTHING;

    INSERT INTO public.notifications(user_id, type, message, reference_id)
    VALUES (v_source_author, 'fork', 'Tu texto inspiró una nueva rama', v_result_id);
  END IF;

  RETURN jsonb_build_object(
    'forkId', v_fork_id,
    'resultId', v_result_id,
    'resultType', p_source_type,
    'sourceVersion', p_source_version
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_fork_tree(
  p_post_id UUID,
  p_post_type post_type
)
RETURNS TABLE (
  fork_id UUID,
  post_id UUID,
  post_type post_type,
  parent_post_id UUID,
  source_version SMALLINT,
  motivation TEXT,
  author_name TEXT,
  title TEXT,
  category literary_category,
  original_deleted BOOLEAN,
  depth INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_path LTREE;
  v_root_path LTREE;
  v_root_id UUID := p_post_id;
  v_root_type post_type := p_post_type;
BEGIN
  IF p_post_type NOT IN ('spark'::post_type, 'wip'::post_type) THEN
    RAISE EXCEPTION 'Tipo de texto no compatible' USING ERRCODE = '22023';
  END IF;

  SELECT f.tree_path INTO v_current_path
  FROM public.forks f
  WHERE f.result_id = p_post_id AND f.result_type = p_post_type
  ORDER BY f.created_at DESC LIMIT 1;

  IF v_current_path IS NOT NULL THEN
    v_root_path := subpath(v_current_path, 0, 1);
    SELECT f.source_id, f.source_type INTO v_root_id, v_root_type
    FROM public.forks f
    WHERE f.tree_path @> v_current_path
    ORDER BY nlevel(f.tree_path) ASC LIMIT 1;
  ELSE
    v_root_path := text2ltree(replace(p_post_id::TEXT, '-', ''));
  END IF;

  RETURN QUERY
  SELECT branch.* FROM (
  SELECT
    NULL::UUID AS fork_id,
    v_root_id AS post_id,
    v_root_type AS post_type,
    NULL::UUID AS parent_post_id,
    1::SMALLINT AS source_version,
    NULL::TEXT AS motivation,
    COALESCE(sp.name, wp.name, 'Autor desconocido')::TEXT AS author_name,
    CASE WHEN v_root_type = 'spark' THEN LEFT(s.content, 90) ELSE w.title END::TEXT AS title,
    CASE WHEN v_root_type = 'spark' THEN s.categories[1] ELSE w.categories[1] END AS category,
    CASE WHEN v_root_type = 'spark' THEN s.id IS NULL OR s.deleted_at IS NOT NULL ELSE w.id IS NULL OR w.deleted_at IS NOT NULL END AS original_deleted,
    0 AS depth,
    COALESCE(s.created_at, w.created_at) AS created_at
  FROM (SELECT 1) seed
  LEFT JOIN public.sparks s ON v_root_type = 'spark' AND s.id = v_root_id
  LEFT JOIN public.profiles sp ON sp.id = s.author_id
  LEFT JOIN public.wips w ON v_root_type = 'wip' AND w.id = v_root_id
  LEFT JOIN public.profiles wp ON wp.id = w.author_id

  UNION ALL

  SELECT
    f.id,
    f.result_id,
    f.result_type,
    f.source_id,
    f.source_version,
    f.motivation,
    COALESCE(sp.name, wp.name, 'Autor desconocido')::TEXT,
    CASE WHEN f.result_type = 'spark' THEN LEFT(s.content, 90) ELSE w.title END::TEXT,
    CASE WHEN f.result_type = 'spark' THEN s.categories[1] ELSE w.categories[1] END,
    CASE WHEN f.result_type = 'spark' THEN s.id IS NULL OR s.deleted_at IS NOT NULL ELSE w.id IS NULL OR w.deleted_at IS NOT NULL END,
    nlevel(f.tree_path) - 1,
    f.created_at
  FROM public.forks f
  LEFT JOIN public.sparks s ON f.result_type = 'spark' AND s.id = f.result_id
  LEFT JOIN public.profiles sp ON sp.id = s.author_id
  LEFT JOIN public.wips w ON f.result_type = 'wip' AND w.id = f.result_id
  LEFT JOIN public.profiles wp ON wp.id = w.author_id
  WHERE f.tree_path <@ v_root_path
  ) AS branch
  ORDER BY branch.depth, branch.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.create_fork(UUID, post_type, SMALLINT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_fork(UUID, post_type, SMALLINT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fork_tree(UUID, post_type) TO anon, authenticated;

-- Fork links are append-only, including for table owners using the API roles.
REVOKE UPDATE, DELETE ON public.forks FROM anon, authenticated;
