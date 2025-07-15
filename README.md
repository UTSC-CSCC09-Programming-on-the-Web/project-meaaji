<<<<<<< HEAD
# Draw2StoryPlay

## 👥 Team Members

- Aashir Mallik – aashir.mallik@mail.utoronto.ca (utorid: mallika9)
- Mealad Ebadi – mealad.ebadi@mail.utoronto.ca (utorid: ebadimea)
- Ji Sung Han – jishan.han@mail.utoronto.ca (utorid: hanji11)

---

## 📌 Project Overview

**Draw2StoryPlay** is a creative web application that allows children to draw simple sketches and generate fully animated **storybooks** or interactive **2D games** from their creations using AI.

Users draw directly on a canvas and input a prompt (e.g., "This stickman goes on a space adventure"). Our system then generates:
- an illustrated storybook with text-to-speech and pronunciation highlighting, and/or
- a simple interactive animation/game where the drawn character can walk, jump, and interact.

**Main Features**:
- ✏️ Real-time collaborative drawing canvas
- 📖 AI-generated stories with voice support and letter highlighting for learning
- 🕹️ Basic animations (walking, jumping, attacking) for stick figure characters
- 🧸 Export as storybook or playable 2D experience
- 🛒 Shareable marketplace (with review, feedback, and reusability features)

---

## 💻 Tech Stack

| Component        | Technology |
|------------------|------------|
| Frontend         | Vue 3 (SPA with Composition API) |
| Backend          | Express.js (REST API) |
| Main Database    | PostgreSQL |
| Realtime Feature | Socket.IO |
| Task Queue       | BullMQ with Redis |
| Authentication   | OAuth 2.0 (Google login) |
| Payments         | Stripe Checkout (Sandbox mode, subscription required) |
| Deployment       | Google Cloud VM + Docker + Docker Compose |
| CI/CD            | GitHub Actions |

---

## ✅ Additional Requirements Fulfilled

1. **Real-Time Functionality**  
Collaborative drawing board that reflects changes across users without refreshing (via Socket.IO)

2. **Task Queue Functionality**  
Story and animation generation is handled asynchronously through task queues (BullMQ + Redis)

---

## 📆 Milestones

| Version | Goals |
|---------|-------|
| 🔹 Alpha | Set up drawing board, basic OAuth login, REST API scaffold |
| 🔹 Beta  | Implement real-time collaboration, AI story/game generation with task queue, Stripe integration |
| 🔹 Final | Full animation system, storybook/game export, GCP deployment, CI/CD setup |

---

## 🌐 Deployment Details

The application will be deployed on a **Google Cloud Virtual Machine** using **Docker** and **Docker Compose**. All Docker and CI/CD configuration files will be included in the repository. The deployed application will be **publicly accessible** without needing whitelisting or extra credentials.

---

## 🔐 Security and Payment Compliance

- OAuth 2.0 (Google) authentication
- Stripe Checkout in sandbox mode (subscription required to access app)
- Subscription status determines login behavior:
  - No subscription → redirect to payment page
  - Cancelled/failure → block access
- User data securely stored (hashed passwords, encrypted sensitive fields)

---



## ✨ Impact

This app promotes **creative storytelling, reading, and digital literacy** among children by turning their imagination into stories and simple games.  
It combines **education and entertainment**, while fostering **collaboration** and **sharing** through a marketplace system.

---
=======
# Vue 3 + Express OAuth SPA with Stripe Subscriptions

A modern Single Page Application built with Vue 3 and Express.js featuring Google OAuth 2.0 authentication and Stripe subscription management.

## 🚀 Features

- **Google OAuth 2.0 Authentication** - Secure login with Google accounts
- **Stripe Subscription Management** - Monthly subscription billing with CLI testing
- **Protected Routes** - Access control based on subscription status
- **Modern UI** - Clean, responsive design with Tailwind CSS
- **Secure Backend** - JWT tokens, webhook validation, and encrypted data
- **Real-time Updates** - Subscription status updates via webhooks
- **Local Development** - Stripe CLI integration for easy testing

## 🛠 Tech Stack

