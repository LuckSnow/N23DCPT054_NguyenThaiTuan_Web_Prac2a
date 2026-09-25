// src/config/redis.js
const Redis = require("ioredis");

let redis = null;
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT || 6379;
const redisUrl = process.env.REDIS_URL || `redis://${redisHost}:${redisPort}`;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => (times > 3 ? null : 1000),
    lazyConnect: true,
  });

  redis.connect()
    .then(() => console.log(" Connected to Redis Cache"))
    .catch((err) => {
      console.warn("⚠️ Redis connection warning:", err.message);
    });
} catch (error) {
  console.warn("⚠️ Could not init Redis client:", error.message);
  redis = null;
}

module.exports = redis;
