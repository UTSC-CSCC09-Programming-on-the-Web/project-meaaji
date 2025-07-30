import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import Stripe from "stripe";
import User from "./models/User.js";
import path from "path";
import fetch from "node-fetch";
dotenv.config();
import multer from "multer";
import fs from "fs";
import Storybook from "./models/Storybook.js";
import { CohereClient } from "cohere-ai";
const cohere = new CohereClient({ token: process.env.CO_API_KEY });
import { Queue, QueueEvents } from "bullmq";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storybookModerationQueue = new Queue("storybookModeration", {
  connection: {
    host: process.env.REDIS_HOST || "redis",
    port: process.env.REDIS_PORT || 6379,
  },
});

const storybookModerationQueueEvents = new QueueEvents("storybookModeration", {  connection: {
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
},
});

const upload = multer({
  dest: path.join(__dirname, "uploads/"),
  limits: { fileSize: 10 * 1024 * 1024 },
});

import { pool } from "./config/database.js";

const app = express();
const PORT = process.env.PORT || 3000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const MAX_PAGES = 15;

// Environment variables are passed directly from Docker Compose
// No need to load .env file in container

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1);

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Security middleware - configure helmet to allow inline scripts for OAuth callback
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "",
    credentials: true,
  }),
);

// Rate limiting (temporarily disabled for testing)
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// Simple test route to check if backend is accessible
app.get("/test", (req, res) => {
  console.log("🔍 Test route hit");
  res.json({ message: "Backend is accessible", timestamp: new Date().toISOString() });
});

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
const REDIRECT_URI = `${process.env.FRONTEND_URL || "https://draw2play.xyz"}/auth/callback`;

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

console.log("🔧 Registering API routes...");

try {
  // Simple test route - should always work
  app.get("/ping", (req, res) => {
    console.log("🏓 Ping route hit");
    res.json({ message: "pong", timestamp: new Date().toISOString() });
  });

  // Test route without User model dependency
  app.get("/auth/simple", (req, res) => {
    console.log("🔐 Simple auth route hit");
    res.json({ message: "Simple auth route working!", timestamp: new Date().toISOString() });
  });

  // Debug route - test if server is loading routes
  app.get("/debug", (req, res) => {
    console.log("🔍 Debug route hit");
    res.json({ 
      message: "Debug route working!",
      routes: ["/auth/test", "/auth/google", "/auth/callback"],
      timestamp: new Date().toISOString()
    });
  });

  // Test route
  app.get("/auth/test", (req, res) => {
    console.log("🧪 Test route hit");
    res.json({ message: "Auth test route working!" });
  });

  console.log("✅ API routes registered successfully");
} catch (error) {
  console.error("❌ Error registering API routes:", error);
}

// Test route to verify backend is receiving requests
app.get("/auth/test", (req, res) => {
  console.log("🔐 Test route hit");
  res.json({ message: "Backend is working" });
});

// Test OAuth callback route
app.get("/auth/callback/test", (req, res) => {
  console.log("🔐 Test OAuth callback route hit");
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test OAuth Callback</title>
    </head>
    <body>
      <script>
        console.log('🔐 Test OAuth callback: Starting test message process');
        
        // Add delay to simulate real OAuth callback
        setTimeout(() => {
          console.log('🔐 Test OAuth callback: Attempting to send test message');
          try {
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_SUCCESS',
                payload: {
                  success: true,
                  user: {
                    id: 'test-123',
                    email: 'test@test.com',
                    name: 'Test User',
                    picture: 'https://example.com/pic.jpg',
                    subscriptionStatus: 'inactive',
                    isNewUser: true
                  },
                  token: 'test-token-123',
                  isSignup: true
                }
              }, '*');
              console.log('🔐 Test OAuth callback: Test message sent successfully');
            } else {
              console.error('🔐 Test OAuth callback: window.opener is null');
            }
          } catch (error) {
            console.error('🔐 Test OAuth callback: Error sending message:', error);
          }
        }, 500);
      </script>
      <p>Test OAuth callback complete! You can close this window.</p>
    </body>
    </html>
  `);
});

// 1. Start Google OAuth
app.get("/auth/google", (req, res) => {
  console.log("🔐 Google OAuth route hit");
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

// 2. Google OAuth callback (GET - serves frontend component)
app.get("/auth/callback", (req, res) => {
  console.log("🔐 GET /auth/callback hit with URL:", req.url);
  console.log("🔐 Query parameters:", req.query);
  
  // Extract the query string from the request
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback${queryString}`;
  
  console.log("🔐 Redirecting to:", redirectUrl);
  
  // This route should serve the frontend Vue component
  // The frontend will handle the OAuth code and call the POST endpoint
  res.redirect(redirectUrl);
});

