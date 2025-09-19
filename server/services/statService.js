const { ObjectId } = require('mongodb');

/**
 * Updates the stats object for a user using a raw MongoDB connection.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @param {Object} statsUpdate - The stats fields to update (partial or full).
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */


async function updateUserStats(userId, db, statsUpdate) {
  if (!userId || !db || !statsUpdate || typeof statsUpdate !== 'object') {
    throw new Error('Invalid arguments');
  }

  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: { stats: statsUpdate } },
    { returnDocument: 'after' }
  );

  return result.value;
}

/**
 * Updates the totalXp field in a user's stats object.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @param {Number} xp - The new XP value to set.
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */
async function updateUserXp(userId, db, xp) {
  if (!userId || !db || typeof xp !== 'number') {
    throw new Error('Invalid arguments');
  }

  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { 'stats.totalXp': xp } },
    { returnDocument: 'after' }
  );

  return result.value;
}

/**
 * Updates the learningHours field in a user's stats object.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @param {Number} xp - The new XP value to set.
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */
async function updateLearningHours(userId, db, hours) {
  if (!userId || !db || typeof hours !== 'number') {
    throw new Error('Invalid arguments');
  }

  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { 'stats.totalLearningHours': hours } },
    { returnDocument: 'after' }
  );

  return result.value;
}

/**
 * Updates the coursesScompleted field in a user's stats object.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */
async function updateCoursesCompleted(userId, db) {
  if (!userId || !db ) {
    throw new Error('Invalid arguments');
  }


  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { 'stats.coursesCompleted': 1 } },
    { returnDocument: 'after' }
  );

  return result.value;
}

/**
 * Updates the perfectQuizzes field in a user's stats object.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */
async function updatePerfectQuizzes(userId, db) {
  if (!userId || !db ) {
    throw new Error('Invalid arguments');
  }


  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { 'stats.perfectQuizzes': 1 } },
    { returnDocument: 'after' }
  );

  return result.value;
}

/**
 * Updates the highScoreQuizzes field in a user's stats object.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */
async function updateHighscoreQuizzes(userId, db) {
  if (!userId || !db ) {
    throw new Error('Invalid arguments');
  }


  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { 'stats.highScoreQuizzes': 1 } },
    { returnDocument: 'after' }
  );

  return result.value;
}


/**
 * Updates the nightLessons field in a user's stats object.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */
async function updateNightLessons(userId, db) {
  if (!userId || !db ) {
    throw new Error('Invalid arguments');
  }


  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { 'stats.nightLessons': 1 } },
    { returnDocument: 'after' }
  );

  return result.value;
}

/**
 * Updates the morningLessons field in a user's stats object.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */
async function updateMorningLessons(userId, db) {
  if (!userId || !db ) {
    throw new Error('Invalid arguments');
  }


  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { 'stats.morningLessons': 1 } },
    { returnDocument: 'after' }
  );

  return result.value;
}

/**
 * Updates the weekendLessons field in a user's stats object.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */
async function updateWeekendLessons(userId, db) {
  if (!userId || !db ) {
    throw new Error('Invalid arguments');
  }


  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { 'stats.weekendLessons': 1 } },
    { returnDocument: 'after' }
  );

  return result.value;
}

/**
 * Updates the mobileLessons field in a user's stats object.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */
async function updateMobileLessons(userId, db) {
  if (!userId || !db ) {
    throw new Error('Invalid arguments');
  }


  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { 'stats.mobileLessons': 1 } },
    { returnDocument: 'after' }
  );

  return result.value;
}

/**
 * Updates the mobileLessons field in a user's stats object.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */
async function updateFastCompletion(userId, db) {
  if (!userId || !db ) {
    throw new Error('Invalid arguments');
  }


  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { 'stats.fastCourseCompletions': 1 } },
    { returnDocument: 'after' }
  );

  return result.value;
}

/**
 * Updates the isEarlyAdopter field in a user's stats object.
 * @param {String} userId - The user's MongoDB ObjectId as a string.
 * @param {Object} db - The MongoDB database instance.
 * @returns {Promise<Object|null>} The updated user document, or null if not found.
 */
async function updateEarlyAdopter(userId, db) {
  if (!userId || !db ) {
    throw new Error('Invalid arguments');
  }


  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: { 'stats.isEarlyAdopter': true } },
    { returnDocument: 'after' }
  );

  return result.value;
}



module.exports = {
  updateUserStats,
  updateUserXp,
  updateCoursesCompleted,
  updateHighscoreQuizzes,
  updatePerfectQuizzes,
  updateEarlyAdopter,
  updateMorningLessons,
  updateNightLessons,
  updateWeekendLessons,
  updateMobileLessons,
  updateFastCompletion,
  updateLearningHours,
};