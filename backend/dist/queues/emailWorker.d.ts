import { Worker, Job } from "bullmq";
import { EmailJobData } from "./emailQueue.js";
/**
 * Process a single email job
 */
declare const processEmailJob: (job: Job<EmailJobData>) => Promise<{
    rescheduled: boolean;
    nextAttemptIn: number;
    success?: undefined;
    messageId?: undefined;
    previewUrl?: undefined;
} | {
    success: boolean;
    messageId: any;
    previewUrl: string | false;
    rescheduled?: undefined;
    nextAttemptIn?: undefined;
}>;
/**
 * Create and start the email worker
 */
export declare const createEmailWorker: () => Worker<EmailJobData, any, string>;
export { processEmailJob };
//# sourceMappingURL=emailWorker.d.ts.map