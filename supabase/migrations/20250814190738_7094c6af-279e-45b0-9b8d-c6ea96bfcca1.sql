-- Create enums
CREATE TYPE public.tournament_type AS ENUM ('fast_tournament', 'reg_tournament', 'finals');
CREATE TYPE public.tournament_format AS ENUM ('round_robin_per_pairs');

-- Create users table
CREATE TABLE public.users (
    player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Business rule: disallow empty/blank names
    CONSTRAINT check_full_name_not_empty CHECK (trim(full_name) != '')
);

-- Unique index to reduce duplicates
CREATE UNIQUE INDEX idx_users_unique_identity ON public.users (
    lower(full_name), 
    coalesce(lower(email), ''), 
    coalesce(phone, '')
);

-- Create tournaments table
CREATE TABLE public.tournaments (
    tournament_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    starts_at TIMESTAMPTZ,
    tournament_type public.tournament_type,
    tournament_format public.tournament_format,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create pairs table
CREATE TABLE public.pairs (
    pair_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(tournament_id) ON DELETE CASCADE,
    player1_id UUID NOT NULL REFERENCES public.users(player_id) ON DELETE RESTRICT,
    player2_id UUID NOT NULL REFERENCES public.users(player_id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Business rule: players must be different
    CONSTRAINT check_different_players CHECK (player1_id != player2_id)
);

-- Unique constraint and index on pairs
CREATE UNIQUE INDEX idx_pairs_unique_per_tournament ON public.pairs (tournament_id, player1_id, player2_id);
CREATE INDEX idx_pairs_tournament ON public.pairs (tournament_id);

-- Create tournament_enrollments table
CREATE TABLE public.tournament_enrollments (
    registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(tournament_id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.users(player_id) ON DELETE RESTRICT,
    pair_id UUID NOT NULL REFERENCES public.pairs(pair_id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint and index on enrollments
CREATE UNIQUE INDEX idx_enrollments_unique_player_tournament ON public.tournament_enrollments (tournament_id, player_id);
CREATE INDEX idx_enrollments_tournament ON public.tournament_enrollments (tournament_id);

-- Create matches table
CREATE TABLE public.matches (
    match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(tournament_id) ON DELETE CASCADE,
    pair_home_id UUID NOT NULL REFERENCES public.pairs(pair_id) ON DELETE RESTRICT,
    pair_away_id UUID NOT NULL REFERENCES public.pairs(pair_id) ON DELETE RESTRICT,
    home_games INTEGER,
    away_games INTEGER,
    winner_pair_id UUID REFERENCES public.pairs(pair_id) ON DELETE RESTRICT,
    loser_pair_id UUID REFERENCES public.pairs(pair_id) ON DELETE RESTRICT,
    tie BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Business rules
    CONSTRAINT check_different_pairs CHECK (pair_home_id != pair_away_id),
    CONSTRAINT check_different_winner_loser CHECK (winner_pair_id != loser_pair_id)
);

-- Index on matches
CREATE INDEX idx_matches_tournament ON public.matches (tournament_id);

-- Create match_stats table
CREATE TABLE public.match_stats (
    stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.users(player_id) ON DELETE RESTRICT,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(tournament_id) ON DELETE CASCADE,
    games_won INTEGER NOT NULL DEFAULT 0,
    games_played INTEGER NOT NULL DEFAULT 0,
    match_won INTEGER NOT NULL DEFAULT 0,
    match_played INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Business rule: match_won can only be 0 or 1
    CONSTRAINT check_match_won_binary CHECK (match_won IN (0, 1))
);

-- Unique constraint and index on match_stats
CREATE UNIQUE INDEX idx_match_stats_unique ON public.match_stats (match_id, player_id);
CREATE INDEX idx_match_stats_player ON public.match_stats (player_id);

-- Create tournament_stats table
CREATE TABLE public.tournament_stats (
    tournament_stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(tournament_id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.users(player_id) ON DELETE RESTRICT,
    points INTEGER NOT NULL DEFAULT 0,
    position INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint and index on tournament_stats
CREATE UNIQUE INDEX idx_tournament_stats_unique ON public.tournament_stats (tournament_id, player_id);
CREATE INDEX idx_tournament_stats_ranking ON public.tournament_stats (tournament_id, points DESC, position);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON public.tournaments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create match validation trigger function
CREATE OR REPLACE FUNCTION public.matches_validate_winner()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for match validation
CREATE TRIGGER trigger_matches_validate_winner
    BEFORE INSERT OR UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.matches_validate_winner();

-- Create upsert function for match stats
CREATE OR REPLACE FUNCTION public.upsert_match_stat(
    p_match_id UUID,
    p_player_id UUID,
    p_tournament_id UUID,
    p_games_won INTEGER,
    p_games_played INTEGER,
    p_match_won INTEGER
)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql;

-- Create stats sync trigger function
CREATE OR REPLACE FUNCTION public.sync_stats_on_match()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for stats sync
CREATE TRIGGER trigger_sync_stats_on_match
    AFTER INSERT OR UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_stats_on_match();

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing public access for now, can be restricted later with authentication)
CREATE POLICY "Public access to users" ON public.users FOR ALL USING (true);
CREATE POLICY "Public access to tournaments" ON public.tournaments FOR ALL USING (true);
CREATE POLICY "Public access to pairs" ON public.pairs FOR ALL USING (true);
CREATE POLICY "Public access to tournament_enrollments" ON public.tournament_enrollments FOR ALL USING (true);
CREATE POLICY "Public access to matches" ON public.matches FOR ALL USING (true);
CREATE POLICY "Public access to match_stats" ON public.match_stats FOR ALL USING (true);
CREATE POLICY "Public access to tournament_stats" ON public.tournament_stats FOR ALL USING (true);