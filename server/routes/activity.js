const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { vapid_private_key, clientID } = require("../configs/config");
const { v4: uuid } = require('uuid');
const { redis } = require('../shared/redis');
const {
  STREAM_ACTIVITY, toEntry,
  EVT_ACTIVITY_COMPLETED
} = require('../shared/events');


router.post('/activities', async (req, res) => {
  const { type, points = 0, metadata = {} } = req.body || {};
  const eventId = uuid();

  const payload = {
    eventId,
    type: EVT_ACTIVITY_COMPLETED,
    userId: req.user.userId,
    activityType: String(type || 'unknown'),
    points: String(points || 0),
    metadata: JSON.stringify(metadata || {}),
    ts: String(Date.now())
  };

  await redis.xadd(STREAM_ACTIVITY, '*', ...toEntry(payload));
  res.status(202).json({ accepted: true, eventId });
});

// Read leaderboard (top N)
router.get('/leaderboard', async (req, res) => {
  const limit = Number(req.query.limit || 10);
  const start = 0;
  const end = limit - 1;
  const entries = await redis.zrevrange('leaderboard:global', start, end, 'WITHSCORES');
  const out = [];
  for (let i = 0; i < entries.length; i += 2) {
    out.push({ userId: entries[i], score: Number(entries[i + 1]) });
  }
  res.json(out);
});

// Read user badges
router.get('/users/:id/badges', async (req, res) => {
  const badges = await redis.smembers(`user:${req.params.id}:badges`);
  res.json(badges);
});


module.exports = router;