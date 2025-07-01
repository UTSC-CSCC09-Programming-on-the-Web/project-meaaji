import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import Stripe from 'stripe';
import { dbHelpers } from './database.js';
import { authenticateToken, requireSubscription } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Raw body parser for Stripe webhooks (must be before express.json())
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cookieParser());

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`;

// Utility function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      name: user.name 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Route to start OAuth flow
app.get('/auth/google', (req, res) => {
  const { isSignup } = req.query;
  
  const googleAuthURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthURL.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  googleAuthURL.searchParams.append('redirect_uri', REDIRECT_URI);
  googleAuthURL.searchParams.append('response_type', 'code');
  googleAuthURL.searchParams.append('scope', 'openid email profile');
  googleAuthURL.searchParams.append('access_type', 'offline');
  googleAuthURL.searchParams.append('prompt', 'consent');
  
  // Pass signup state through OAuth state parameter
  if (isSignup === 'true') {
    googleAuthURL.searchParams.append('state', 'signup');
  }

  res.json({ authUrl: googleAuthURL.toString() });
});

// Route to handle OAuth callback and exchange code for token
app.post('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || 'Token exchange failed' });
    }

    // Fetch user information using access token
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (userData.error) {
      return res.status(400).json({ error: 'Failed to fetch user information' });
    }

    // Check if user exists in database
    let user = await dbHelpers.getUser(userData.id);
    const isNewUser = !user;

    // Create or update user in database
    await dbHelpers.upsertUser({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      picture: userData.picture
    });

    // Get updated user data
    user = await dbHelpers.getUser(userData.id);

    // Generate JWT token
    const token = generateToken(user);

    // Set HTTP-only cookie for security
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data and subscription status
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        subscriptionStatus: user.subscription_status,
        isNewUser
      },
      token,
      isSignup: state === 'signup'
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// Route to verify JWT token and get user info
app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      subscriptionStatus: req.user.subscription_status
    }
  });
});

// Route to check subscription status
app.get('/check-subscription-status', authenticateToken, (req, res) => {
  res.json({
    subscriptionStatus: req.user.subscription_status,
    hasActiveSubscription: req.user.subscription_status === 'active'
  });
});

// Route to create Stripe checkout session
app.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Create or retrieve Stripe customer
    let customer;
    if (user.stripe_customer_id) {
      customer = await stripe.customers.retrieve(user.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          googleId: user.id
        }
      });

      // Update user with Stripe customer ID
      await dbHelpers.updateSubscription(user.id, {
        stripeCustomerId: customer.id,
        subscriptionStatus: user.subscription_status,
        subscriptionId: user.subscription_id
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.MONTHLY_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscribe?canceled=true`,
      metadata: {
        googleId: user.id
      }
    });

    res.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Stripe checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        // Get the subscription
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const customer = await stripe.customers.retrieve(session.customer);

        // Update user subscription status
        const user = await dbHelpers.getUserByStripeId(customer.id);
        if (user) {
          await dbHelpers.updateSubscription(user.id, {
            stripeCustomerId: customer.id,
            subscriptionStatus: 'active',
            subscriptionId: subscription.id
          });
          console.log(`User ${user.email} subscription activated`);
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log('Subscription updated:', updatedSubscription.id);

        const subCustomer = await stripe.customers.retrieve(updatedSubscription.customer);
        const subUser = await dbHelpers.getUserByStripeId(subCustomer.id);

        if (subUser) {
          const status = updatedSubscription.status === 'active' ? 'active' : 'inactive';
          await dbHelpers.updateSubscription(subUser.id, {
            stripeCustomerId: subCustomer.id,
            subscriptionStatus: status,
            subscriptionId: updatedSubscription.id
          });
          console.log(`User ${subUser.email} subscription status: ${status}`);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('Subscription deleted:', deletedSubscription.id);

        const delCustomer = await stripe.customers.retrieve(deletedSubscription.customer);
        const delUser = await dbHelpers.getUserByStripeId(delCustomer.id);

        if (delUser) {
          await dbHelpers.updateSubscription(delUser.id, {
            stripeCustomerId: delCustomer.id,
            subscriptionStatus: 'canceled',
            subscriptionId: null
          });
          console.log(`User ${delUser.email} subscription canceled`);
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('Payment failed for invoice:', failedInvoice.id);

        const failedCustomer = await stripe.customers.retrieve(failedInvoice.customer);
        const failedUser = await dbHelpers.getUserByStripeId(failedCustomer.id);

        if (failedUser) {
          await dbHelpers.updateSubscription(failedUser.id, {
            stripeCustomerId: failedCustomer.id,
            subscriptionStatus: 'past_due',
            subscriptionId: failedUser.subscription_id
          });
          console.log(`User ${failedUser.email} payment failed - marked as past due`);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Protected route - requires authentication and active subscription
app.get('/dashboard-data', authenticateToken, requireSubscription, (req, res) => {
  res.json({
    message: 'Welcome to your dashboard!',
    user: {
      name: req.user.name,
      email: req.user.email,
      subscriptionStatus: req.user.subscription_status
    },
    data: {
      stats: {
        totalUsers: 1234,
        revenue: 56700,
        growth: 12.5
      }
    }
  });
});

// Route to logout
app.post('/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Warning: Google OAuth credentials not configured');
  }
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  Warning: Stripe credentials not configured');
  }
  
  console.log('💳 Stripe webhook endpoint: /webhook');
  console.log('🔐 Protected routes require active subscription');
});