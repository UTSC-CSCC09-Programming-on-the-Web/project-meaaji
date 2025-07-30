#!/bin/bash

echo "🔗 Starting Stripe CLI webhook forwarding..."
echo "📡 This will forward Stripe webhooks to your backend service"
echo "🔑 Make sure your STRIPE_WEBHOOK_SECRET is set in your .env file"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file based on env.example"
    exit 1
fi

# Load environment variables
source .env

# Check if required environment variables are set
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ Error: STRIPE_SECRET_KEY not set in .env file"
    exit 1
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "❌ Error: STRIPE_WEBHOOK_SECRET not set in .env file"
    echo "You can get this from the Stripe CLI output when it starts"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "🔑 Stripe API Key: ${STRIPE_SECRET_KEY:0:10}..."
echo "🔐 Webhook Secret: ${STRIPE_WEBHOOK_SECRET:0:10}..."
echo ""

# Start the Stripe CLI service
echo "🚀 Starting Stripe CLI service..."
docker compose --profile stripe up stripe-cli

echo ""
echo "📋 To stop the Stripe CLI service, run:"
echo "   docker compose --profile stripe down stripe-cli" 