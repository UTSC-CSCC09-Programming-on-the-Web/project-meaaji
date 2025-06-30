# Complete Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

### 2. Install Stripe CLI

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

**Authenticate with Stripe:**
```bash
stripe login
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

### 4. Stripe Setup (Test Mode)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch to **Test mode**
3. Get API keys from **Developers** → **API keys**
4. Create subscription product:
   - Go to **Products** → **Add product**
   - Set name: "Monthly Subscription"
   - Set pricing: Recurring, Monthly, $9.99
   - Copy the **Price ID**

### 5. Environment Configuration

**Frontend (.env):**
```bash
cp .env.example .env
```
```env
VITE_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
```

**Backend (server/.env):**
```bash
cd server
cp .env.example .env
```
```env
GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
PORT=3000
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_will_be_provided_by_stripe_cli
MONTHLY_PRICE_ID=price_your_actual_price_id
```

### 6. Start Development Environment

**IMPORTANT: You need 3 terminal windows**

**Terminal 1 - Stripe Webhook Listener (Start this first!):**
```bash
stripe listen --forward-to localhost:3000/webhook
```
**Copy the webhook secret from the output and add it to server/.env**

**Terminal 2 - Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 3 - Frontend Server:**
```bash
npm run dev
```

**Alternative: Start Frontend and Backend Together:**
```bash
npm run dev:full
```
*Note: You still need to run the Stripe CLI separately*

## 🧪 Testing

### Test Payment Flow
1. Navigate to `http://localhost:5173`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. You'll be redirected to subscription page
5. Click "Subscribe Now"
6. Use test card: `4242 4242 4242 4242`
7. Complete payment
8. You'll be redirected to dashboard

### Test Cards
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`

### Simulate Events with Stripe CLI
```bash
# Test successful subscription
stripe trigger checkout.session.completed

# Test failed payment
stripe trigger invoice.payment_failed

# Test subscription cancellation
stripe trigger customer.subscription.deleted
```

## 🔧 How It Works

### Authentication Flow

1. **User clicks "Sign in with Google"**
   - Frontend calls `/auth/google` endpoint
   - Backend returns Google OAuth URL
   - Popup window opens with Google OAuth

2. **User completes OAuth on Google**
   - Google redirects to `/auth/callback` 
   - AuthCallback component handles the response
   - Sends authorization code to backend

3. **Backend processes authentication**
   - Exchanges code for access token
   - Fetches user info from Google
   - Checks subscription status
   - Generates JWT token
   - Returns user data and subscription status

4. **Frontend handles post-authentication**
   - If user has active subscription → Dashboard
   - If no subscription → Subscription page

### Subscription Flow

1. **User clicks "Subscribe Now"**
   - Frontend calls `/create-checkout-session`
   - Backend creates Stripe checkout session
   - User redirected to Stripe Checkout

2. **User completes payment**
   - Stripe processes payment
   - Stripe sends webhook to local server via CLI
   - Backend updates user subscription status
   - User redirected to dashboard

3. **Webhook Processing**
   - Stripe CLI forwards events to `localhost:3000/webhook`
   - Backend verifies webhook signature
   - Updates user subscription status in database
   - Handles various subscription events

### Key Features

- ✅ **Secure Authorization Code Flow** (not implicit flow)
- ✅ **JWT tokens** with 7-day expiration
- ✅ **HTTP-only cookies** for additional security
- ✅ **Popup-based OAuth** (no page redirects)
- ✅ **Session persistence** on page reload
- ✅ **Stripe CLI integration** for local webhook testing
- ✅ **Real-time subscription updates** via webhooks
- ✅ **Clean error handling**
- ✅ **Mobile responsive design**

### Security Considerations

- Backend handles all sensitive operations
- Client secret never exposed to frontend
- JWT tokens are validated on each request
- Webhook signatures verified using Stripe CLI secret
- CORS properly configured
- Secure cookie settings for production

## 🚨 Troubleshooting

### Webhook Issues
- **Events not received**: Ensure `stripe listen` is running
- **Signature verification failed**: Update webhook secret in .env from CLI output
- **Server not responding**: Restart server after updating webhook secret

### OAuth Issues
- **Redirect mismatch**: Check Google Console redirect URI matches exactly
- **Invalid client**: Verify Client ID in both frontend and backend .env

### Payment Issues
- **Checkout not working**: Verify Stripe keys are correct and in test mode
- **Subscription not activating**: Check webhook events are being processed

### General Issues
- **Database locked**: Restart server to release SQLite locks
- **CORS errors**: Verify FRONTEND_URL in server/.env
- **Token expired**: Clear localStorage and re-authenticate

## 📝 Development Tips

1. **Always start Stripe CLI first** - The webhook secret is needed before starting the server
2. **Monitor CLI output** - Watch for webhook events and errors
3. **Update webhook secret** - Remember to update .env when restarting CLI
4. **Use test mode** - Never use live Stripe keys in development
5. **Check server logs** - Monitor backend console for detailed error information

## 🎯 Production Deployment

1. **Stripe Configuration**
   - Switch to live mode in Stripe Dashboard
   - Get live API keys
   - Configure production webhook endpoint
   - Use webhook secret from Dashboard (not CLI)

2. **OAuth Configuration**
   - Add production domain to Google OAuth redirect URIs
   - Update environment variables

3. **Security**
   - Enable HTTPS
   - Use production database
   - Set secure cookie settings
   - Implement proper logging

4. **Webhook Setup**
   - Add webhook endpoint in Stripe Dashboard: `https://yourdomain.com/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Use webhook secret from Dashboard

Remember: In production, you won't use the Stripe CLI - webhooks will come directly from Stripe's servers to your production endpoint.