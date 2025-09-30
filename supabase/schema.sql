-- Spelling Flappy Bird Database Schema
-- This file contains all tables, indexes, and RLS policies for the game

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table - stores player information linked to Supabase Auth
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Words table - stores spelling words with correct and incorrect spellings
CREATE TABLE words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correct_spelling TEXT NOT NULL,
    wrong_spelling TEXT NOT NULL,
    word_length INT GENERATED ALWAYS AS (LENGTH(correct_spelling)) STORED,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES players(id)
);

-- Player word statistics - tracks individual player progress on each word
CREATE TABLE player_word_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    word_id UUID REFERENCES words(id) ON DELETE CASCADE,
    correct_streak INT DEFAULT 0,
    total_correct INT DEFAULT 0,
    total_wrong INT DEFAULT 0,
    last_wrong_date TIMESTAMP WITH TIME ZONE,
    last_seen_date TIMESTAMP WITH TIME ZONE,
    mastery_level TEXT DEFAULT 'learning' CHECK (mastery_level IN ('learning', 'practicing', 'mastered')),
    UNIQUE(player_id, word_id)
);

-- Game sessions - records each play session with statistics
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id),
    score INT NOT NULL,
    words_attempted INT,
    words_correct INT,
    words_wrong INT,
    accuracy FLOAT,
    difficulty TEXT,
    duration_seconds INT,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Highscores - tracks best scores per player and difficulty
CREATE TABLE highscores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id),
    score INT NOT NULL,
    difficulty TEXT,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_player_word_stats_player ON player_word_stats(player_id);
CREATE INDEX idx_player_word_stats_mastery ON player_word_stats(mastery_level);
CREATE INDEX idx_highscores_score ON highscores(score DESC);

-- Enable Row Level Security on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_word_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE highscores ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Players can view their own data
CREATE POLICY "Players can view own data" ON players
    FOR SELECT USING (auth.uid() = auth_id);

-- Players can insert their own player record on signup
CREATE POLICY "Players can insert own record" ON players
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- All users can read words (needed for gameplay)
CREATE POLICY "All users can read words" ON words
    FOR SELECT USING (true);

-- Only admins can manage words
CREATE POLICY "Admins can manage words" ON words
    FOR ALL USING (
        auth.email() = current_setting('app.admin_email', true)
    );

-- Players can view their own word stats
CREATE POLICY "Players can view own word stats" ON player_word_stats
    FOR SELECT USING (
        player_id IN (
            SELECT id FROM players WHERE auth_id = auth.uid()
        )
    );

-- Players can insert/update their own word stats
CREATE POLICY "Players can manage own word stats" ON player_word_stats
    FOR ALL USING (
        player_id IN (
            SELECT id FROM players WHERE auth_id = auth.uid()
        )
    );

-- Players can view their own game sessions
CREATE POLICY "Players can view own game sessions" ON game_sessions
    FOR SELECT USING (
        player_id IN (
            SELECT id FROM players WHERE auth_id = auth.uid()
        )
    );

-- Players can insert their own game sessions
CREATE POLICY "Players can insert own game sessions" ON game_sessions
    FOR INSERT WITH CHECK (
        player_id IN (
            SELECT id FROM players WHERE auth_id = auth.uid()
        )
    );

-- Players can view their own highscores
CREATE POLICY "Players can view own highscores" ON highscores
    FOR SELECT USING (
        player_id IN (
            SELECT id FROM players WHERE auth_id = auth.uid()
        )
    );

-- Players can insert their own highscores
CREATE POLICY "Players can insert own highscores" ON highscores
    FOR INSERT WITH CHECK (
        player_id IN (
            SELECT id FROM players WHERE auth_id = auth.uid()
        )
    );

-- All users can view public highscores (for leaderboards)
CREATE POLICY "All users can view public highscores" ON highscores
    FOR SELECT USING (true);

-- Set the admin email setting (replace with your actual admin email)
-- This should be set in your Supabase dashboard or via SQL
-- ALTER DATABASE postgres SET app.admin_email = 'admin@example.com';

