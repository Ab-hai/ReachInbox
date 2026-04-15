import { Redis } from "ioredis";
export declare const redisConnection: Redis;
export declare const getRedisConfig: () => {
    host: string;
    port: number;
    maxRetriesPerRequest: null;
};
//# sourceMappingURL=redis.d.ts.map