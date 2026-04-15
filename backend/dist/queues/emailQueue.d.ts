import { Queue } from "bullmq";
export interface EmailJobData {
    emailId: string;
    recipientEmail: string;
    subject: string;
    body: string;
    userId: string;
    batchId: string;
}
export declare const EMAIL_QUEUE_NAME = "email-queue";
export declare const emailQueue: Queue<EmailJobData, any, string, EmailJobData, any, string>;
export declare const scheduleEmail: (data: EmailJobData, delayMs: number, jobId?: string) => Promise<import("bullmq").Job<EmailJobData, any, string>>;
export declare const getQueueStats: () => Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}>;
//# sourceMappingURL=emailQueue.d.ts.map