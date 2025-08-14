-- Seed data for tournament application
-- This file contains demo data for testing and development

-- Insert 8 players (users)
INSERT INTO public.users (full_name, email, phone) VALUES
('Juan Pérez', 'juan.perez@email.com', '+34678123456'),
('María García', 'maria.garcia@email.com', '+34678123457'),
('Carlos Rodríguez', 'carlos.rodriguez@email.com', '+34678123458'),
('Ana Martínez', 'ana.martinez@email.com', '+34678123459'),
('Luis López', 'luis.lopez@email.com', '+34678123460'),
('Carmen Sánchez', 'carmen.sanchez@email.com', '+34678123461'),
('Pedro Gómez', 'pedro.gomez@email.com', '+34678123462'),
('Laura Fernández', 'laura.fernandez@email.com', '+34678123463');

-- Store player IDs for reference
DO $$
DECLARE
    player1_id UUID;
    player2_id UUID;
    player3_id UUID;
    player4_id UUID;
    player5_id UUID;
    player6_id UUID;
    player7_id UUID;
    player8_id UUID;
    tournament_id UUID;
    pair1_id UUID;
    pair2_id UUID;
    pair3_id UUID;
    pair4_id UUID;
    match1_id UUID;
    match2_id UUID;
BEGIN
    -- Get player IDs
    SELECT player_id INTO player1_id FROM public.users WHERE full_name = 'Juan Pérez';
    SELECT player_id INTO player2_id FROM public.users WHERE full_name = 'María García';
    SELECT player_id INTO player3_id FROM public.users WHERE full_name = 'Carlos Rodríguez';
    SELECT player_id INTO player4_id FROM public.users WHERE full_name = 'Ana Martínez';
    SELECT player_id INTO player5_id FROM public.users WHERE full_name = 'Luis López';
    SELECT player_id INTO player6_id FROM public.users WHERE full_name = 'Carmen Sánchez';
    SELECT player_id INTO player7_id FROM public.users WHERE full_name = 'Pedro Gómez';
    SELECT player_id INTO player8_id FROM public.users WHERE full_name = 'Laura Fernández';

    -- Insert 1 tournament
    INSERT INTO public.tournaments (name, starts_at, tournament_type, tournament_format)
    VALUES ('Pozo Test Agosto 2025', '2025-08-15 10:00:00+00', 'reg_tournament', 'round_robin_per_pairs')
    RETURNING tournament_id INTO tournament_id;

    -- Create 4 pairs for the tournament
    INSERT INTO public.pairs (tournament_id, player1_id, player2_id)
    VALUES 
        (tournament_id, player1_id, player2_id),
        (tournament_id, player3_id, player4_id),
        (tournament_id, player5_id, player6_id),
        (tournament_id, player7_id, player8_id);

    -- Get pair IDs
    SELECT pair_id INTO pair1_id FROM public.pairs WHERE tournament_id = tournament_id AND player1_id = player1_id;
    SELECT pair_id INTO pair2_id FROM public.pairs WHERE tournament_id = tournament_id AND player1_id = player3_id;
    SELECT pair_id INTO pair3_id FROM public.pairs WHERE tournament_id = tournament_id AND player1_id = player5_id;
    SELECT pair_id INTO pair4_id FROM public.pairs WHERE tournament_id = tournament_id AND player1_id = player7_id;

    -- Insert tournament enrollments (all 8 players registered)
    INSERT INTO public.tournament_enrollments (tournament_id, player_id, pair_id)
    VALUES 
        (tournament_id, player1_id, pair1_id),
        (tournament_id, player2_id, pair1_id),
        (tournament_id, player3_id, pair2_id),
        (tournament_id, player4_id, pair2_id),
        (tournament_id, player5_id, pair3_id),
        (tournament_id, player6_id, pair3_id),
        (tournament_id, player7_id, pair4_id),
        (tournament_id, player8_id, pair4_id);

    -- Insert a couple of completed matches with scores
    INSERT INTO public.matches (tournament_id, pair_home_id, pair_away_id, home_games, away_games)
    VALUES 
        (tournament_id, pair1_id, pair2_id, 6, 4),
        (tournament_id, pair3_id, pair4_id, 3, 6);

    -- Insert tournament stats for all players (initial points)
    INSERT INTO public.tournament_stats (tournament_id, player_id, points)
    VALUES 
        (tournament_id, player1_id, 3),  -- Juan (won match)
        (tournament_id, player2_id, 3),  -- María (won match)
        (tournament_id, player3_id, 0),  -- Carlos (lost match)
        (tournament_id, player4_id, 0),  -- Ana (lost match)
        (tournament_id, player5_id, 0),  -- Luis (lost match)
        (tournament_id, player6_id, 0),  -- Carmen (lost match)
        (tournament_id, player7_id, 3),  -- Pedro (won match)
        (tournament_id, player8_id, 3);  -- Laura (won match)

END $$;