### Frontend
- Vue 3 with Composition API
- TypeScript
- Vue Router
- Tailwind CSS
- Stripe.js

### Backend
- Express.js
- SQLite Database
- JWT Authentication
- Stripe SDK
- Google OAuth 2.0

## 📋 Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account
- Stripe account (test mode)
- Stripe CLI (for local development)

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
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
4. Create OAuth 2.0 credentials:
   - Choose **Web application**
   - Add authorized redirect URI: `http://localhost:5173/auth/callback`
5. Copy Client ID and Client Secret

### 4. Stripe Setup (Test Mode)

#### Get API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch to **Test mode**
3. Go to **Developers** → **API keys**
4. Copy Publishable and Secret keys

#### Create Subscription Product
1. Go to **Products** → **Add product**
2. Set name: "Monthly Subscription"
3. Set pricing: Recurring, Monthly, $9.99
4. Copy the **Price ID** (starts with `price_`)

#### Setup Local Webhooks with Stripe CLI
**CRITICAL: This step is required for payment testing!**

1. **Start the webhook listener** (keep this running during development):
```bash
stripe listen --forward-to localhost:3000/webhook
```

2. **Copy the webhook signing secret** from the CLI output:
```bash
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

3. **Important:** The webhook secret changes each time you restart the CLI, so you'll need to update your environment files accordingly.

### 5. Environment Configuration

**Frontend (.env):**
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

**Backend (server/.env):**
```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_super_secret_jwt_key_make_it_long_and_random
PORT=3000
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_cli
MONTHLY_PRICE_ID=price_your_monthly_price_id
```

### 6. Start Development Environment

**You need 3 terminal windows:**

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Stripe Webhook Listener:**
```bash
stripe listen --forward-to localhost:3000/webhook
```
*Copy the webhook secret from this output to your server/.env file*

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
1. Sign in with Google
2. You'll be redirected to subscription page
3. Click "Subscribe Now"
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. You'll be redirected to dashboard

### Test Cards
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

### Simulate Webhook Events with Stripe CLI
Test subscription events without going through checkout:

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

### Monitor Webhook Events
Watch the Stripe CLI output to see events in real-time:
```bash
stripe listen --forward-to localhost:3000/webhook
```

You should see events like:
```
2024-01-15 10:30:45   --> checkout.session.completed [evt_1ABC123]
2024-01-15 10:30:45  <--  [200] POST http://localhost:3000/webhook [evt_1ABC123]
```

## 🔒 Security Features

- **JWT Authentication** with 7-day expiration
- **HTTP-only cookies** for token storage
- **Webhook signature verification** using Stripe CLI secrets
- **Route protection** with subscription validation
- **Environment variable protection**
- **Secure database operations**

## 📊 Application Flow

1. **User visits app** → Redirected to login
2. **Google OAuth** → User authenticates with Google
3. **Subscription check** → If no active subscription, redirect to payment
4. **Stripe Checkout** → User completes payment
5. **Webhook processing** → Subscription status updated via Stripe CLI
6. **Dashboard access** → User can access premium features

## 🚨 Troubleshooting

### Common Issues

**Webhook not receiving events**
- Ensure Stripe CLI is running: `stripe listen --forward-to localhost:3000/webhook`
- Check webhook secret in server/.env matches CLI output
- Restart server after updating webhook secret

**Webhook signature verification failed**
- The webhook secret changes each time you restart `stripe listen`
- Copy the new secret from CLI output to server/.env
- Restart your backend server

**OAuth redirect mismatch**
- Verify redirect URI in Google Cloud Console: `http://localhost:5173/auth/callback`
- Check FRONTEND_URL in server/.env

**Payment not completing**
- Verify STRIPE_WEBHOOK_SECRET matches CLI output
- Check webhook events are being received (watch CLI output)
- Monitor server logs for webhook errors

**Database issues**
- Restart server to release SQLite locks
- Check file permissions in server directory

### Development Workflow Tips

1. **Always start Stripe CLI first** before testing payments
2. **Update webhook secret** in .env when restarting CLI
3. **Monitor CLI output** to see webhook events
4. **Use test cards** for all payment testing
5. **Check server logs** for detailed error information

