-- Seed data for Court Champions padel tournament app

-- Insert 8 players
INSERT INTO public.users (full_name, email, phone) VALUES
('Juan Pérez', 'juan.perez@email.com', '+34600123456'),
('María García', 'maria.garcia@email.com', '+34600123457'),
('Carlos López', 'carlos.lopez@email.com', '+34600123458'),
('Ana Martínez', 'ana.martinez@email.com', '+34600123459'),
('David Rodríguez', 'david.rodriguez@email.com', '+34600123460'),
('Laura Sánchez', 'laura.sanchez@email.com', '+34600123461'),
('Miguel Torres', 'miguel.torres@email.com', '+34600123462'),
('Carmen Ruiz', 'carmen.ruiz@email.com', '+34600123463');

-- Get player IDs for reference
WITH player_ids AS (
  SELECT 
    player_id,
    full_name,
    ROW_NUMBER() OVER (ORDER BY full_name) as rn
  FROM public.users
  WHERE full_name IN ('Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 
                      'David Rodríguez', 'Laura Sánchez', 'Miguel Torres', 'Carmen Ruiz')
)
-- Insert 1 tournament
INSERT INTO public.tournaments (name, starts_at, tournament_type, tournament_format)
SELECT 
  'Pozo Test Agosto 2025',
  '2025-08-20 10:00:00+02:00',
  'fast_tournament',
  'round_robin_per_pairs'
WHERE NOT EXISTS (SELECT 1 FROM public.tournaments WHERE name = 'Pozo Test Agosto 2025');

-- Create pairs for the tournament
WITH 
tournament_data AS (
  SELECT tournament_id FROM public.tournaments WHERE name = 'Pozo Test Agosto 2025'
),
player_ids AS (
  SELECT 
    player_id,
    full_name,
    ROW_NUMBER() OVER (ORDER BY full_name) as rn
  FROM public.users
  WHERE full_name IN ('Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 
                      'David Rodríguez', 'Laura Sánchez', 'Miguel Torres', 'Carmen Ruiz')
),
pairs_data AS (
  SELECT 
    t.tournament_id,
    p1.player_id as player1_id,
    p2.player_id as player2_id,
    p1.full_name || ' / ' || p2.full_name as pair_name
  FROM tournament_data t
  CROSS JOIN (
    VALUES 
      (1, 2), -- Juan / María
      (3, 4), -- Carlos / Ana  
      (5, 6), -- David / Laura
      (7, 8)  -- Miguel / Carmen
  ) AS pair_numbers(p1_num, p2_num)
  JOIN player_ids p1 ON p1.rn = pair_numbers.p1_num
  JOIN player_ids p2 ON p2.rn = pair_numbers.p2_num
)
INSERT INTO public.pairs (tournament_id, player1_id, player2_id)
SELECT tournament_id, player1_id, player2_id
FROM pairs_data;

-- Create tournament enrollments
WITH 
tournament_data AS (
  SELECT tournament_id FROM public.tournaments WHERE name = 'Pozo Test Agosto 2025'
),
player_pairs AS (
  SELECT 
    p.tournament_id,
    p.pair_id,
    u1.player_id as player1_id,
    u2.player_id as player2_id
  FROM public.pairs p
  JOIN public.users u1 ON u1.player_id = p.player1_id
  JOIN public.users u2 ON u2.player_id = p.player2_id
  JOIN tournament_data t ON t.tournament_id = p.tournament_id
),
enrollments_data AS (
  -- Enroll player1 from each pair
  SELECT tournament_id, player1_id as player_id, pair_id
  FROM player_pairs
  UNION ALL
  -- Enroll player2 from each pair
  SELECT tournament_id, player2_id as player_id, pair_id
  FROM player_pairs
)
INSERT INTO public.tournament_enrollments (tournament_id, player_id, pair_id)
SELECT tournament_id, player_id, pair_id
FROM enrollments_data;

-- Create some sample matches
WITH 
tournament_data AS (
  SELECT tournament_id FROM public.tournaments WHERE name = 'Pozo Test Agosto 2025'
),
pairs_ordered AS (
  SELECT 
    p.pair_id,
    u1.full_name || ' / ' || u2.full_name as pair_name,
    ROW_NUMBER() OVER (ORDER BY p.created_at) as pair_number
  FROM public.pairs p
  JOIN public.users u1 ON u1.player_id = p.player1_id
  JOIN public.users u2 ON u2.player_id = p.player2_id
  JOIN tournament_data t ON t.tournament_id = p.tournament_id
),
matches_data AS (
  SELECT 
    t.tournament_id,
    p1.pair_id as pair_home_id,
    p2.pair_id as pair_away_id,
    CASE 
      WHEN p1.pair_number = 1 AND p2.pair_number = 2 THEN 6 -- Juan/María beat Carlos/Ana 6-4
      WHEN p1.pair_number = 3 AND p2.pair_number = 4 THEN 6 -- David/Laura beat Miguel/Carmen 6-2
      ELSE NULL
    END as home_games,
    CASE 
      WHEN p1.pair_number = 1 AND p2.pair_number = 2 THEN 4
      WHEN p1.pair_number = 3 AND p2.pair_number = 4 THEN 2
      ELSE NULL
    END as away_games
  FROM tournament_data t
  CROSS JOIN pairs_ordered p1
  CROSS JOIN pairs_ordered p2
  WHERE p1.pair_number < p2.pair_number
  AND (
    (p1.pair_number = 1 AND p2.pair_number = 2) OR
    (p1.pair_number = 3 AND p2.pair_number = 4)
  )
)
INSERT INTO public.matches (tournament_id, pair_home_id, pair_away_id, home_games, away_games)
SELECT tournament_id, pair_home_id, pair_away_id, home_games, away_games
FROM matches_data;

-- Initialize tournament stats for all players
WITH 
tournament_data AS (
  SELECT tournament_id FROM public.tournaments WHERE name = 'Pozo Test Agosto 2025'
),
player_stats AS (
  SELECT 
    te.tournament_id,
    te.player_id,
    COALESCE(SUM(ms.match_won * 3), 0) as points -- 3 points per match won
  FROM public.tournament_enrollments te
  LEFT JOIN public.match_stats ms ON ms.player_id = te.player_id AND ms.tournament_id = te.tournament_id
  GROUP BY te.tournament_id, te.player_id
)
INSERT INTO public.tournament_stats (tournament_id, player_id, points)
SELECT tournament_id, player_id, points
FROM player_stats;