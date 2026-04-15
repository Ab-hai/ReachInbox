import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { initializeEthereal } from "./config/email.js";
import { redisConnection } from "./config/redis.js";
import { createEmailWorker } from "./queues/emailWorker.js";
import { authRoutes, emailRoutes } from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    redis: redisConnection.status,
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// Start server
const startServer = async () => {
  try {
    // Initialize Ethereal Email
    console.log("📧 Initializing Ethereal Email...");
    await initializeEthereal();

    // Start email worker
    console.log("🔄 Starting email worker...");
    createEmailWorker();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`\n📝 Environment:`);
      console.log(`   - Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`   - Worker Concurrency: ${process.env.WORKER_CONCURRENCY || 5}`);
      console.log(`   - Max Emails/Hour: ${process.env.MAX_EMAILS_PER_HOUR || 200}`);
      console.log(`   - Email Delay: ${process.env.EMAIL_DELAY_MS || 2000}ms`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
