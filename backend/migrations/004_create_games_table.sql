-- Migration: Create games table
-- Description: Table for storing AI-generated interactive games

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    drawing_id INTEGER NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    game_data JSONB NOT NULL, -- Stores game configuration, sprites, animations, etc.
    game_url TEXT, -- URL to the playable game
    thumbnail_url TEXT,
    status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
    ai_prompt TEXT, -- The original prompt used to generate the game
    game_type VARCHAR(50), -- platformer, adventure, puzzle, etc.
    difficulty_level VARCHAR(20) DEFAULT 'easy', -- easy, medium, hard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[]
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_drawing_id ON games(drawing_id);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_game_type ON games(game_type);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_games_tags ON games USING GIN(tags);

-- Add comments for documentation
COMMENT ON TABLE games IS 'AI-generated interactive games from user drawings';
COMMENT ON COLUMN games.game_data IS 'JSONB object containing game configuration, sprites, and animations';
COMMENT ON COLUMN games.status IS 'Game generation status: processing, completed, failed';
COMMENT ON COLUMN games.ai_prompt IS 'The original prompt used to generate the game';
COMMENT ON COLUMN games.game_type IS 'Type of game: platformer, adventure, puzzle, etc.'; 