# Express OAuth Backend with Stripe Subscriptions

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Choose **Web application**
   - Add authorized redirect URI: `http://localhost:5173/auth/callback`
5. Copy Client ID and Client Secret to `.env` file

### 4. Stripe Setup (Test Mode)

#### Install Stripe CLI
**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows (Chocolatey):**
```bash
choco install stripe
```

**Linux/Manual Installation:**
Download from [Stripe CLI releases](https://github.com/stripe/stripe-cli/releases)

#### Authenticate with Stripe
```bash
stripe login
```
This will open your browser to authenticate with your Stripe account.

#### Get Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch to **Test mode** (toggle in left sidebar)
3. Go to **Developers** → **API keys**
4. Copy **Publishable key** and **Secret key**

#### Create Monthly Subscription Product
1. Go to **Products** → **Add product**
2. Set name: "Monthly Subscription"
3. Set pricing: Recurring, Monthly, $9.99 (or your preferred amount)
4. Copy the **Price ID** (starts with `price_`)

#### Setup Local Webhook Testing with Stripe CLI
**IMPORTANT: This must be done before testing payments!**

1. **Start the webhook listener** (run this in a separate terminal):
```bash
stripe listen --forward-to localhost:3000/webhook
```

2. **Copy the webhook signing secret** from the CLI output:
```bash
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

3. **Add the webhook secret to your .env file**:
```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

**Note:** The webhook secret changes each time you restart `stripe listen`, so update your `.env` file accordingly.

#### Alternative: Stripe Dashboard Webhook (Optional)
If you prefer using the Stripe Dashboard instead of CLI:
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set URL: `http://localhost:3000/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret**

### 5. Update .env File
```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret_here

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server
PORT=3000
FRONTEND_URL=http://localhost:5173

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_51ABC123...
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...

# Subscription
MONTHLY_PRICE_ID=price_1ABC123DEF456GHI
```

### 6. Start the Development Environment

**Terminal 1 - Start the backend server:**
```bash
npm run dev
```

**Terminal 2 - Start Stripe webhook listener:**
```bash
stripe listen --forward-to localhost:3000/webhook
```

**Terminal 3 - Start the frontend (from project root):**
```bash
npm run dev
```

## 🧪 Testing Payments with Stripe CLI

### Test Payment Events
You can simulate Stripe events without going through the actual checkout process:

```bash
# Simulate successful subscription
stripe trigger checkout.session.completed

# Simulate failed payment
stripe trigger invoice.payment_failed

# Simulate subscription cancellation
stripe trigger customer.subscription.deleted

# Simulate subscription update
stripe trigger customer.subscription.updated
```

### Test Card Numbers
When testing actual checkout flows, use these test cards:
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`

### Test Details
- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

## 🔧 API Endpoints

### Authentication
- `GET /auth/google` - Start OAuth flow
- `POST /auth/google/callback` - Handle OAuth callback
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout user

### Subscription Management
- `GET /check-subscription-status` - Check user's subscription status
- `POST /create-checkout-session` - Create Stripe checkout session
- `POST /webhook` - Handle Stripe webhook events

### Protected Routes
- `GET /dashboard-data` - Get dashboard data (requires active subscription)

## 🔒 Security Features

- JWT tokens with 7-day expiration
- HTTP-only cookies for token storage
- Webhook signature verification using Stripe CLI secret
- Route protection with subscription validation
- Secure database operations with SQLite
- Environment variable protection for secrets

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- Google ID
  email TEXT UNIQUE NOT NULL,       -- User email
  name TEXT NOT NULL,               -- User name
  picture TEXT,                     -- Profile picture URL
  stripe_customer_id TEXT,          -- Stripe customer ID
  subscription_status TEXT DEFAULT 'inactive', -- Subscription status
  subscription_id TEXT,             -- Stripe subscription ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Subscription Status Flow

1. **User signs up** → `inactive`
2. **Completes payment** → `active`
3. **Payment fails** → `past_due`
4. **Cancels subscription** → `canceled`

## 🚨 Troubleshooting

### Common Issues

**Webhook not receiving events**
- Ensure Stripe CLI is running: `stripe listen --forward-to localhost:3000/webhook`
- Check that the webhook secret in `.env` matches the CLI output
- Restart the server after updating the webhook secret

**Invalid webhook signature**
- The webhook secret changes each time you restart `stripe listen`
- Copy the new secret from the CLI output to your `.env` file
- Restart your server after updating the secret

**OAuth redirect mismatch**
- Verify redirect URI in Google Console matches exactly: `http://localhost:5173/auth/callback`
- Check FRONTEND_URL in server/.env is correct

**Payment not completing**
- Verify STRIPE_WEBHOOK_SECRET matches the CLI output
- Check webhook events are being received (watch CLI output)
- Monitor server logs for webhook processing errors

**Database issues**
- Restart server to release SQLite locks
- Check file permissions in server directory
- Delete `users.db` file to reset database if needed

### Webhook Event Monitoring
Watch the Stripe CLI output to see webhook events in real-time:
```bash
stripe listen --forward-to localhost:3000/webhook
```

You should see events like:
```
2024-01-15 10:30:45   --> checkout.session.completed [evt_1ABC123]
2024-01-15 10:30:45  <--  [200] POST http://localhost:3000/webhook [evt_1ABC123]
```

## 🎯 Production Deployment

When deploying to production:

1. **Switch to Stripe Live Mode**
   - Get live API keys from Stripe Dashboard
   - Update environment variables with live keys
   - Configure production webhook endpoint in Stripe Dashboard

2. **Update OAuth Settings**
   - Add production domain to Google OAuth redirect URIs
   - Update FRONTEND_URL environment variable

3. **Webhook Configuration**
   - Add production webhook endpoint: `https://yourdomain.com/webhook`
   - Use the webhook secret from Stripe Dashboard (not CLI)

4. **Security Considerations**
   - Use HTTPS in production
   - Set secure cookie settings
   - Use a production database (PostgreSQL, MySQL)
   - Implement proper logging and monitoring

## 📝 Development Workflow

1. Start backend server: `npm run dev`
2. Start Stripe webhook listener: `stripe listen --forward-to localhost:3000/webhook`
3. Copy webhook secret to `.env` file
4. Start frontend server (from project root): `npm run dev`
5. Test authentication and payment flows
6. Use Stripe CLI to trigger test events as needed

Remember: The Stripe CLI webhook secret changes each time you restart the listener, so update your `.env` file accordingly!