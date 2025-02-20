import Redis from "ioredis";
import dotenv from "dotenv"

dotenv.config();

const client = new Redis(process.env.UPSTASH_REDIS_URL);

//redis is a key-value store

await client.set('foo', 'bar');
export const redis = new Redis(process.env.UPSTASH_REDIS_URL);