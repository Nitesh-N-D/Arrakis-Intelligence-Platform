import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

const buckets = new Map();

const createBucket = (windowMs, now) => ({
  count: 0,
  resetAt: now + windowMs
});

const getBucketKey = (req) => {
  return req.ip || req.socket?.remoteAddress || "anonymous";
};

const cleanupBuckets = () => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

setInterval(cleanupBuckets, Math.max(30_000, Math.round(env.rateLimitWindowMs / 2))).unref();

export const createRateLimitMiddleware = (
  options = {},
  { bucketStore = new Map(), clock = Date.now } = {}
) => {
  const windowMs = options.windowMs ?? env.rateLimitWindowMs;
  const max = options.max ?? env.rateLimitMax;

  return (req, res, next) => {
    const identity = options.byUser && req.user?.id ? `user:${req.user.id}` : getBucketKey(req);
    const key = `${options.namespace || "global"}:${identity}`;
    const now = clock();
    const existingBucket = bucketStore.get(key);
    const bucket =
      !existingBucket || existingBucket.resetAt <= now
        ? createBucket(windowMs, now)
        : existingBucket;

    bucket.count += 1;
    bucket.resetAt = bucket.resetAt || now + windowMs;
    bucketStore.set(key, bucket);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      return next(
        new ApiError(
          429,
          options.message || "Too many requests. Slow down and try again shortly."
        )
      );
    }

    return next();
  };
};

export const rateLimitMiddleware = (options = {}) =>
  createRateLimitMiddleware(options, { bucketStore: buckets });
