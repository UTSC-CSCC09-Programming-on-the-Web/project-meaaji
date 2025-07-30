# 🔄 Updating Existing Deployment

If you already have the project downloaded on your VM, here's how to pull the latest changes:

## Method 1: Simple Update (Recommended)

```bash
# Navigate to your project directory
cd project-meaaji

# Switch to the deployment branch (if not already on it)
git checkout deployment

# Pull the latest changes
git pull origin deployment

# Rebuild and restart the services
docker-compose down
docker-compose up --build -d
```

## Method 2: Fresh Clone (If you have issues)

```bash
# Stop existing containers
cd project-meaaji
docker-compose down

# Backup your .env file
cp .env .env.backup

# Go back to home directory
cd ..

# Remove old directory
rm -rf project-meaaji

# Clone fresh with latest changes
git clone -b deployment https://github.com/UTSC-CSCC09-Programming-on-the-Web/project-meaaji.git
cd project-meaaji

# Restore your .env file
cp ../.env.backup .env

# Deploy with latest changes
chmod +x deploy.sh
./deploy.sh
```

## Method 3: Force Update (If git pull fails)

```bash
# Navigate to project directory
cd project-meaaji

# Reset to match remote
git fetch origin
git reset --hard origin/deployment

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

## 🔍 Check Current Status

```bash
# Check which branch you're on
git branch

# Check if you have uncommitted changes
git status

# Check last commit
git log --oneline -1
```

## 🚨 If You Have Local Changes

If you have local changes you want to keep:

```bash
# Stash your changes
git stash

# Pull latest
git pull origin deployment

# Apply your changes back
git stash pop
```

## 📋 Quick Update Commands

```bash
# One-liner update
cd project-meaaji && git checkout deployment && git pull origin deployment && docker-compose down && docker-compose up --build -d

# Check if update worked
docker-compose ps
curl http://localhost/health
```

## 🔧 Troubleshooting

### If git pull fails:
```bash
# Check remote
git remote -v

# Fetch latest
git fetch origin

# Reset to remote
git reset --hard origin/deployment
```

### If Docker build fails:
```bash
# Clean up
docker system prune -f
docker-compose down --volumes

# Rebuild
docker-compose up --build -d
```

### If services don't start:
```bash
# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

## ✅ Verify Update

After updating, verify everything is working:

```bash
# Check all services are running
docker-compose ps

# Test the application
curl http://localhost/health

# Check frontend
curl http://localhost:5173

# Check backend
curl http://localhost:3000/health
```

## 📊 What's New in This Update

The latest update includes:
- ✅ Fixed frontend build issues
- ✅ Development mode frontend (matches your local setup)
- ✅ Separate PromptWorker container
- ✅ WebSocket support for hot reload
- ✅ Improved nginx configuration
- ✅ Better error handling in deployment script 