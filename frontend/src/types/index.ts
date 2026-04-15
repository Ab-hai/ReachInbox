// User type
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

// Email type
export interface Email {
  id: string;
  userId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: 'scheduled' | 'processing' | 'sent' | 'failed';
  jobId: string | null;
  batchId: string;
  errorMessage: string | null;
  createdAt: string;
}

// API Response types
export interface AuthStatusResponse {
  authenticated: boolean;
  user: User | null;
}

export interface EmailsResponse {
  emails: Email[];
  page: number;
  limit: number;
}

export interface ScheduleEmailRequest {
  subject: string;
  body: string;
  recipients: string[];
  scheduledAt: string;
  delayBetweenEmails?: number;
  hourlyLimit?: number;
}

export interface ScheduleEmailResponse {
  message: string;
  batchId: string;
  emailCount: number;
  scheduledJobs: {
    emailId: string;
    jobId: string;
    scheduledAt: string;
  }[];
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface RateLimitStats {
  currentHour: string;
  emailsSentThisHour: number;
  limit: number;
  remaining: number;
}

export interface StatsResponse {
  queue: QueueStats;
  rateLimit: RateLimitStats;
}
