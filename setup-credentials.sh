#!/bin/bash

# Draw2StoryPlay Credentials Setup Script
# This script helps you gather all required credentials and API keys

echo "🔑 Draw2StoryPlay Credentials Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo "This script will help you gather all the required credentials for deployment."
echo ""

# Check if .env file exists
if [ -f .env ]; then
    print_warning ".env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Create new .env file
cp env.example .env

print_info "Let's set up your credentials step by step:"
echo ""

# 1. Database Password
echo "1. Database Configuration"
echo "------------------------"
read -s -p "Enter a secure PostgreSQL password: " db_password
echo ""
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" .env
print_success "Database password set"

# 2. JWT Secret
echo ""
echo "2. JWT Secret"
echo "-------------"
read -s -p "Enter a long, random JWT secret (or press Enter to generate): " jwt_secret
if [ -z "$jwt_secret" ]; then
    jwt_secret=$(openssl rand -base64 64)
    print_info "Generated JWT secret: $jwt_secret"
fi
echo ""
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$jwt_secret/" .env
print_success "JWT secret set"

# 3. Google OAuth
echo ""
echo "3. Google OAuth Configuration"
echo "----------------------------"
echo "You need to set up Google OAuth credentials:"
echo "1. Go to https://console.cloud.google.com/"
echo "2. Create a new project or select existing one"
echo "3. Enable Google+ API"
echo "4. Create OAuth 2.0 credentials (Web application)"
echo "5. Add redirect URI: https://137.184.162.109/auth/callback"
echo ""

read -p "Enter your Google OAuth Client ID: " google_client_id
read -s -p "Enter your Google OAuth Client Secret: " google_client_secret
echo ""

sed -i "s/GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=$google_client_id/" .env
sed -i "s/GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=$google_client_secret/" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://137.184.162.109|" .env
sed -i "s|GOOGLE_CALLBACK_URL=.*|GOOGLE_CALLBACK_URL=https://137.184.162.109/auth/callback|" .env
print_success "Google OAuth credentials set"

# 4. Stripe Configuration
echo ""
echo "4. Stripe Configuration"
echo "----------------------"
echo "You need to set up Stripe in LIVE mode:"
echo "1. Go to https://dashboard.stripe.com/"
echo "2. Switch to LIVE mode"
echo "3. Get your live API keys"
echo "4. Create a subscription product"
echo "5. Set up webhook endpoint: https://137.184.162.109/webhook"
echo ""

read -p "Enter your Stripe Live Secret Key (sk_live_...): " stripe_secret_key
read -p "Enter your Stripe Live Publishable Key (pk_live_...): " stripe_publishable_key
read -p "Enter your Stripe Webhook Secret (whsec_...): " stripe_webhook_secret
read -p "Enter your Stripe Monthly Price ID (price_...): " monthly_price_id

sed -i "s/STRIPE_SECRET_KEY=.*/STRIPE_SECRET_KEY=$stripe_secret_key/" .env
sed -i "s/VITE_STRIPE_PUBLISHABLE_KEY=.*/VITE_STRIPE_PUBLISHABLE_KEY=$stripe_publishable_key/" .env
sed -i "s/STRIPE_WEBHOOK_SECRET=.*/STRIPE_WEBHOOK_SECRET=$stripe_webhook_secret/" .env
sed -i "s/MONTHLY_PRICE_ID=.*/MONTHLY_PRICE_ID=$monthly_price_id/" .env
print_success "Stripe configuration set"

# 5. AI Service API Keys
echo ""
echo "5. AI Service API Keys"
echo "---------------------"
echo "You need API keys for AI services:"
echo ""

echo "Cohere API (for story generation):"
echo "1. Go to https://dashboard.cohere.com/"
echo "2. Sign up and get your API key"
read -p "Enter your Cohere API key: " cohere_api_key
sed -i "s/CO_API_KEY=.*/CO_API_KEY=$cohere_api_key/" .env

echo ""
echo "Stability AI API (for image generation):"
echo "1. Go to https://platform.stability.ai/"
echo "2. Sign up and get your API key"
read -p "Enter your Stability AI API key: " stability_api_key
sed -i "s/STABILITY_API_KEY=.*/STABILITY_API_KEY=$stability_api_key/" .env

print_success "AI service API keys set"

# 6. Frontend Configuration
echo ""
echo "6. Frontend Configuration"
echo "------------------------"
sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://137.184.162.109|" .env
sed -i "s/VITE_GOOGLE_CLIENT_ID=.*/VITE_GOOGLE_CLIENT_ID=$google_client_id/" .env
print_success "Frontend configuration set"

echo ""
echo "🎉 Credentials setup completed!"
echo ""
echo "Your .env file has been created with all the required credentials."
echo ""
echo "Next steps:"
echo "1. Review your .env file: cat .env"
echo "2. Run the deployment: ./deploy.sh"
echo ""
echo "⚠️  Important: Keep your .env file secure and never commit it to version control!" 