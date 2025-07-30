# 🌐 Domain Setup Guide for draw2play.xyz

## ✅ What's Been Updated

I've updated the configuration to work with your domain `draw2play.xyz`:

1. **Vite Configuration** - Added domain to allowed hosts
2. **Nginx Configuration** - Updated server names
3. **Environment Variables** - Updated URLs to use your domain

## 🚀 Quick Setup Steps

### 1. Update Your Environment Variables

On your VM, update your `.env` file:

```bash
cd project-meaaji
nano .env
```

Update these values:
```env
FRONTEND_URL=https://draw2play.xyz
GOOGLE_CALLBACK_URL=https://draw2play.xyz/auth/callback
VITE_API_URL=https://draw2play.xyz
CORS_ORIGIN=https://draw2play.xyz
```

### 2. Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 client
4. Add these authorized redirect URIs:
   - `https://draw2play.xyz/auth/callback`
   - `http://draw2play.xyz/auth/callback` (for testing)

### 3. Update Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **Webhooks**
3. Update your webhook endpoint to: `https://draw2play.xyz/webhook`

### 4. Deploy the Updates

```bash
# Pull latest changes
git checkout deployment
git pull origin deployment

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

## 🔧 DNS Configuration

Make sure your domain points to your VM:

```bash
# Check your VM's IP
curl ifconfig.me
# Should return: 137.184.162.109
```

**DNS Records to Add:**
- **A Record**: `draw2play.xyz` → `137.184.162.109`
- **A Record**: `www.draw2play.xyz` → `137.184.162.109`

## 🔒 SSL Certificate (Recommended)

For HTTPS, install Certbot:

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d draw2play.xyz -d www.draw2play.xyz

# Test renewal
sudo certbot renew --dry-run
```

## 🌐 Access Your Application

After setup:
- **Main App**: https://draw2play.xyz
- **Backend API**: https://draw2play.xyz/api
- **Animation API**: https://draw2play.xyz/animation

## 🚨 Troubleshooting

### If you still get "host not allowed":
```bash
# Check if the domain is in Vite config
cat frontend/vite.config.ts

# Restart frontend container
docker-compose restart frontend
```

### If OAuth doesn't work:
- Check Google OAuth redirect URIs
- Ensure `GOOGLE_CALLBACK_URL` is set correctly
- Check browser console for errors

### If Stripe webhooks fail:
- Verify webhook endpoint in Stripe Dashboard
- Check webhook secret in `.env` file
- Monitor webhook logs: `docker-compose logs -f backend`

## 📊 Monitoring

```bash
# Check all services
docker-compose ps

# Check nginx logs
docker-compose logs -f nginx

# Check frontend logs
docker-compose logs -f frontend

# Test the application
curl https://draw2play.xyz/health
```

Your application should now be accessible at `https://draw2play.xyz`! 