## 📝 API Endpoints

### Authentication
- `GET /auth/google` - Start OAuth flow
- `POST /auth/google/callback` - Handle OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout user

### Subscription
- `GET /check-subscription-status` - Check subscription status
- `POST /create-checkout-session` - Create Stripe checkout
- `POST /webhook` - Handle Stripe webhooks (secured with CLI secret)

### Protected
- `GET /dashboard-data` - Get dashboard data (requires active subscription)

## 🎯 Production Deployment

### Stripe Configuration
1. Switch Stripe to live mode
2. Get live API keys from Stripe Dashboard
3. Configure production webhook endpoint in Stripe Dashboard
4. Use webhook secret from Dashboard (not CLI)

### Other Updates
1. Update OAuth redirect URIs for production domain
2. Set production environment variables
3. Enable HTTPS
4. Configure production database
5. Set up proper webhook endpoints

### Production Webhook Setup
Instead of Stripe CLI, configure webhooks in Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Add endpoint: `https://yourdomain.com/webhook`
3. Select the same events as listed in the development setup
4. Use the webhook secret from the Dashboard

## 📄 License

MIT License - see LICENSE file for details

---

## 🔄 Quick Start Checklist

- [ ] Install Node.js and npm
- [ ] Install Stripe CLI and authenticate
- [ ] Set up Google OAuth credentials
- [ ] Set up Stripe test account and get API keys
- [ ] Create Stripe subscription product
- [ ] Copy environment variables to .env files
- [ ] Start Stripe CLI webhook listener
- [ ] Copy webhook secret to server/.env
- [ ] Start backend server
- [ ] Start frontend server
- [ ] Test authentication and payment flow

**Remember:** The Stripe CLI webhook secret changes each time you restart the listener!

## 📚 AI Storybook Generator (NEW)

**Create a 10-15 page children’s storybook using AI (powered by Cohere)!**

### How it works
- On the dashboard, enter a prompt and (optionally) upload an image.
- Click "Generate Storybook".
- The backend calls Cohere's Command model to generate a storybook (1-2 sentences per page, 10-15 pages, ~20-30 sentences total).
- The storybook (prompt, image, pages) is saved to your account.
- You can view all your previous storybooks on the dashboard, and read them in a paginated, book-like viewer.

### Usage
1. Go to the Dashboard (after subscribing and logging in)
2. Enter a creative prompt (e.g., "A dragon who learns to dance")
3. (Optional) Upload an image to inspire the story
4. Click **Generate Storybook**
5. Wait for the AI to generate your storybook (may take a few seconds)
6. View your new storybook and all previous storybooks below

### API Endpoints
- `POST /api/storybooks` (auth required)
  - Form fields: `prompt` (string, required), `image` (file, optional)
  - Returns: `{ storybook: { id, prompt, image_url, pages, created_at } }`
- `GET /api/storybooks` (auth required)
  - Returns: `{ storybooks: [ ... ] }`
- `DELETE /api/storybooks/:id` (auth required)
  - Deletes a single storybook
- `DELETE /api/storybooks` (auth required)
  - Deletes all storybooks for the user

### Database
- Table: `storybooks`
  - `id` (serial, PK)
  - `user_id` (int, FK)
  - `prompt` (text)
  - `image_url` (text, local file path)
  - `pages` (jsonb, array of strings)
  - `created_at` (timestamp)

### Local Image Storage
- Uploaded images are stored in `backend/uploads/` and served at `/uploads/<filename>`
- No external image hosting required

### Requirements
- **Cohere API key**: Add `COHERE_API_KEY=your_actual_key_here` to your `.env` file in the backend
- **Cohere free tier** is sufficient for prototyping

### Example .env additions
```
COHERE_API_KEY=your_actual_key_here
```

### Troubleshooting
- If storybook generation fails, check your Cohere API key and quota at https://dashboard.cohere.com/
- Images must be under 10MB
- If you see `[object Object]` in story pages, check backend logs for errors
- If stories are not paginated, the app will automatically split the story into pages (2 sentences per page)

---
