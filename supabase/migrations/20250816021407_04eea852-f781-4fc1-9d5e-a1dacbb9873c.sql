-- Create enums
CREATE TYPE tournament_type AS ENUM ('fast_tournament', 'reg_tournament', 'finals');
CREATE TYPE tournament_format AS ENUM ('round_robin_per_pairs');

-- Create users table
CREATE TABLE public.users (
  player_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (trim(full_name) != ''),
  email text NULL,
  phone text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index to reduce duplicates
CREATE UNIQUE INDEX idx_users_unique_identity ON public.users (
  lower(full_name), 
  coalesce(lower(email), ''), 
  coalesce(phone, '')
);

-- Create tournaments table
CREATE TABLE public.tournaments (
  tournament_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_at timestamptz NULL,
  tournament_type tournament_type NULL,
  tournament_format tournament_format NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create pairs table
CREATE TABLE public.pairs (
  pair_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(tournament_id) ON DELETE CASCADE,
  player1_id uuid NOT NULL REFERENCES public.users(player_id) ON DELETE RESTRICT,
  player2_id uuid NOT NULL REFERENCES public.users(player_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (player1_id != player2_id)
);

-- Unique constraint and index for pairs
CREATE UNIQUE INDEX idx_pairs_unique ON public.pairs (tournament_id, player1_id, player2_id);
CREATE INDEX idx_pairs_tournament ON public.pairs (tournament_id);

-- Create tournament_enrollments table
CREATE TABLE public.tournament_enrollments (
  registration_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(tournament_id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.users(player_id) ON DELETE RESTRICT,
  pair_id uuid NOT NULL REFERENCES public.pairs(pair_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint and index for enrollments
CREATE UNIQUE INDEX idx_enrollments_unique ON public.tournament_enrollments (tournament_id, player_id);
CREATE INDEX idx_enrollments_tournament ON public.tournament_enrollments (tournament_id);

-- Create matches table
CREATE TABLE public.matches (
  match_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(tournament_id) ON DELETE CASCADE,
  pair_home_id uuid NOT NULL REFERENCES public.pairs(pair_id) ON DELETE RESTRICT,
  pair_away_id uuid NOT NULL REFERENCES public.pairs(pair_id) ON DELETE RESTRICT,
  home_games int NULL,
  away_games int NULL,
  winner_pair uuid NULL REFERENCES public.pairs(pair_id) ON DELETE RESTRICT,
  loser_pair uuid NULL REFERENCES public.pairs(pair_id) ON DELETE RESTRICT,
  tie boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (pair_home_id != pair_away_id),
  CHECK (loser_pair != winner_pair OR (loser_pair IS NULL AND winner_pair IS NULL))
);

CREATE INDEX idx_matches_tournament ON public.matches (tournament_id);

-- Create match_stats table
CREATE TABLE public.match_stats (
  stat_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.users(player_id) ON DELETE RESTRICT,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(tournament_id) ON DELETE CASCADE,
  games_won int NOT NULL DEFAULT 0,
  games_played int NOT NULL DEFAULT 0,
  match_won int NOT NULL DEFAULT 0 CHECK (match_won IN (0, 1)),
  match_played int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_match_stats_unique ON public.match_stats (match_id, player_id);
CREATE INDEX idx_match_stats_player ON public.match_stats (player_id);

-- Create tournament_stats table
CREATE TABLE public.tournament_stats (
  tournament_stat_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(tournament_id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.users(player_id) ON DELETE RESTRICT,
  points int NOT NULL DEFAULT 0,
  position int NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_tournament_stats_unique ON public.tournament_stats (tournament_id, player_id);
CREATE INDEX idx_tournament_stats_ranking ON public.tournament_stats (tournament_id, points DESC, position);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Match validation function
CREATE OR REPLACE FUNCTION public.matches_validate_winner()
RETURNS TRIGGER AS $$
BEGIN
  -- If both game scores are provided
  IF NEW.home_games IS NOT NULL AND NEW.away_games IS NOT NULL THEN
    IF NEW.home_games = NEW.away_games THEN
      -- It's a tie
      NEW.tie = true;
      NEW.winner_pair = NULL;
      NEW.loser_pair = NULL;
    ELSIF NEW.home_games > NEW.away_games THEN
      -- Home team wins
      NEW.tie = false;
      NEW.winner_pair = NEW.pair_home_id;
      NEW.loser_pair = NEW.pair_away_id;
    ELSE
      -- Away team wins
      NEW.tie = false;
      NEW.winner_pair = NEW.pair_away_id;
      NEW.loser_pair = NEW.pair_home_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger for match validation
CREATE TRIGGER matches_validate_winner_trigger
  BEFORE INSERT OR UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.matches_validate_winner();

-- Function to upsert match statistics
CREATE OR REPLACE FUNCTION public.upsert_match_stat(
  p_match_id uuid,
  p_player_id uuid,
  p_tournament_id uuid,
  p_games_won int,
  p_games_played int,
  p_match_won int
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.match_stats (
    match_id, player_id, tournament_id, games_won, games_played, match_won
  ) VALUES (
    p_match_id, p_player_id, p_tournament_id, p_games_won, p_games_played, p_match_won
  )
  ON CONFLICT (match_id, player_id) 
  DO UPDATE SET
    games_won = EXCLUDED.games_won,
    games_played = EXCLUDED.games_played,
    match_won = EXCLUDED.match_won;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to sync stats when match is created/updated
CREATE OR REPLACE FUNCTION public.sync_stats_on_match()
RETURNS TRIGGER AS $$
DECLARE
  home_player1_id uuid;
  home_player2_id uuid;
  away_player1_id uuid;
  away_player2_id uuid;
  home_won int;
  away_won int;
BEGIN
  -- Only process if game scores are provided
  IF NEW.home_games IS NOT NULL AND NEW.away_games IS NOT NULL THEN
    -- Get player IDs for home pair
    SELECT player1_id, player2_id INTO home_player1_id, home_player2_id
    FROM public.pairs WHERE pair_id = NEW.pair_home_id;
    
    -- Get player IDs for away pair
    SELECT player1_id, player2_id INTO away_player1_id, away_player2_id
    FROM public.pairs WHERE pair_id = NEW.pair_away_id;
    
    -- Determine match won values
    home_won = CASE WHEN NEW.winner_pair = NEW.pair_home_id THEN 1 ELSE 0 END;
    away_won = CASE WHEN NEW.winner_pair = NEW.pair_away_id THEN 1 ELSE 0 END;
    
    -- Upsert stats for home pair players
    PERFORM public.upsert_match_stat(
      NEW.match_id, home_player1_id, NEW.tournament_id,
      NEW.home_games, NEW.home_games + NEW.away_games, home_won
    );
    
    PERFORM public.upsert_match_stat(
      NEW.match_id, home_player2_id, NEW.tournament_id,
      NEW.home_games, NEW.home_games + NEW.away_games, home_won
    );
    
    -- Upsert stats for away pair players
    PERFORM public.upsert_match_stat(
      NEW.match_id, away_player1_id, NEW.tournament_id,
      NEW.away_games, NEW.home_games + NEW.away_games, away_won
    );
    
    PERFORM public.upsert_match_stat(
      NEW.match_id, away_player2_id, NEW.tournament_id,
      NEW.away_games, NEW.home_games + NEW.away_games, away_won
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger for stats sync
CREATE TRIGGER sync_stats_on_match_trigger
  AFTER INSERT OR UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.sync_stats_on_match();

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_stats ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (can be tightened later with auth)
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tournaments" ON public.tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on pairs" ON public.pairs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tournament_enrollments" ON public.tournament_enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on match_stats" ON public.match_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tournament_stats" ON public.tournament_stats FOR ALL USING (true) WITH CHECK (true);