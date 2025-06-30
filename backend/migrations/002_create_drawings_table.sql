-- Migration: Create drawings table
-- Description: Table for storing user drawings and sketches

CREATE TABLE IF NOT EXISTS drawings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    drawing_data JSONB NOT NULL, -- Stores the actual drawing data (paths, shapes, etc.)
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drawings_user_id ON drawings(user_id);
CREATE INDEX IF NOT EXISTS idx_drawings_created_at ON drawings(created_at);
CREATE INDEX IF NOT EXISTS idx_drawings_is_public ON drawings(is_public);
CREATE INDEX IF NOT EXISTS idx_drawings_tags ON drawings USING GIN(tags);

-- Add comments for documentation
COMMENT ON TABLE drawings IS 'User drawings and sketches';
COMMENT ON COLUMN drawings.drawing_data IS 'JSONB object containing drawing paths, shapes, and metadata';
COMMENT ON COLUMN drawings.tags IS 'Array of tags for categorizing drawings'; 