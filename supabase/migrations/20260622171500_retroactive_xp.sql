-- ============================================================
-- NECTARY — Migración: Retroactive XP Data Migration (M5)
-- Descripción: Otorga XP retroactivamente a todos los registros existentes.
-- ============================================================

DO $$
BEGIN

  -- 1. Sparks
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  SELECT 
    author_id, 
    'publish_spark', 
    (SELECT points FROM xp_config WHERE action_type = 'publish_spark'), 
    id, 
    'publish_spark:' || id
  FROM sparks
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- 2. WIPs
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  SELECT 
    author_id, 
    'publish_wip', 
    (SELECT points FROM xp_config WHERE action_type = 'publish_wip'), 
    id, 
    'publish_wip:' || id
  FROM wips
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- 3. Post-Mortems
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  SELECT 
    author_id, 
    'publish_post_mortem', 
    (SELECT points FROM xp_config WHERE action_type = 'publish_post_mortem'), 
    id, 
    'publish_post_mortem:' || id
  FROM post_mortems
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- 4. Reacciones (5 XP al autor del contenido, no al que reacciona)
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  SELECT 
    target_author.author_id,
    'receive_reaction', 
    (SELECT points FROM xp_config WHERE action_type = 'receive_reaction'), 
    r.id, 
    'receive_reaction:' || r.id
  FROM reactions r
  LEFT JOIN LATERAL (
    SELECT author_id FROM sparks WHERE id = r.target_id AND r.target_type = 'spark'
    UNION ALL
    SELECT author_id FROM wips WHERE id = r.target_id AND r.target_type = 'wip'
    UNION ALL
    SELECT author_id FROM post_mortems WHERE id = r.target_id AND r.target_type = 'post-mortem'
  ) target_author ON true
  WHERE target_author.author_id IS NOT NULL 
    AND target_author.author_id != r.user_id
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- 5. Comentarios (10 XP al que comenta por ayudar en el WIP)
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  SELECT 
    c.author_id, 
    'receive_comment', 
    (SELECT points FROM xp_config WHERE action_type = 'receive_comment'), 
    c.id, 
    'receive_comment:' || c.id
  FROM wip_comments c
  JOIN wips w ON w.id = c.wip_id
  WHERE w.author_id != c.author_id
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- 6. Forks (Creados y Recibidos)
  -- 6a. Fork Created (al forker)
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  SELECT 
    forker_id, 
    'fork_created', 
    (SELECT points FROM xp_config WHERE action_type = 'fork_created'), 
    id, 
    'fork_created:' || id
  FROM forks
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- 6b. Fork Received (al autor original)
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  SELECT 
    target_author.author_id,
    'fork_received', 
    (SELECT points FROM xp_config WHERE action_type = 'fork_received'), 
    f.id, 
    'fork_received:' || f.id
  FROM forks f
  LEFT JOIN LATERAL (
    SELECT author_id FROM sparks WHERE id = f.source_id AND f.source_type = 'spark'
    UNION ALL
    SELECT author_id FROM wips WHERE id = f.source_id AND f.source_type = 'wip'
    UNION ALL
    SELECT author_id FROM post_mortems WHERE id = f.source_id AND f.source_type = 'post-mortem'
  ) target_author ON true
  WHERE target_author.author_id IS NOT NULL 
    AND target_author.author_id != f.forker_id
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- 7. WIP Resuelto
  INSERT INTO xp_events(user_id, action_type, points, reference_id, idempotency_key)
  SELECT 
    author_id, 
    'wip_resolved', 
    (SELECT points FROM xp_config WHERE action_type = 'wip_resolved'), 
    id, 
    'wip_resolved:' || id
  FROM wips
  WHERE status = 'resolved'
  ON CONFLICT (idempotency_key) DO NOTHING;

END;
$$;
