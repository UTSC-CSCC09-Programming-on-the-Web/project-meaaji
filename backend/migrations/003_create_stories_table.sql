-- Migration: Create stories table
-- Description: Table for storing AI-generated storybooks

CREATE TABLE IF NOT EXISTS stories (
    id SERIAL PRIMARY KEY,
    drawing_id INTEGER NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL, -- Stores story content, pages, text, and metadata
    audio_url TEXT,
    duration_seconds INTEGER,
    status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
    ai_prompt TEXT, -- The original prompt used to generate the story
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[]
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_drawing_id ON stories(drawing_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);
CREATE INDEX IF NOT EXISTS idx_stories_tags ON stories USING GIN(tags);

-- Add comments for documentation
COMMENT ON TABLE stories IS 'AI-generated storybooks from user drawings';
COMMENT ON COLUMN stories.content IS 'JSONB object containing story pages, text, and illustrations';
COMMENT ON COLUMN stories.status IS 'Story generation status: processing, completed, failed';
COMMENT ON COLUMN stories.ai_prompt IS 'The original prompt used to generate the story'; 