import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { getRedisConfig } from "../config/redis.js";
import { sendEmail } from "../config/email.js";
import { db, emails } from "../db/index.js";
import { EMAIL_QUEUE_NAME, emailQueue } from "./emailQueue.js";
import { canSendEmail, incrementRateLimit, getNextHourKey, } from "../services/rateLimiter.js";
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "5", 10);
const EMAIL_DELAY_MS = parseInt(process.env.EMAIL_DELAY_MS || "2000", 10);
let lastEmailSentAt = 0;
/**
 * Process a single email job
 */
const processEmailJob = async (job) => {
    const { emailId, recipientEmail, subject, body } = job.data;
    console.log(`📧 Processing email job: ${job.id} -> ${recipientEmail}`);
    // Check rate limit
    const { allowed, currentCount, limit } = await canSendEmail();
    if (!allowed) {
        // Reschedule to next hour
        const { delayMs } = getNextHourKey();
        console.log(`⏳ Rate limit reached (${currentCount}/${limit}). Rescheduling job ${job.id} to next hour (${delayMs}ms delay)`);
        // Create a new delayed job for the next hour
        await emailQueue.add("send-email", job.data, {
            delay: delayMs + Math.random() * 10000, // Add some jitter
            jobId: `reschedule-${emailId}-${Date.now()}`,
        });
        // Update status to scheduled (it's been rescheduled)
        await db
            .update(emails)
            .set({ status: "scheduled" })
            .where(eq(emails.id, emailId));
        return { rescheduled: true, nextAttemptIn: delayMs };
    }
    // Enforce minimum delay between emails
    const now = Date.now();
    const timeSinceLastEmail = now - lastEmailSentAt;
    if (timeSinceLastEmail < EMAIL_DELAY_MS) {
        const waitTime = EMAIL_DELAY_MS - timeSinceLastEmail;
        console.log(`⏱️ Waiting ${waitTime}ms before sending (min delay enforcement)`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    try {
        // Update status to processing
        await db
            .update(emails)
            .set({ status: "processing" })
            .where(eq(emails.id, emailId));
        // Send the email
        const result = await sendEmail(recipientEmail, subject, body);
        // Increment rate limit counter
        await incrementRateLimit();
        lastEmailSentAt = Date.now();
        // Update status to sent
        await db
            .update(emails)
            .set({
            status: "sent",
            sentAt: new Date(),
        })
            .where(eq(emails.id, emailId));
        console.log(`✅ Email sent successfully: ${recipientEmail} (Preview: ${result.previewUrl})`);
        return {
            success: true,
            messageId: result.messageId,
            previewUrl: result.previewUrl,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`❌ Failed to send email to ${recipientEmail}:`, errorMessage);
        // Update status to failed
        await db
            .update(emails)
            .set({
            status: "failed",
            errorMessage,
        })
            .where(eq(emails.id, emailId));
        throw error; // Re-throw for BullMQ retry mechanism
    }
};
/**
 * Create and start the email worker
 */
export const createEmailWorker = () => {
    const worker = new Worker(EMAIL_QUEUE_NAME, processEmailJob, {
        connection: getRedisConfig(),
        concurrency: WORKER_CONCURRENCY,
        limiter: {
            max: 1, // Process one job at a time per worker (respects delay)
            duration: EMAIL_DELAY_MS,
        },
    });
    worker.on("completed", (job) => {
        console.log(`✅ Job ${job.id} completed`);
    });
    worker.on("failed", (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
    });
    worker.on("error", (err) => {
        console.error("❌ Worker error:", err);
    });
    console.log(`🚀 Email worker started with concurrency: ${WORKER_CONCURRENCY}`);
    return worker;
};
export { processEmailJob };
//# sourceMappingURL=emailWorker.js.map