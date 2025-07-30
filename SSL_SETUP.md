# 🔒 SSL Certificate Setup for draw2play.xyz

This guide will help you set up HTTPS for your domain using Let's Encrypt (free SSL certificates).

## 🚀 Quick SSL Setup

### Step 1: Install Certbot on Your VM

SSH into your VM and run:

```bash
# Update system
sudo apt update

# Install Certbot and nginx plugin
sudo apt install certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Step 2: Get SSL Certificate

```bash
# Get SSL certificate for your domain
sudo certbot --nginx -d draw2play.xyz -d www.draw2play.xyz

# Follow the prompts:
# 1. Enter your email address
# 2. Agree to terms of service (Y)
# 3. Share email with EFF (N - optional)
# 4. Choose redirect option (2 - redirect all traffic to HTTPS)
```

### Step 3: Test the Certificate

```bash
# Test if certificate is working
sudo certbot certificates

# Test renewal (dry run)
sudo certbot renew --dry-run
```

### Step 4: Update Your Application

```bash
# Navigate to your project
cd project-meaaji

# Update environment variables for HTTPS
nano .env
```

Update these values in your `.env`:
```env
FRONTEND_URL=https://draw2play.xyz
GOOGLE_CALLBACK_URL=https://draw2play.xyz/auth/callback
VITE_API_URL=https://draw2play.xyz
CORS_ORIGIN=https://draw2play.xyz
```

```bash
# Restart your application
docker-compose down
docker-compose up -d
```

## 🔧 Manual SSL Setup (Alternative)

If the automatic setup doesn't work, here's the manual approach:

### Step 1: Stop Nginx Container

```bash
# Stop the nginx container temporarily
docker-compose stop nginx
```

### Step 2: Get Certificate Manually

```bash
# Get certificate without nginx plugin
sudo certbot certonly --standalone -d draw2play.xyz -d www.draw2play.xyz

# This will temporarily use port 80, so make sure nothing else is using it
```

### Step 3: Copy Certificates to Docker

```bash
# Create SSL directory
mkdir -p ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/draw2play.xyz/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/draw2play.xyz/privkey.pem ssl/key.pem

# Set proper permissions
sudo chown $USER:$USER ssl/*
chmod 600 ssl/*
```

### Step 4: Update Nginx Configuration

Edit `nginx-proxy.conf` and uncomment the HTTPS section:

```nginx
# HTTPS server
server {
    listen 443 ssl http2;
    server_name draw2play.xyz www.draw2play.xyz;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Same location blocks as HTTP server
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for Vite HMR
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Authentication routes
    location /auth/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Stripe webhook
    location /webhook {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Animation API routes
    location /animation/ {
        limit_req zone=animation burst=10 nodelay;
        proxy_pass http://animation/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
        proxy_connect_timeout 75s;
    }

    # Uploads and static files
    location /uploads/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name draw2play.xyz www.draw2play.xyz;
    return 301 https://$server_name$request_uri;
}
```

### Step 5: Restart Application

```bash
# Restart with SSL
docker-compose up -d
```

## 🔄 Auto-Renewal Setup

SSL certificates expire every 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e

# Add this line to run twice daily
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚨 Troubleshooting

### If Certbot fails:
```bash
# Check if port 80 is free
sudo netstat -tulpn | grep :80

# Stop any services using port 80
sudo systemctl stop apache2  # if running
docker-compose stop nginx    # if running

# Try again
sudo certbot --nginx -d draw2play.xyz -d www.draw2play.xyz
```

### If certificates don't work:
```bash
# Check certificate status
sudo certbot certificates

# Check nginx configuration
docker-compose logs nginx

# Test SSL
curl -I https://draw2play.xyz
```

### If DNS issues:
```bash
# Check if domain resolves
nslookup draw2play.xyz

# Should point to your VM IP: 137.184.162.109
```

## ✅ Verification

After setup, test:

```bash
# Test HTTPS
curl -I https://draw2play.xyz

# Check certificate
openssl s_client -connect draw2play.xyz:443 -servername draw2play.xyz

# Test in browser
# Visit: https://draw2play.xyz
# Should show secure padlock
```

## 🌐 Update External Services

After SSL is working, update:

1. **Google OAuth**: Add `https://draw2play.xyz/auth/callback`
2. **Stripe Webhook**: Update to `https://draw2play.xyz/webhook`
3. **Any other integrations** to use HTTPS URLs

Your site should now be secure with HTTPS! 🔒 