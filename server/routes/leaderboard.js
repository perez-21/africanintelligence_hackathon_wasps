const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

// Helper to update user ranks
async function updateUserRank(users, rankField, db) {
  // Use for...of loop to properly handle async operations
  for (let index = 0; index < users.length; index++) {
    const user = users[index];
    const newRank = index + 1; // Ranks should be 1-based
    
    console.log(user);
    // Check if rank needs updating
    if (user.stats && user.stats[rankField] !== newRank) {
      try {
        await db.collection('users').updateOne(
          { _id: new ObjectId(user._id) },
          { $set: { [`stats.${rankField}`]: newRank } } // Use computed property name
        );
      } catch (error) {
        console.error(`Failed to update rank for user ${user._id}:`, error);
      }
    }
  }
}

// General leaderboard
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const users = await db.collection('users')
      .find({role: 'student', 'stats.totalXp': { $gt: 0}})
      .project({ name: 1, _id: 1, profilePicture: 1, 'stats.totalXp': 1, 'stats.rank': 1 })
      .sort({ 'stats.totalXp': -1 })
      .toArray();
    
    await updateUserRank(users, 'rank', db);
    res.json(users);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Weekly leaderboard
router.get('/weekly', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const users = await db.collection('users')
      .find({role: 'student', 'stats.weeklyXp': { $gt: 0}})
      .project({ name: 1, _id: 1, profilePicture: 1, 'stats.weeklyXp': 1, 'stats.weeklyRank': 1 })
      .sort({ 'stats.weeklyXp': -1 })
      .toArray();
    
    await updateUserRank(users, 'weeklyRank', db);
    res.json(users);
  } catch (error) {
    console.error('Weekly leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly leaderboard' });
  }
});

// Monthly leaderboard
router.get('/monthly', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const users = await db.collection('users')
      .find({role: 'student', 'stats.monthlyXp': { $gt: 0}})
      .project({ name: 1, _id: 1, profilePicture: 1, 'stats.monthlyXp': 1, 'stats.monthlyRank': 1 })
      .sort({ 'stats.monthlyXp': -1 })
      .toArray();
    
    await updateUserRank(users, 'monthlyRank', db);
    res.json(users);
  } catch (error) {
    console.error('Monthly leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly leaderboard' });
  }
});

// Yearly leaderboard
router.get('/yearly', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const users = await db.collection('users')
      .find({role: 'student', 'stats.yearlyXp': { $gt: 0}})
      .project({ name: 1, _id: 1, profilePicture: 1, 'stats.yearlyXp': 1, 'stats.yearlyRank': 1 })
      .sort({ 'stats.yearlyXp': -1 })
      .toArray();
    
    await updateUserRank(users, 'yearlyRank', db);
    res.json(users);
  } catch (error) {
    console.error('Yearly leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch yearly leaderboard' });
  }
});

module.exports = router;