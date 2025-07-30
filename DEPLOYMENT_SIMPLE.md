# 🚀 Simple Draw2StoryPlay Deployment

## Quick Deploy (Matches Your Current Setup)

This deployment matches exactly how you've been running the application locally:

### Your Current Setup:
- **Backend**: `npm run migrate` → `node promptworker.js` → `node server.js`
- **Frontend**: `npm run dev`
- **MetaAPI**: `python animation_api.py`
- **Stripe**: `stripe listen --forward-to localhost:3000/webhook`

### Docker Equivalent:
- **Backend**: Express.js server on port 3000
- **PromptWorker**: Separate container running `node PromptWorker.js`
- **Frontend**: Vite dev server on port 5173
- **Animation API**: Python Flask on port 5000
- **Database**: PostgreSQL
- **Redis**: For task queues

## 🚀 Deploy in 3 Steps

### 1. SSH to Your VM
```bash
ssh -i your-key.pem username@137.184.162.109
```

### 2. Install Docker & Clone
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
exit && ssh back in

# Clone the deployment branch
git clone -b deployment https://github.com/UTSC-CSCC09-Programming-on-the-Web/project-meaaji.git
cd project-meaaji
```

### 3. Setup & Deploy
```bash
# Setup credentials
chmod +x setup-credentials.sh
./setup-credentials.sh

# Deploy
chmod +x deploy.sh
./deploy.sh
```

## 📋 Required Credentials

The setup script will ask for:

1. **Database Password** (PostgreSQL)
2. **JWT Secret** (long random string)
3. **Google OAuth** (Client ID & Secret)
4. **Stripe Live Keys** (Secret, Publishable, Webhook Secret, Price ID)
5. **AI API Keys** (Cohere, Stability AI)

## 🌐 Access Points

After deployment:
- **Main App**: http://137.184.162.109
- **Frontend Dev**: http://137.184.162.109:5173
- **Backend API**: http://137.184.162.109:3000
- **Animation API**: http://137.184.162.109:5000

## 🔧 Management

```bash
# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Stop all
docker-compose down

# Start all
docker-compose up -d
```

## 🚨 Troubleshooting

### Frontend Build Issues (Fixed)
- ✅ Now uses development mode (matches your `npm run dev`)
- ✅ No more TypeScript build errors
- ✅ Hot reload works

### Common Issues
```bash
# Check all logs
docker-compose logs -f

# Check specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f animation

# Check if services are running
docker-compose ps
```

## 📞 Stripe Setup

After deployment, you'll need to:

1. **Install Stripe CLI** on your VM:
```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

2. **Login to Stripe**:
```bash
stripe login
```

3. **Start webhook listener**:
```bash
stripe listen --forward-to localhost:3000/webhook
```

4. **Copy webhook secret** to your `.env` file

## 🎯 What's Different from Production

This setup uses:
- ✅ **Development frontend** (Vite dev server with hot reload)
- ✅ **Separate PromptWorker** container (matches your setup)
- ✅ **Volume mounting** for live code changes
- ✅ **WebSocket support** for frontend hot reload

## 🔄 Updates

To update the application:
```bash
git pull
docker-compose down
docker-compose up --build -d
```

## 📊 Monitoring

```bash
# Check resource usage
docker stats

# Check disk space
df -h

# Check memory
free -h
```

Your application will now run exactly like your local development setup, but in Docker containers on your VM! 