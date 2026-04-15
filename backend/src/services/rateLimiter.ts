import { redisConnection } from "../config/redis.js";

const MAX_EMAILS_PER_HOUR = parseInt(
  process.env.MAX_EMAILS_PER_HOUR || "200",
  10
);

/**
 * Get the current hour window key for rate limiting
 * Format: "ratelimit:YYYY-MM-DD:HH"
 */
export const getCurrentHourKey = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  return `ratelimit:${year}-${month}-${day}:${hour}`;
};

/**
 * Get the next hour window key
 */
export const getNextHourKey = (): { key: string; delayMs: number } => {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setUTCHours(nextHour.getUTCHours() + 1);
  nextHour.setUTCMinutes(0);
  nextHour.setUTCSeconds(0);
  nextHour.setUTCMilliseconds(0);

  const year = nextHour.getUTCFullYear();
  const month = String(nextHour.getUTCMonth() + 1).padStart(2, "0");
  const day = String(nextHour.getUTCDate()).padStart(2, "0");
  const hour = String(nextHour.getUTCHours()).padStart(2, "0");

  return {
    key: `ratelimit:${year}-${month}-${day}:${hour}`,
    delayMs: nextHour.getTime() - now.getTime(),
  };
};

/**
 * Check if we can send an email (rate limit not exceeded)
 * Uses Redis INCR for atomic counter increment
 */
export const canSendEmail = async (): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
}> => {
  const hourKey = getCurrentHourKey();
  
  // Get current count
  const currentCountStr = await redisConnection.get(hourKey);
  const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

  return {
    allowed: currentCount < MAX_EMAILS_PER_HOUR,
    currentCount,
    limit: MAX_EMAILS_PER_HOUR,
  };
};

/**
 * Increment the rate limit counter
 * Returns the new count
 */
export const incrementRateLimit = async (): Promise<number> => {
  const hourKey = getCurrentHourKey();
  
  // Atomic increment
  const newCount = await redisConnection.incr(hourKey);
  
  // Set expiry for 2 hours (cleanup old keys)
  if (newCount === 1) {
    await redisConnection.expire(hourKey, 7200);
  }

  return newCount;
};

/**
 * Get delay until next available slot
 * Returns 0 if slot is available now, or ms until next hour window
 */
export const getDelayUntilAvailable = async (): Promise<number> => {
  const { allowed } = await canSendEmail();
  
  if (allowed) {
    return 0;
  }

  const { delayMs } = getNextHourKey();
  return delayMs;
};

/**
 * Get rate limit stats
 */
export const getRateLimitStats = async () => {
  const hourKey = getCurrentHourKey();
  const countStr = await redisConnection.get(hourKey);
  const currentCount = countStr ? parseInt(countStr, 10) : 0;

  return {
    currentHour: hourKey,
    emailsSentThisHour: currentCount,
    limit: MAX_EMAILS_PER_HOUR,
    remaining: Math.max(0, MAX_EMAILS_PER_HOUR - currentCount),
  };
};
