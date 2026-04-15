import { Redis } from "ioredis";
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
export const redisConnection = new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null, // Required for BullMQ
});
redisConnection.on("connect", () => {
    console.log("✅ Connected to Redis");
});
redisConnection.on("error", (err) => {
    console.error("❌ Redis connection error:", err);
});
export const getRedisConfig = () => ({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null,
});
//# sourceMappingURL=redis.js.map