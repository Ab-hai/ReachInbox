import * as schema from "./schema.js";
export declare const db: import("drizzle-orm/neon-http").NeonHttpDatabase<typeof schema> & {
    $client: import("@neondatabase/serverless").NeonQueryFunction<false, false>;
};
export * from "./schema.js";
//# sourceMappingURL=index.d.ts.map