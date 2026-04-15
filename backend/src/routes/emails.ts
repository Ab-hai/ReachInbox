import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, emails } from "../db/index.js";
import { isAuthenticated, AppUser } from "../middleware/auth.js";
import { scheduleEmail, getQueueStats } from "../queues/emailQueue.js";
import { getRateLimitStats } from "../services/rateLimiter.js";

const router = Router();

// All routes require authentication
router.use(isAuthenticated);

// Schedule bulk emails
router.post("/schedule", async (req, res) => {
  try {
    const { subject, body, recipients, scheduledAt, delayBetweenEmails } =
      req.body;

    // Validation
    if (!subject || !body || !recipients || !scheduledAt) {
      return res.status(400).json({
        error: "Missing required fields: subject, body, recipients, scheduledAt",
      });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        error: "Recipients must be a non-empty array of email addresses",
      });
    }

    const user = req.user as AppUser;
    const userId = user.id;
    const batchId = uuidv4();
    const scheduledTime = new Date(scheduledAt);
    const now = new Date();

    // Calculate base delay from now to scheduled time
    const baseDelayMs = Math.max(0, scheduledTime.getTime() - now.getTime());
    const emailDelayMs = delayBetweenEmails || 2000; // Default 2 seconds

    console.log(
      `📧 Scheduling ${recipients.length} emails for batch ${batchId}`
    );

    const createdEmails: any[] = [];
    const scheduledJobs: any[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipientEmail = recipients[i].trim();

      // Validate email format
      if (!recipientEmail || !recipientEmail.includes("@")) {
        console.warn(`Skipping invalid email: ${recipientEmail}`);
        continue;
      }

      // Calculate delay for this specific email (staggered)
      const emailDelay = baseDelayMs + i * emailDelayMs;

      // Create email record in database
      const [emailRecord] = await db
        .insert(emails)
        .values({
          userId,
          recipientEmail,
          subject,
          body,
          scheduledAt: new Date(now.getTime() + emailDelay),
          status: "scheduled",
          batchId,
        })
        .returning();

      createdEmails.push(emailRecord);

      // Schedule job in BullMQ
      const job = await scheduleEmail(
        {
          emailId: emailRecord.id,
          recipientEmail,
          subject,
          body,
          userId,
          batchId,
        },
        emailDelay,
        `email-${emailRecord.id}` // Idempotency key
      );

      // Update email with job ID
      await db
        .update(emails)
        .set({ jobId: job.id })
        .where(eq(emails.id, emailRecord.id));

      scheduledJobs.push({
        emailId: emailRecord.id,
        jobId: job.id,
        scheduledAt: emailRecord.scheduledAt,
      });
    }

    res.status(201).json({
      message: `Successfully scheduled ${createdEmails.length} emails`,
      batchId,
      emailCount: createdEmails.length,
      scheduledJobs,
    });
  } catch (error) {
    console.error("Error scheduling emails:", error);
    res.status(500).json({
      error: "Failed to schedule emails",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get scheduled emails (pending)
router.get("/scheduled", async (req, res) => {
  try {
    const user = req.user as AppUser;
    const userId = user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const scheduledEmails = await db.query.emails.findMany({
      where: and(
        eq(emails.userId, userId),
        eq(emails.status, "scheduled")
      ),
      orderBy: [desc(emails.scheduledAt)],
      limit,
      offset,
    });

    res.json({
      emails: scheduledEmails,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching scheduled emails:", error);
    res.status(500).json({ error: "Failed to fetch scheduled emails" });
  }
});

// Get sent emails
router.get("/sent", async (req, res) => {
  try {
    const user = req.user as AppUser;
    const userId = user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const sentEmails = await db.query.emails.findMany({
      where: and(
        eq(emails.userId, userId),
        eq(emails.status, "sent")
      ),
      orderBy: [desc(emails.sentAt)],
      limit,
      offset,
    });

    res.json({
      emails: sentEmails,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching sent emails:", error);
    res.status(500).json({ error: "Failed to fetch sent emails" });
  }
});

// Get failed emails
router.get("/failed", async (req, res) => {
  try {
    const user = req.user as AppUser;
    const userId = user.id;

    const failedEmails = await db.query.emails.findMany({
      where: and(
        eq(emails.userId, userId),
        eq(emails.status, "failed")
      ),
      orderBy: [desc(emails.createdAt)],
      limit: 100,
    });

    res.json({ emails: failedEmails });
  } catch (error) {
    console.error("Error fetching failed emails:", error);
    res.status(500).json({ error: "Failed to fetch failed emails" });
  }
});

// Get all emails for current user
router.get("/", async (req, res) => {
  try {
    const user = req.user as AppUser;
    const userId = user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const allEmails = await db.query.emails.findMany({
      where: eq(emails.userId, userId),
      orderBy: [desc(emails.createdAt)],
      limit,
      offset,
    });

    res.json({
      emails: allEmails,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching emails:", error);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

// Get queue and rate limit stats
router.get("/stats", async (req, res) => {
  try {
    const [queueStats, rateLimitStats] = await Promise.all([
      getQueueStats(),
      getRateLimitStats(),
    ]);

    res.json({
      queue: queueStats,
      rateLimit: rateLimitStats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
