require('dotenv').config();
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);


async function ensureGroup(stream, group) {
  try {
    await redis.xgroup('CREATE', stream, group, '$', 'MKSTREAM');
  } catch (e) {
    // BUSYGROUP is fine (already exists)
    if (!String(e).includes('BUSYGROUP')) throw e;
  }
}

module.exports = { redis, ensureGroup };
