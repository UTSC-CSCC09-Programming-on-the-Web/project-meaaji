import express from "express";

const app = express();
const PORT = 3001;

console.log("🔧 Starting test server...");

// Simple test routes
app.get("/ping", (req, res) => {
  console.log("🏓 Ping route hit");
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

app.get("/auth/test", (req, res) => {
  console.log("🔐 Auth test route hit");
  res.json({ message: "Auth test route working!", timestamp: new Date().toISOString() });
});

app.get("/debug", (req, res) => {
  console.log("🔍 Debug route hit");
  res.json({ 
    message: "Debug route working!",
    routes: ["/ping", "/auth/test", "/debug"],
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `The requested endpoint ${req.originalUrl} does not exist`,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log("🔐 Test routes: /ping, /auth/test, /debug");
});

export default app; 