-- Migration: Create collaborations table
-- Description: Table for managing collaborative drawing sessions

CREATE TABLE IF NOT EXISTS collaborations (
    id SERIAL PRIMARY KEY,
    drawing_id INTEGER NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    session_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}' -- Session settings like permissions, tools available, etc.
);

-- Create table for collaboration participants
CREATE TABLE IF NOT EXISTS collaboration_participants (
    id SERIAL PRIMARY KEY,
    collaboration_id INTEGER NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    permissions JSONB DEFAULT '{}', -- User permissions in this session
    UNIQUE(collaboration_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collaborations_drawing_id ON collaborations(drawing_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_owner_id ON collaborations(owner_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_session_id ON collaborations(session_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_is_active ON collaborations(is_active);
CREATE INDEX IF NOT EXISTS idx_collaboration_participants_collaboration_id ON collaboration_participants(collaboration_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_participants_user_id ON collaboration_participants(user_id);

-- Add comments for documentation
COMMENT ON TABLE collaborations IS 'Collaborative drawing sessions';
COMMENT ON COLUMN collaborations.session_id IS 'Unique session identifier for Socket.IO connections';
COMMENT ON COLUMN collaborations.settings IS 'JSONB object containing session settings and permissions';
COMMENT ON TABLE collaboration_participants IS 'Users participating in collaborative sessions';
COMMENT ON COLUMN collaboration_participants.permissions IS 'User-specific permissions for the collaboration session'; 