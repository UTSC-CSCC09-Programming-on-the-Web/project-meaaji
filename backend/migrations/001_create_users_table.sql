-- Migration: Create users table
-- Description: Initial table for user authentication and profile management

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_picture_url TEXT,
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts and authentication information';
COMMENT ON COLUMN users.google_id IS 'Google OAuth ID for authentication';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status: active, inactive, cancelled, pending';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing'; 