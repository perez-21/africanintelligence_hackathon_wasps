let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth');
let roleAuth = require('../middleware/roleAuth');
let { ObjectId } = require('mongodb');


router.get('/', auth, async (req, res) => {
  let db = req.app.locals.db;
  let learnerId = req.user.userId;

  try {
    const enrollments = await db.collection('enrollments').find({learner: learnerId}).toArray();
    
    if (!enrollments) {
      return res.status(404).json({message: 'Not found'});
    }

    return res.status(200).json(enrollments);
  }
  catch(error) {
    console.error('');
  }
});

module.exports = router;