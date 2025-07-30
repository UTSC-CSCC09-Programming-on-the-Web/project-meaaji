# 🚀 Draw2StoryPlay Deployment Summary

## Quick Start

1. **SSH to your VM:**
   ```bash
   ssh -i your-key.pem username@137.184.162.109
   ```

2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   exit && ssh back in
   ```

3. **Clone and setup:**
   ```bash
   git clone https://github.com/UTSC-CSCC09-Programming-on-the-Web/project-meaaji.git
   cd project-meaaji
   chmod +x setup-credentials.sh
   ./setup-credentials.sh
   ```

4. **Deploy:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## 📋 Required Credentials

### Google OAuth
- Client ID: `your-client-id.apps.googleusercontent.com`
- Client Secret: `your-client-secret`
- Redirect URI: `https://137.184.162.109/auth/callback`

### Stripe (Live Mode)
- Secret Key: `sk_live_...`
- Publishable Key: `pk_live_...`
- Webhook Secret: `whsec_...`
- Price ID: `price_...`
- Webhook URL: `https://137.184.162.109/webhook`

### AI Services
- **Cohere API Key** (for story generation)
- **Stability AI API Key** (for image generation)

### Database
- PostgreSQL password (secure, random)

### JWT
- Long, random secret key

## 🏗️ Architecture

```
Internet → Nginx (80/443) → Frontend (Vue.js)
                    ↓
                Backend (Express.js) → PostgreSQL
                    ↓
            Animation API (Python) → Redis (Task Queue)
```

## 🔧 Management Commands

```bash
# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Stop all
docker-compose down

# Start all
docker-compose up -d

# Check status
docker-compose ps
```

## 🌐 Access Points

- **Frontend**: http://137.184.162.109
- **Backend API**: http://137.184.162.109/api
- **Animation API**: http://137.184.162.109/animation
- **Health Check**: http://137.184.162.109/health

## 🚨 Troubleshooting

```bash
# Check all logs
docker-compose logs -f

# Check resource usage
docker stats

# Check disk space
df -h

# Check memory
free -h
```

## 📞 Support

1. Check logs: `docker-compose logs -f`
2. Verify .env file is complete
3. Ensure all services are running: `docker-compose ps`
4. Check resource usage: `docker stats`

## 🔒 Security Notes

- Use HTTPS in production
- Keep .env file secure
- Regular database backups
- Monitor resource usage
- Update dependencies regularly 