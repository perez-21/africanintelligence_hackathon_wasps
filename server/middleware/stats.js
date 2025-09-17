const statService = require('./../services/statService');
const XP_CONSTANTS = require('./../constants/xp');
const { ObjectId } = require('mongodb');

const updateLastActive = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const db = req.app.locals.db;

    await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { lastActive: new Date() } }
    );
  } catch (error) {
    console.error('Error updating lastActive:', error);
    // Optionally, you can send an error response or just call next()
  }
  next();
};

module.exports = { updateLastActive };
