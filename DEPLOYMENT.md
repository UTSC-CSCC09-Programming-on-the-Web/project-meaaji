# Draw2StoryPlay Deployment Guide

This guide will help you deploy the Draw2StoryPlay application to your Google Cloud VM using Docker and Docker Compose.

## 🏗️ Architecture Overview

The application consists of 5 main components:

1. **Frontend** (Vue.js SPA) - Port 80
2. **Backend API** (Express.js) - Port 3000
3. **Animation API** (Python Flask) - Port 5000
4. **PostgreSQL Database** - Port 5432
5. **Redis** (Task Queue) - Port 6379
6. **Nginx** (Reverse Proxy) - Port 80/443

## 📋 Prerequisites

### VM Requirements
- **OS**: Ubuntu 20.04+ or Debian 11+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 20GB
- **CPU**: 2+ cores
- **Network**: Public IP with ports 80, 443 open

### Software Requirements
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## 🚀 Deployment Steps

### 1. Connect to Your VM

```bash
ssh -i your-key.pem username@137.184.162.109
```

### 2. Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes to take effect
exit
# SSH back in
```

### 3. Clone the Repository

```bash
git clone https://github.com/UTSC-CSCC09-Programming-on-the-Web/project-meaaji.git
cd project-meaaji
```

### 4. Configure Environment Variables

```bash
# Copy the production environment template
cp env.production.example .env

# Edit the .env file with your actual values
nano .env
```

**Required Environment Variables:**

#### Database
```env
DB_PASSWORD=your_secure_postgres_password_here
```

#### Google OAuth
```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
FRONTEND_URL=https://137.184.162.109
GOOGLE_CALLBACK_URL=https://137.184.162.109/auth/callback
```

#### JWT Secret
```env
JWT_SECRET=your_super_secure_jwt_secret_make_it_long_and_random
```

#### Stripe (Production)
```env
STRIPE_SECRET_KEY=sk_live_your_stripe_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
MONTHLY_PRICE_ID=price_your_monthly_price_id
```

#### Frontend Variables
```env
VITE_API_URL=https://137.184.162.109
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_live_publishable_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

#### AI Services
```env
CO_API_KEY=your_cohere_api_key
STABILITY_API_KEY=your_stability_ai_api_key
```

### 5. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Choose **Web application**
   - Add authorized redirect URI: `https://137.184.162.109/auth/callback`
5. Copy Client ID and Client Secret to your `.env` file

### 6. Configure Stripe (Production)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch to **Live mode**
3. Get live API keys from **Developers** → **API keys**
4. Create subscription product:
   - Go to **Products** → **Add product**
   - Set name: "Monthly Subscription"
   - Set pricing: Recurring, Monthly, $9.99
   - Copy the **Price ID**
5. Configure webhook endpoint:
   - Go to **Developers** → **Webhooks**
   - Add endpoint: `https://137.184.162.109/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the webhook secret

### 7. Deploy the Application

```bash
# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

### 8. Verify Deployment

```bash
# Check if all services are running
docker-compose ps

# Check logs if needed
docker-compose logs -f [service_name]

# Test the application
curl http://localhost/health
```

## 🔧 Service Management

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f animation
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Stop/Start Services
```bash
# Stop all services
docker-compose down

# Start all services
docker-compose up -d
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

## 🔒 Security Considerations

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### SSL/HTTPS Setup (Recommended)
1. Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

2. Get SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

3. Update nginx configuration to use HTTPS

### Database Security
- Use strong passwords
- Restrict database access to application containers only
- Regular backups

## 📊 Monitoring

### Health Checks
```bash
# Application health
curl http://localhost/health

# Backend health
curl http://localhost:3000/health

# Animation API health
curl http://localhost:5000/api/health
```

### Resource Usage
```bash
# Container resource usage
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

## 🚨 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check logs
docker-compose logs [service_name]

# Check if ports are in use
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3000
```

#### Database Connection Issues
```bash
# Check database container
docker-compose exec postgres psql -U postgres -d Draw2PlayDB

# Check database logs
docker-compose logs postgres
```

#### Memory Issues
```bash
# Check available memory
free -h

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x deploy.sh
```

## 🔄 Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres Draw2PlayDB > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres Draw2PlayDB < backup.sql
```

### Application Data Backup
```bash
# Backup uploads
tar -czf uploads_backup.tar.gz backend/uploads/

# Backup animation outputs
tar -czf animation_backup.tar.gz metaAPI/AnimatedDrawings/outputs/
```

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Ensure all required services are running: `docker-compose ps`
4. Check resource usage: `docker stats`

## 🎯 Next Steps

After successful deployment:

1. **Set up monitoring** (optional)
2. **Configure SSL certificates** for HTTPS
3. **Set up automated backups**
4. **Configure CI/CD pipeline** (optional)
5. **Set up domain name** (optional)

Your application should now be accessible at `http://137.184.162.109`! 