// 3. Google OAuth callback (POST - for API calls)
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
  console.log("🔍 Starting checkout session creation...");
  console.log("📋 Environment variables:");
  console.log("  - MONTHLY_PRICE_ID:", process.env.MONTHLY_PRICE_ID);
  console.log("  - FRONTEND_URL:", process.env.FRONTEND_URL);
  console.log("  - STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "SET" : "NOT SET");
  
  try {
    console.log("👤 Finding user...");
    const user = await User.findById(req.user.id);
    console.log("  - User found:", user ? `ID: ${user.id}, Email: ${user.email}` : "NOT FOUND");
    
    if (!user) {
      throw new Error("User not found");
    }
    
    let customer;
    if (user.stripe_customer_id) {
      console.log("🔍 Retrieving existing Stripe customer...");
      try {
      customer = await stripe.customers.retrieve(user.stripe_customer_id);
        console.log("  - Existing customer found:", customer.id);
      } catch (error) {
        console.log("  - Customer not found in Stripe, creating new one...");
        // Customer doesn't exist in Stripe, create a new one
        customer = await stripe.customers.create({
          email: user.email,
          name: user.display_name,
          metadata: { googleId: user.google_id },
        });
        console.log("  - New customer created:", customer.id);
        
        console.log("💾 Updating user with new Stripe customer ID...");
        await User.updateSubscriptionStatus(
          user.id,
          user.subscription_status,
          user.subscription_id,
          customer.id,
        );
      }
    } else {
      console.log("🆕 Creating new Stripe customer...");
      customer = await stripe.customers.create({
        email: user.email,
        name: user.display_name,
        metadata: { googleId: user.google_id },
      });
      console.log("  - New customer created:", customer.id);
      
      console.log("💾 Updating user with Stripe customer ID...");
      await User.updateSubscriptionStatus(
        user.id,
        user.subscription_status,
        user.subscription_id,
        customer.id,
      );
    }
    
    console.log("🛒 Creating Stripe checkout session...");
    console.log("  - Price ID:", process.env.MONTHLY_PRICE_ID);
    console.log("  - Customer ID:", customer.id);
    console.log("  - Success URL:", `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`);
    console.log("  - Cancel URL:", `${process.env.FRONTEND_URL}/subscribe?canceled=true`);
    
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [{ price: process.env.MONTHLY_PRICE_ID, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscribe?canceled=true`,
      metadata: { googleId: user.google_id },
    });
    
    console.log("✅ Checkout session created successfully:", session.id);
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("❌ Stripe checkout session error:");
    console.error("  - Error message:", error.message);
    console.error("  - Error type:", error.type);
    console.error("  - Error code:", error.code);
    console.error("  - Full error:", JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: "Failed to create checkout session",
      details: error.message,
      type: error.type,
      code: error.code
    });
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

app.post(
  "/api/storybooks",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("[API] Received request to create storybook");
      const user = await User.findById(req.user.id);
      if (!user) {
        console.warn("[API] User not found:", req.user.id);
        return res.status(404).json({ error: "User not found" });
      }

      const title = req.body.title;
      if (!title) {
        console.warn("[API] Missing title in request");
        return res.status(400).json({ error: "Title required" });
      }

      const prompt = req.body.prompt;
      if (!prompt) {
        console.warn("[API] Missing prompt in request");
        return res.status(400).json({ error: "Prompt required" });
      }

      console.log(`[API] Adding moderation job for title: "${title}"`);
      const job = await storybookModerationQueue.add("moderate", { title, prompt });

      console.log(`[API] Waiting for moderation result of job ${job.id}`);
      const result = await job.waitUntilFinished(storybookModerationQueueEvents);
      console.log(`[API] Moderation result for job ${job.id}:`, result);
      if (!result.allowed) {
        console.warn(`[API] Content not kid friendly for job ${job.id}`);
        return res.status(400).json({ error: "Uh oh, we don't allow content like that here!" });
      }

      let image_url = null;
      if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
        console.log("[API] Uploaded image URL:", image_url);
      }

      // Compose Cohere prompt
      let coherePrompt = `Write a children's story in 10-15 short pages (1-2 sentences per page), the title of the story is, but don't pass it back to me: '${title}'. The story should be about: "${prompt}". The story should be around 20-30 sentences in total. EXPLICITLY do not include a title, any introduction, explanation, or commentary—just the story itself. Do not start with phrases like 'Sure,' 'Here is...', a title and DO NOT end with the end, simply leave the story as is. Begin directly with the first sentence of the story.`;
      if (image_url) {
        coherePrompt += ` Incorporate the image into the story, but do not mention the image directly.`;
      }
      console.log("[API] Sending generation request to Cohere");

      let storyText = "";
      try {
        const cohereRes = await cohere.generate({
          model: "command",
          prompt: coherePrompt,
          max_tokens: 1200,
          temperature: 0.8,
        });
        storyText = cohereRes.generations[0].text;
        console.log("[API] Received story text from Cohere, processing...");

        // Remove any leading meta text before the story
        storyText = storyText.replace(/^(.*?)(Once upon a time|[A-Z][^\n]*)/, "$2");

        // --- Post-process to remove title, intro, and 'The End' ---
        let lines = storyText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        if (
          lines.length &&
          (normalize(lines[0]) === normalize(title) || (lines[0].length < 60 && !lines[0].endsWith(".")))
        ) {
          lines.shift();
        }
        const introPatterns = [
          /^here( is|'s)/i,
          /^sure[.!]?/i,
          /^let'?s begin/i,
          /^once upon a time/i,
          /^story:/i,
          /^title:/i,
          /^introduction:/i,
        ];
        while (lines.length && introPatterns.some((pat) => pat.test(lines[0]))) {
          lines.shift();
        }
        if (lines.length && /^the end[.!]?$/i.test(lines[lines.length - 1])) {
          lines.pop();
        }
        storyText = lines.join("\n");
        console.log("[API] Story text post-processing complete");
      } catch (error) {
        if (error.statusCode === 429) {
          console.warn("[API] Cohere rate limit reached");
          return res.status(429).json({ error: "Cohere rate limit reached. Please try again later." });
        }
        console.error("[API] Cohere API error:", error);
        return res.status(500).json({ error: "Failed to genereate storybook", details: error.message });
      }

      // Split into pages (paragraphs)
      let pages = storyText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

      // For each page, if more than 2 sentences, split into pages of 2 sentences each
      let finalPages = [];
      for (const page of pages) {
        const sentences = page.match(/[^.!?]+[.!?]+/g) || [page];
        if (sentences.length > 2) {
          for (let i = 0; i < sentences.length; i += 2) {
            finalPages.push(sentences.slice(i, i + 2).join(" ").trim());
          }
        } else {
          finalPages.push(page);
        }
      }
      pages = finalPages;

      if (pages.length > MAX_PAGES) pages = pages.slice(0, MAX_PAGES);
      console.log(`[API] Split story into ${pages.length} pages`);

      // Generate a single seed for this storybook
      const seed = Math.floor(Math.random() * 1000000);
      console.log("[API] Generated seed for images:", seed);

      // Generate images for each page
      const images = [];
      let counter = 0;
      try {
        for (const pageText of pages) {
          const imageUrl = await generateImageWithStabilityAI(pageText, seed);
          images.push(imageUrl);
          console.log(`Finished generating image number ${counter}: ${imageUrl}`);
          counter++;
        }
      } catch (stabilityError) {
        console.error("[API] Stability AI error:", stabilityError);
        return res.status(500).json({
          error: "Failed to generate images with Stability AI",
          details: stabilityError.message || stabilityError.toString(),
          source: "stability",
        });
      }

      const storybook = await Storybook.create({
        user_id: user.id,
        title,
        prompt,
        image_url,
        pages,
        images, // new field
      });
      console.log("[API] Storybook saved successfully", { storybookId: storybook.id });

      res.json({ storybook });
    } catch (error) {
      const errorMessage = String(error);
      if (errorMessage.includes(" Content flagged as inappropriate for kids")){
        console.error("Please refrain from inappropriate content!")
        let source = error.source || "unknown";
        res.status(500).json({ error: "Uh Oh we don't allow that type of content here", details: error.message, source });
      }
      console.error("[API] Storybook creation error:", error);
      let source = error.source || "unknown";
      if (error.details && error.error && error.error.includes("Cohere")) source = "cohere";
      res.status(500).json({ error: "Failed to generate storybook", details: error.message, source });
    }
  }
);

// GET /api/storybooks - get user's storybooks
app.get("/api/storybooks", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const storybooks = await Storybook.findByUser(user.id);
    res.json({ storybooks });
  } catch (error) {
    console.error("Fetch storybooks error:", error);
    res.status(500).json({ error: "Failed to fetch storybooks" });
  }
});

// DELETE /api/storybooks/:id - delete a single storybook
app.delete("/api/storybooks/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const id = req.params.id;
    // Only allow deleting user's own storybooks
    const result = await Storybook.deleteById(id, user.id);
    if (result) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Storybook not found or not yours" });
    }
  } catch (error) {
    console.error("Delete storybook error:", error);
    res.status(500).json({ error: "Failed to delete storybook" });
  }
});

// DELETE /api/storybooks - delete all storybooks for the user
app.delete("/api/storybooks", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await Storybook.deleteAllByUser(user.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete all storybooks error:", error);
    res.status(500).json({ error: "Failed to delete all storybooks" });
  }
});

const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:5173");
  res.header("Cross-Origin-Resource-Policy", "same-site");
  next();
}, express.static(uploadsPath));

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

// 404 handler - must be last
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
      console.log("🔐 Auth routes registered: /auth/google, /auth/callback, /auth/test");
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

async function generateImageWithStabilityAI(prompt, seed) {
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt }],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30,
      seed // pass the seed for style continuity
    })
  });
  // Try to parse the response as JSON
  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error('Failed to parse Stability API response as JSON');
  }

  // Check for errors in the response
  if (!response.ok) {
    console.error('Stability API error:', data);
    throw new Error(data.message || 'Stability API error');
  }
  if (!data.artifacts || !data.artifacts[0] || !data.artifacts[0].base64) {
    console.error('Stability API returned unexpected data:', data);
    throw new Error('Stability API did not return an image');
  }

  const base64 = data.artifacts[0].base64;
  const filename = `page_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
  const filePath = path.join(__dirname, 'uploads', filename);
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  return `/uploads/${filename}`;
}
