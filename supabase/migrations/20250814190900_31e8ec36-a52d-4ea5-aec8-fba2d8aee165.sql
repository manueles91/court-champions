-- Fix function security issues by setting search_path

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Update the matches_validate_winner function
CREATE OR REPLACE FUNCTION public.matches_validate_winner()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    -- If both home_games and away_games are set
    IF NEW.home_games IS NOT NULL AND NEW.away_games IS NOT NULL THEN
        IF NEW.home_games = NEW.away_games THEN
            -- It's a tie
            NEW.tie = true;
            NEW.winner_pair_id = NULL;
            NEW.loser_pair_id = NULL;
        ELSIF NEW.home_games > NEW.away_games THEN
            -- Home team wins
            NEW.tie = false;
            NEW.winner_pair_id = NEW.pair_home_id;
            NEW.loser_pair_id = NEW.pair_away_id;
        ELSE
            -- Away team wins
            NEW.tie = false;
            NEW.winner_pair_id = NEW.pair_away_id;
            NEW.loser_pair_id = NEW.pair_home_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Update the upsert_match_stat function
CREATE OR REPLACE FUNCTION public.upsert_match_stat(
    p_match_id UUID,
    p_player_id UUID,
    p_tournament_id UUID,
    p_games_won INTEGER,
    p_games_played INTEGER,
    p_match_won INTEGER
)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.match_stats (
        match_id, player_id, tournament_id, games_won, games_played, match_won, match_played
    ) VALUES (
        p_match_id, p_player_id, p_tournament_id, p_games_won, p_games_played, p_match_won, 1
    )
    ON CONFLICT (match_id, player_id) 
    DO UPDATE SET
        games_won = EXCLUDED.games_won,
        games_played = EXCLUDED.games_played,
        match_won = EXCLUDED.match_won,
        match_played = EXCLUDED.match_played;
END;
$$;

-- Update the sync_stats_on_match function
CREATE OR REPLACE FUNCTION public.sync_stats_on_match()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    home_player1_id UUID;
    home_player2_id UUID;
    away_player1_id UUID;
    away_player2_id UUID;
    home_won INTEGER;
    away_won INTEGER;
    total_games INTEGER;
BEGIN
    -- Only process if both game scores are set
    IF NEW.home_games IS NOT NULL AND NEW.away_games IS NOT NULL THEN
        -- Get player IDs from pairs
        SELECT player1_id, player2_id INTO home_player1_id, home_player2_id
        FROM public.pairs WHERE pair_id = NEW.pair_home_id;
        
        SELECT player1_id, player2_id INTO away_player1_id, away_player2_id
        FROM public.pairs WHERE pair_id = NEW.pair_away_id;
        
        -- Calculate match results
        total_games := NEW.home_games + NEW.away_games;
        home_won := CASE WHEN NEW.winner_pair_id = NEW.pair_home_id THEN 1 ELSE 0 END;
        away_won := CASE WHEN NEW.winner_pair_id = NEW.pair_away_id THEN 1 ELSE 0 END;
        
        -- Upsert stats for home pair players
        PERFORM public.upsert_match_stat(
            NEW.match_id, home_player1_id, NEW.tournament_id, 
            NEW.home_games, total_games, home_won
        );
        
        PERFORM public.upsert_match_stat(
            NEW.match_id, home_player2_id, NEW.tournament_id, 
            NEW.home_games, total_games, home_won
        );
        
        -- Upsert stats for away pair players
        PERFORM public.upsert_match_stat(
            NEW.match_id, away_player1_id, NEW.tournament_id, 
            NEW.away_games, total_games, away_won
        );
        
        PERFORM public.upsert_match_stat(
            NEW.match_id, away_player2_id, NEW.tournament_id, 
            NEW.away_games, total_games, away_won
        );
    END IF;
    
    RETURN NEW;
END;
$$;