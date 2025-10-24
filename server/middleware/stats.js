const statService = require("./../services/statService");
const XP_CONSTANTS = require("./../constants/xp");
const { ObjectId } = require("mongodb");

const updateLastActive = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const db = req.app.locals.db;

    await db
      .collection("users")
      .findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: { lastActive: new Date() } }
      );
  } catch (error) {
    console.error("Error updating lastActive:", error);
  }
  next();
};

const resetPeriodicXP = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const db = req.app.locals.db;
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    const now = new Date();

    // If XP was already reset today, skip
    if (user && user.lastXpReset) {
      const last = new Date(user.lastXpReset);
      if (
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate()
      ) {
        return next();
      }
    }

    let didResetXp = false;

    // Weekly reset on Sunday (getDay() === 0)
    if (now.getDay() === 0) {
      await db
        .collection("users")
        .updateOne({ _id: new ObjectId(userId) }, { $set: { weeklyXp: 0 } });
      didResetXp = true;
    }

    // Monthly reset on the 1st day of the month
    if (now.getDate() === 1) {
      await db
        .collection("users")
        .updateOne({ _id: new ObjectId(userId) }, { $set: { monthlyXp: 0 } });
      didResetXp = true;
    }

    if (didResetXp) {
      await db
        .collection("users")
        .updateOne({ _id: new ObjectId(userId) }, { $set: { lastXpReset: now } });
    }
  } catch (error) {
    console.error("Error resetting user xp:", error);
  }
  next();
};

module.exports = { updateLastActive, resetPeriodicXP };
