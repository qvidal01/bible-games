import { z } from 'zod';

// Shared environment validation helpers for server and client config
const realtimeClientSchema = z.object({
  NEXT_PUBLIC_PUSHER_KEY: z.string().min(1, 'NEXT_PUBLIC_PUSHER_KEY is required'),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().min(1, 'NEXT_PUBLIC_PUSHER_CLUSTER is required'),
});

const realtimeServerSchema = realtimeClientSchema.extend({
  PUSHER_APP_ID: z.string().min(1, 'PUSHER_APP_ID is required'),
  PUSHER_SECRET: z.string().min(1, 'PUSHER_SECRET is required'),
});

const redisSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
});

type RealtimeClientConfig = z.infer<typeof realtimeClientSchema>;
type RealtimeServerConfig = z.infer<typeof realtimeServerSchema>;
type RedisConfig = z.infer<typeof redisSchema>;

interface ParsedRealtimeConfig {
  client: RealtimeClientConfig | null;
  server: RealtimeServerConfig | null;
  missingForClient: string[];
  missingForServer: string[];
}

interface ParsedRedisConfig {
  config: RedisConfig | null;
  missing: string[];
}

let cachedRealtime: ParsedRealtimeConfig | null = null;
let cachedRedis: ParsedRedisConfig | null = null;

export function getRealtimeConfig(): ParsedRealtimeConfig {
  if (cachedRealtime) return cachedRealtime;

  const clientResult = realtimeClientSchema.safeParse(process.env);
  const serverResult = realtimeServerSchema.safeParse(process.env);

  cachedRealtime = {
    client: clientResult.success ? clientResult.data : null,
    server: serverResult.success ? serverResult.data : null,
    missingForClient: clientResult.success
      ? []
      : clientResult.error.issues.map((issue) => issue.path.join('.') || issue.message),
    missingForServer: serverResult.success
      ? []
      : serverResult.error.issues.map((issue) => issue.path.join('.') || issue.message),
  };

  return cachedRealtime;
}

export function isRealtimeClientConfigured(): boolean {
  const parsed = getRealtimeConfig();
  return !!parsed.client;
}

export function isRealtimeServerConfigured(): boolean {
  const parsed = getRealtimeConfig();
  return !!parsed.server;
}

export function getRedisConfig(): ParsedRedisConfig {
  if (cachedRedis) return cachedRedis;

  const redisResult = redisSchema.safeParse(process.env);
  cachedRedis = {
    config: redisResult.success ? redisResult.data : null,
    missing: redisResult.success
      ? []
      : redisResult.error.issues.map((issue) => issue.path.join('.') || issue.message),
  };

  return cachedRedis;
}
