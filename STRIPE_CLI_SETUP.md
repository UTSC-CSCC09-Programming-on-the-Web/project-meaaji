# Stripe CLI Setup for Webhook Forwarding

This setup allows you to use Stripe's sandbox environment even in production by forwarding webhooks through the Stripe CLI.

## 🚀 Quick Start

1. **Set up your environment variables:**
   ```bash
   # Copy the example file
   cp env.example .env
   
   # Edit .env and add your Stripe keys
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...  # You'll get this from Stripe CLI
   ```

2. **Start the Stripe CLI service:**
   ```bash
   ./run-stripe-cli.sh
   ```

3. **Get your webhook secret:**
   - When the Stripe CLI starts, it will print a webhook secret
   - Copy this secret and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`
   - Restart the service: `docker compose --profile stripe restart stripe-cli`

## 📋 Manual Commands

### Start Stripe CLI service:
```bash
docker compose --profile stripe up stripe-cli
```

### Stop Stripe CLI service:
```bash
docker compose --profile stripe down stripe-cli
```

### View Stripe CLI logs:
```bash
docker compose --profile stripe logs stripe-cli
```

### Rebuild Stripe CLI:
```bash
docker compose --profile stripe build stripe-cli
```

## 🔧 How It Works

1. **Stripe CLI forwards webhooks** from Stripe's servers to your backend
2. **Backend receives webhooks** at `http://backend:3000/webhook`
3. **Webhook secret is validated** using the secret from Stripe CLI
4. **Your app works in sandbox mode** even in production

## 🌐 Network Configuration

- **Stripe CLI** runs in the same Docker network as your backend
- **Webhooks are forwarded** to `http://backend:3000/webhook` (internal Docker network)
- **No external ports** are exposed for the Stripe CLI service

## 🔑 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret from Stripe CLI | `whsec_...` |

## 🐛 Troubleshooting

### Stripe CLI not starting:
```bash
# Check if environment variables are set
docker compose --profile stripe config

# View logs
docker compose --profile stripe logs stripe-cli
```

### Webhooks not received:
```bash
# Check if backend is running
docker compose logs backend

# Check if Stripe CLI is forwarding
docker compose --profile stripe logs stripe-cli
```

### Wrong webhook secret:
1. Stop the Stripe CLI: `docker compose --profile stripe down stripe-cli`
2. Update your `.env` file with the new webhook secret
3. Restart: `docker compose --profile stripe up stripe-cli`

## 📝 Notes

- The Stripe CLI service uses the `stripe` profile, so it won't start with regular `docker compose up`
- You need to explicitly start it with `--profile stripe`
- The webhook secret changes each time you restart the Stripe CLI
- Make sure to update your `.env` file with the new secret each time 