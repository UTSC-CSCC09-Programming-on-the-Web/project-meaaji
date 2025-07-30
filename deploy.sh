#!/bin/bash

# Draw2StoryPlay Deployment Script
# This script deploys the entire application stack using Docker Compose

set -e  # Exit on any error

echo "🚀 Starting Draw2StoryPlay deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found! Please create it from env.example"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Checking Docker daemon..."
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker first."
    exit 1
fi

# Stop and remove existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove old images to ensure fresh build
print_status "Removing old images..."
docker system prune -f || true

# Build and start services
print_status "Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 45

# Check if services are running
print_status "Checking service status..."
docker-compose ps

# Run database migrations
print_status "Running database migrations..."
docker-compose exec backend npm run migrate || {
    print_warning "Migration failed, but continuing..."
}

# Health checks
print_status "Performing health checks..."

# Check backend
if curl -f http://localhost:3000/health &> /dev/null; then
    print_status "✅ Backend is healthy"
else
    print_warning "⚠️  Backend health check failed"
fi

# Check animation API
if curl -f http://localhost:5000/api/health &> /dev/null; then
    print_status "✅ Animation API is healthy"
else
    print_warning "⚠️  Animation API health check failed"
fi

# Check frontend (development server)
if curl -f http://localhost &> /dev/null; then
    print_status "✅ Frontend is healthy"
else
    print_warning "⚠️  Frontend health check failed"
fi

# Check database
if docker-compose exec postgres pg_isready -U postgres &> /dev/null; then
    print_status "✅ Database is healthy"
else
    print_warning "⚠️  Database health check failed"
fi

# Check Redis
if docker-compose exec redis redis-cli ping &> /dev/null; then
    print_status "✅ Redis is healthy"
else
    print_warning "⚠️  Redis health check failed"
fi

print_status "🎉 Deployment completed!"
print_status "Application is available at: http://localhost"
print_status "Backend API: http://localhost:3000"
print_status "Animation API: http://localhost:5000"
print_status "Frontend Dev Server: http://localhost:5173"

echo ""
print_status "📋 Next Steps:"
echo "1. Set up Stripe webhook (if not already done):"
echo "   stripe listen --forward-to localhost:3000/webhook"
echo "2. Copy the webhook secret to your .env file"
echo "3. Test the application at http://localhost"
echo ""

print_status "Useful commands:"
echo "  docker-compose logs -f [service]  # View logs for a specific service"
echo "  docker-compose down               # Stop all services"
echo "  docker-compose restart [service]  # Restart a specific service"
echo "  docker-compose ps                 # Check service status"
echo "  docker-compose logs -f frontend   # View frontend logs (Vite dev server)" 