import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { RateLimitBucketRepository } from "../repositories/RateLimitBucketRepository.js";

const createBucket = (windowMs, now) => ({
  count: 0,
  resetAt: now + windowMs
});

const getBucketKey = (req) => {
  return req.ip || req.socket?.remoteAddress || "anonymous";
};

export const createRateLimitMiddleware = (
  options = {},
  { bucketStore, durableStore, clock = Date.now } = {}
) => {
  const windowMs = options.windowMs ?? env.rateLimitWindowMs;
  const max = options.max ?? env.rateLimitMax;
  const localStore = bucketStore || new Map();

  const applyLimit = (bucket, res, next) => {
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

  return (req, res, next) => {
    if (typeof options.skip === "function" && options.skip(req)) return next();

    const identity = options.byUser && req.user?.id ? `user:${req.user.id}` : getBucketKey(req);
    const key = `${options.namespace || "global"}:${identity}`;
    const now = clock();
    if (durableStore) {
      void durableStore.consume(key, { windowMs, now })
        .then((bucket) => applyLimit(bucket, res, next))
        .catch(() => next(new ApiError(503, "Rate limiting is temporarily unavailable. Try again shortly.")));
      return;
    }

    const existingBucket = localStore.get(key);
    const bucket = !existingBucket || existingBucket.resetAt <= now
      ? createBucket(windowMs, now)
      : existingBucket;
    bucket.count += 1;
    localStore.set(key, bucket);
    return applyLimit(bucket, res, next);
  };
};

const durableStore = new RateLimitBucketRepository();

export const rateLimitMiddleware = (options = {}) =>
  createRateLimitMiddleware(options, { durableStore });
