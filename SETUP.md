# Draw2StoryPlay Database Setup Guide

This guide will help you set up the Draw2PlayDB PostgreSQL database and configure the Draw2StoryPlay application.

## Prerequisites

- Node.js (version 18 or higher)
- PostgreSQL (version 12 or higher)
- npm or yarn package manager

## Database Setup

### 1. Create the Database

You mentioned you've already created the `Draw2PlayDB` database using the PostgreSQL CLI. If you haven't, here's how:

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create the database
CREATE DATABASE "Draw2PlayDB";

-- Verify the database was created
\l

-- Exit psql
\q
```

### 2. Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file and update the database configuration:
   ```env
   # Database Configuration
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=Draw2PlayDB
   DB_PASSWORD=your_actual_password_here
   DB_PORT=5432
   ```

   **Important**: Replace `your_actual_password_here` with your actual PostgreSQL password.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
npm run migrate
```

This will create all the necessary tables:
- `users` - User accounts and authentication
- `drawings` - User drawings and sketches
- `stories` - AI-generated storybooks
- `games` - AI-generated interactive games
- `collaborations` - Collaborative drawing sessions
- `collaboration_participants` - Session participants

### 5. Test the Setup

```bash
npm run dev
```

Visit `http://localhost:3000/api/health` to verify the database connection is working.

## Automated Setup

You can also run the automated setup script:

```bash
node setup.js
```

This script will:
- Create the `.env` file from template
- Install dependencies
- Test database connection
- Run migrations
- Provide next steps

## Database Schema Overview

### Users Table
- Stores user authentication and profile information
- Supports Google OAuth integration
- Tracks subscription status for Stripe payments

### Drawings Table
- Stores user-created drawings as JSONB data
- Supports public/private visibility
- Includes tags and engagement metrics

### Stories Table
- Stores AI-generated storybooks
- Contains story content, audio URLs, and generation status
- Links to original drawings

### Games Table
- Stores AI-generated interactive games
- Contains game configuration and playable URLs
- Tracks game type and difficulty levels

### Collaborations Table
- Manages real-time collaborative drawing sessions
- Supports multiple participants with permissions
- Integrates with Socket.IO for real-time features

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running**:
   ```bash
   # Windows
   net start postgresql-x64-15
   
   # macOS/Linux
   sudo systemctl status postgresql
   ```

2. **Verify database exists**:
   ```sql
   psql -U postgres -l
   ```

3. **Test connection manually**:
   ```bash
   psql -U postgres -d Draw2PlayDB -c "SELECT version();"
   ```

### Migration Issues

If migrations fail:

1. Check database permissions
2. Ensure the database exists
3. Verify connection credentials in `.env`
4. Run migrations manually:
   ```bash
   node migrations/run-migrations.js
   ```

### Port Conflicts

If port 3000 is in use:
1. Change the port in `.env`:
   ```env
   PORT=3001
   ```
2. Or kill the process using port 3000

## Setting Up Redis
To setup redis for the prompt filtering run the following docker command:
```bash
docker run -d -p 6379:6379 --name redis redis
```
## Next Steps

After successful setup:

1. **Configure OAuth**: Set up Google OAuth credentials in `.env`
2. **Configure Stripe**: Add Stripe API keys for payment processing
3. **Set up Redis**: Install Redis for BullMQ task queues
4. **Configure AI Services**: Add API keys for story/game generation
5. **Start Development**: Begin building the frontend and additional features

## API Endpoints

Once running, the following endpoints will be available:

- `GET /api/health` - Database and server health check
- `GET /api` - API information and available endpoints
- `GET /api/users` - User management (to be implemented)
- `GET /api/drawings` - Drawing management (to be implemented)
- `GET /api/stories` - Story management (to be implemented)
- `GET /api/games` - Game management (to be implemented)

## Support

If you encounter issues:

1. Check the console output for error messages
2. Verify all prerequisites are installed
3. Ensure database credentials are correct
4. Check that PostgreSQL is running and accessible

# Draw2StoryPlay FrontEnd Setup Guide

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

**Terminal 4 - Task Queues for Filtering**
```bash
cd backend
node PromptWorker.js
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