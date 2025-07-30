#!/bin/bash

# OAuth Debug Script for Draw2StoryPlay
echo "🔍 OAuth Debug Information"
echo "=========================="

# Check if backend is running
echo ""
echo "1. Checking if backend is running..."
if curl -f http://localhost:3000/health &> /dev/null; then
    echo "✅ Backend is running and healthy"
else
    echo "❌ Backend is not responding"
    echo "   Check: docker-compose logs backend"
    exit 1
fi

# Check OAuth endpoint directly
echo ""
echo "2. Testing OAuth endpoint..."
OAUTH_RESPONSE=$(curl -s http://localhost:3000/auth/google)
echo "Response: $OAUTH_RESPONSE"

# Check environment variables
echo ""
echo "3. Checking environment variables..."
echo "GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-'NOT SET'}"
echo "GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:0:10}..." 2>/dev/null || echo "GOOGLE_CLIENT_SECRET: NOT SET"

# Check Docker environment
echo ""
echo "4. Checking Docker container environment..."
docker-compose exec backend env | grep GOOGLE || echo "No GOOGLE_* variables found in container"

# Check nginx routing
echo ""
echo "5. Testing nginx routing..."
NGINX_RESPONSE=$(curl -s -I https://draw2play.xyz/auth/google 2>/dev/null | head -1)
echo "Nginx response: $NGINX_RESPONSE"

# Check backend logs
echo ""
echo "6. Recent backend logs:"
docker-compose logs --tail=10 backend

echo ""
echo "🔧 Troubleshooting Steps:"
echo "1. Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in your .env file"
echo "2. Restart the backend: docker-compose restart backend"
echo "3. Check Google OAuth redirect URI: https://draw2play.xyz/auth/callback"
echo "4. Verify your domain is accessible: curl -I https://draw2play.xyz" 