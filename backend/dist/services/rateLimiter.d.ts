/**
 * Get the current hour window key for rate limiting
 * Format: "ratelimit:YYYY-MM-DD:HH"
 */
export declare const getCurrentHourKey: () => string;
/**
 * Get the next hour window key
 */
export declare const getNextHourKey: () => {
    key: string;
    delayMs: number;
};
/**
 * Check if we can send an email (rate limit not exceeded)
 * Uses Redis INCR for atomic counter increment
 */
export declare const canSendEmail: () => Promise<{
    allowed: boolean;
    currentCount: number;
    limit: number;
}>;
/**
 * Increment the rate limit counter
 * Returns the new count
 */
export declare const incrementRateLimit: () => Promise<number>;
/**
 * Get delay until next available slot
 * Returns 0 if slot is available now, or ms until next hour window
 */
export declare const getDelayUntilAvailable: () => Promise<number>;
/**
 * Get rate limit stats
 */
export declare const getRateLimitStats: () => Promise<{
    currentHour: string;
    emailsSentThisHour: number;
    limit: number;
    remaining: number;
}>;
//# sourceMappingURL=rateLimiter.d.ts.map