const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const Stripe = require("stripe");
const User = require("./models/User");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const { pool } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Load env from project root
dotenv.config({ path: path.join(__dirname, "../.env") });

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// --- Stripe webhook endpoint must come BEFORE express.json() ---
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription,
          );
          const customer = await stripe.customers.retrieve(session.customer);
          const user = await User.findByGoogleId(customer.metadata.googleId);
          if (user) {
            await User.updateSubscriptionStatus(
              user.id,
              "active",
              subscription.id,
              customer.id,
            );
            console.log(`User ${user.email} subscription activated`);
          }
          break;
        }
        case "customer.subscription.updated": {
          const updatedSubscription = event.data.object;
          const subCustomer = await stripe.customers.retrieve(
            updatedSubscription.customer,
          );
          const subUser = await User.findByGoogleId(
            subCustomer.metadata.googleId,
          );
          if (subUser) {
            const status =
              updatedSubscription.status === "active" ? "active" : "inactive";
            await User.updateSubscriptionStatus(
              subUser.id,
              status,
              updatedSubscription.id,
              subCustomer.id,
            );
          }
          break;
        }
        case "customer.subscription.deleted": {
          const deletedSubscription = event.data.object;
          const delCustomer = await stripe.customers.retrieve(
            deletedSubscription.customer,
          );
          const delUser = await User.findByGoogleId(
            delCustomer.metadata.googleId,
          );
          if (delUser) {
            await User.updateSubscriptionStatus(
              delUser.id,
              "canceled",
              null,
              delCustomer.id,
            );
          }
          break;
        }
        case "invoice.payment_failed": {
          const failedInvoice = event.data.object;
          const failedCustomer = await stripe.customers.retrieve(
            failedInvoice.customer,
          );
          const failedUser = await User.findByGoogleId(
            failedCustomer.metadata.googleId,
          );
          if (failedUser) {
            await User.updateSubscriptionStatus(
              failedUser.id,
              "past_due",
              failedUser.subscription_id,
              failedCustomer.id,
            );
          }
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook handler error:", error);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  },
);

// --- All other routes use express.json() ---
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Google OAuth config
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/callback`;

// JWT utility
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.display_name || user.name,
      picture: user.profile_picture_url,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token =
    req.cookies.auth_token || req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

const requireSubscription = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user || user.subscription_status !== "active") {
    return res.status(403).json({ error: "Active subscription required" });
  }
  req.user = user;
  next();
};

// Database connection test endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query(
      "SELECT NOW() as current_time, version() as db_version",
    );

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        currentTime: result.rows[0].current_time,
        version: result.rows[0].db_version.split(" ")[0], // Just get the version number
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error.message,
      },
      environment: process.env.NODE_ENV || "development",
    });
  }
});

// Basic API routes
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to Draw2StoryPlay API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      users: "/api/users",
      drawings: "/api/drawings",
      stories: "/api/stories",
      games: "/api/games",
    },
  });
});

// --- API Endpoints ---

// 1. Start Google OAuth
app.get("/auth/google", (req, res) => {
  const { isSignup } = req.query;
  const googleAuthURL = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthURL.searchParams.append("client_id", GOOGLE_CLIENT_ID);
  googleAuthURL.searchParams.append("redirect_uri", REDIRECT_URI);
  googleAuthURL.searchParams.append("response_type", "code");
  googleAuthURL.searchParams.append("scope", "openid email profile");
  googleAuthURL.searchParams.append("access_type", "offline");
  googleAuthURL.searchParams.append("prompt", "consent");
  if (isSignup === "true") {
    googleAuthURL.searchParams.append("state", "signup");
  }
  res.json({ authUrl: googleAuthURL.toString() });
});

// 2. Google OAuth callback
app.post("/auth/google/callback", async (req, res) => {
  try {
    const { code, state } = req.body;
    if (!code)
      return res.status(400).json({ error: "Authorization code is required" });
    // Exchange code for token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error)
      return res
        .status(400)
        .json({
          error: tokenData.error_description || "Token exchange failed",
        });
    // Get user info
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );
    const userData = await userResponse.json();
    if (userData.error)
      return res
        .status(400)
        .json({ error: "Failed to fetch user information" });
    // Upsert user in PostgreSQL
    let user = await User.findByGoogleId(userData.id);
    const isNewUser = !user;
    if (!user) {
      user = await User.create({
        google_id: userData.id,
        email: userData.email,
        display_name: userData.name,
        first_name: userData.given_name,
        last_name: userData.family_name,
        profile_picture_url: userData.picture,
      });
    } else {
      await User.updateProfile(user.id, {
        display_name: userData.name,
        first_name: userData.given_name,
        last_name: userData.family_name,
        profile_picture_url: userData.picture,
      });
      user = await User.findById(user.id);
    }
    // Generate JWT
    const token = generateToken(user);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
        picture: user.profile_picture_url,
        subscriptionStatus: user.subscription_status,
        isNewUser,
      },
      token,
      isSignup: state === "signup",
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during authentication" });
  }
});

// 3. Get user info
app.get("/auth/me", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.display_name,
      picture: user.profile_picture_url,
      subscriptionStatus: user.subscription_status,
    },
  });
});

// 4. Logout
app.post("/auth/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.json({ success: true, message: "Logged out successfully" });
});

// 5. Check subscription status
app.get("/check-subscription-status", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({
    subscriptionStatus: user.subscription_status,
    hasActiveSubscription: user.subscription_status === "active",
  });
});

// 6. Create Stripe checkout session
app.post("/create-checkout-session", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let customer;
    if (user.stripe_customer_id) {
      customer = await stripe.customers.retrieve(user.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.display_name,
        metadata: { googleId: user.google_id },
      });
      await User.updateSubscriptionStatus(
        user.id,
        user.subscription_status,
        user.subscription_id,
        customer.id,
      );
    }
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [{ price: process.env.MONTHLY_PRICE_ID, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscribe?canceled=true`,
      metadata: { googleId: user.google_id },
    });
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe checkout session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// 8. Dashboard data (protected)
app.get(
  "/dashboard-data",
  authenticateToken,
  requireSubscription,
  async (req, res) => {
    // Example: return some stats
    const stats = await User.getUserStats(req.user.id);
    res.json({
      message: "Welcome to your dashboard!",
      user: {
        name: req.user.name,
        email: req.user.email,
        subscriptionStatus: req.user.subscription_status,
      },
      data: { stats },
    });
  },
);

// 9. Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `The requested endpoint ${req.originalUrl} does not exist`,
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection before starting server
    await pool.query("SELECT 1");
    console.log("✓ Database connection successful");

    app.listen(PORT, () => {
      console.log(`🚀 Draw2StoryPlay server running on port ${PORT}`);
      console.log(
        `📊 Health check available at: http://localhost:${PORT}/api/health`,
      );
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        console.warn("⚠️  Warning: Google OAuth credentials not configured");
      }
      if (!process.env.STRIPE_SECRET_KEY) {
        console.warn("⚠️  Warning: Stripe credentials not configured");
      }
      console.log("💳 Stripe webhook endpoint: /webhook");
      console.log("🔐 Protected routes require active subscription");
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error);
    console.error(
      "Please check your database configuration and ensure PostgreSQL is running.",
    );
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await pool.end();
  process.exit(0);
});

startServer();
