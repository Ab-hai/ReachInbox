import { Queue } from "bullmq";
import { getRedisConfig } from "../config/redis.js";
export const EMAIL_QUEUE_NAME = "email-queue";
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
    connection: getRedisConfig(),
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: {
            count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
            count: 500, // Keep last 500 failed jobs
        },
    },
});
export const scheduleEmail = async (data, delayMs, jobId) => {
    const job = await emailQueue.add("send-email", data, {
        delay: delayMs,
        jobId: jobId || `email-${data.emailId}`, // Idempotency key
    });
    return job;
};
// Get queue stats
export const getQueueStats = async () => {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        emailQueue.getWaitingCount(),
        emailQueue.getActiveCount(),
        emailQueue.getCompletedCount(),
        emailQueue.getFailedCount(),
        emailQueue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
};
//# sourceMappingURL=emailQueue.js.map