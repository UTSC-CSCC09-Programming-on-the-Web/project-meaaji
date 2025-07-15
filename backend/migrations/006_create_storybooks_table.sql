-- 006_create_storybooks_table.sql
CREATE TABLE IF NOT EXISTS storybooks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_url TEXT,
    pages JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 