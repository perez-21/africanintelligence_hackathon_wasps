let express = require('express');
let router = express.Router();
let auth = require('../middleware/auth');
let roleAuth = require('../middleware/roleAuth');
let { ObjectId } = require('mongodb');
let sendEnrollmentNotification = require('../utils/mailer');
let { sendEnrollmentNotification: sendPushNotification } = require('./notification');
let { clg, ocn, enrollmentProgress, parse } = require('./basics');
const studentServices = require("../services/studentServices");
const XP_CONSTANTS = require("../constants/xp");
const STAT_THRESHOLDS = require("../constants/threshold");
const statsService = require("../services/statService");
const statsMiddleware = require("./../middleware/stats");



/**
 * @swagger
 * tags:
 *   name: Learner
 *   description: Endpoints for learner course management
 */

/**
 * @swagger
 * /learner/courses:
 *   get:
 *     summary: Get all courses the student is enrolled in
 *     tags: [Learner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrolled courses with progress
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CourseWithProgress'
 */

/**
 * @swagger
 * /learner/courses/{courseId}:
 *   get:
 *     summary: Get a specific enrolled course with progress
 *     tags: [Learner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The course ID
 *     responses:
 *       200:
 *         description: Course details with enrollment progress
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourseWithProgress'
 *       404:
 *         description: Course not found
 *       403:
 *         description: Not enrolled in this course
 */

/**
 * @swagger
 * /learner/courses/{courseId}/status:
 *   get:
 *     summary: Check enrollment status for a course
 *     tags: [Learner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The course ID
 *     responses:
 *       200:
 *         description: Enrollment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isEnrolled:
 *                   type: boolean
 */

/**
 * @swagger
 * /learner/courses/{courseId}/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Learner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The course ID
 *     responses:
 *       201:
 *         description: Successfully enrolled in course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 enrollmentId:
 *                   type: string
 *       404:
 *         description: Course not found
 *       400:
 *         description: Already enrolled
 */

/**
 * @swagger
 * /learner/courses/{courseId}/modules/{moduleId}/quiz/submit:
 *   post:
 *     summary: Submit quiz for a module
 *     tags: [Learner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quizData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Quiz submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 progress:
 *                   type: number
 */

/**
 * @swagger
 * /learner/courses/{courseId}/modules/{moduleId}/contents/{contentId}/complete:
 *   post:
 *     summary: Mark content as completed
 *     tags: [Learner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content marked as completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 progress:
 *                   type: number
 */

/**
 * @swagger
 * /learner/courses/{courseId}/progress:
 *   put:
 *     summary: Update course progress
 *     tags: [Learner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moduleId:
 *                 type: string
 *               contentId:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 progress:
 *                   type: number
 *                 moduleProgress:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /learner/sync-enrollments:
 *   post:
 *     summary: Fix and sync enrollment data
 *     tags: [Learner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollment data synchronized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalEnrollments:
 *                       type: number
 *                     updatedStudents:
 *                       type: number
 *                     updatedFacilitators:
 *                       type: number
 *                     updatedCourses:
 *                       type: number
 */

/**
 * @swagger
 * /learner/stats:
 *   get:
 *     summary: Get learning stats for the user
 *     tags: [Learner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEnrolled:
 *                   type: number
 *                 certificatesEarned:
 *                   type: number
 *                 completedCourses:
 *                   type: number
 *                 learningStreak:
 *                   type: number
 *                 learningGoals:
 *                   type: object
 *                   properties:
 *                     completed:
 *                       type: number
 *                     total:
 *                       type: number
 *                 lastActive:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /learner/courses/{courseId}/watch-time:
 *   post:
 *     summary: Track video watch time for a course content
 *     tags: [Learner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moduleId:
 *                 type: string
 *               contentId:
 *                 type: string
 *               watchTime:
 *                 type: number
 *               duration:
 *                 type: number
 *     responses:
 *       200:
 *         description: Watch time recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 watchPercentage:
 *                   type: number
 *                 completed:
 *                   type: boolean
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CourseWithProgress:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         title:
 *           type: string
 *         facilitatorName:
 *           type: string
 *         progress:
 *           type: number
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *         lastAccessedAt:
 *           type: string
 *           format: date-time
 *         certificateIssued:
 *           type: boolean
 *         enrollment:
 *           type: object
 */



// Most specific routes first
// Track video watch time
router.post('/courses/:courseId/watch-time', auth, async (req, res) => {
  try {
    let db = req.app.locals.db;
    let courseId = req.params.courseId;
    let { moduleId, contentId, watchTime, duration } = req.body;
    
    if (!moduleId || !contentId || watchTime === undefined || duration === undefined) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Check if student is enrolled
    let enrollment = await db.collection('enrollments').findOne({
      course: courseId,
      learner: req.user.userId,
    });
    
    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }
    
    // Calculate watch percentage
    let watchPercentage = (watchTime / duration) * 100;
    
    // Update module progress with watch time
    let moduleProgress = enrollment.moduleProgress || [];
    let moduleIndex = moduleProgress.findIndex(m => m.moduleId === moduleId);
    
    if (moduleIndex === -1) {
      // Module not found, create new entry
      moduleProgress.push({
        moduleId,
        watchData: {
          [contentId]: {
            lastWatchTime: watchTime,
            duration,
            watchPercentage,
            completed: watchPercentage >= 90,
          },
        },
      });
    } else {
      // Module found, update watch data
      if (!moduleProgress[moduleIndex].watchData) {
        moduleProgress[moduleIndex].watchData = {};
      }
      
      moduleProgress[moduleIndex].watchData[contentId] = {
        lastWatchTime: watchTime,
        duration,
        watchPercentage,
        completed: watchPercentage >= 90,
      };
      
      // If watched 90% or more, automatically mark as completed in completedContent array
      if (watchPercentage >= 90) {
        if (!moduleProgress[moduleIndex].completedContent) {
          moduleProgress[moduleIndex].completedContent = [];
        }
        
        if (!moduleProgress[moduleIndex].completedContent.includes(contentId)) {
          moduleProgress[moduleIndex].completedContent.push(contentId);
        }
      }
    }
    
    // Update enrollment document
    await db.collection('enrollments').updateOne(
      { courseId: courseId, studentId: req.user.userId },
      { 
        $set: { 
          moduleProgress,
          lastAccessedAt: new Date(),
        },
      }
    );
    
    res.json({ 
      message: 'Watch time recorded successfully',
      watchPercentage,
      completed: watchPercentage >= 90,
    });
  } catch (error) {
    console.error('Error tracking video watch time:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit Content Completion Endpoint
router.post('/courses/:courseId/modules/:moduleId/contents/:contentId/complete', auth, statsMiddleware.updateLastActive, async (req, res) => {
  try {
    let db = req.app.locals.db;
    let { courseId, moduleId, contentId } = req.params;
    let studentId = req.user.userId;

    console.log('Complete content params:', { courseId, moduleId, contentId, studentId });

    // Find enrollment
    let enrollment = await db.collection('enrollments').findOne({
      course: courseId,
      learner: studentId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Find or create moduleProgress entry
    let moduleProgIndex = enrollment.moduleProgress.findIndex(mp => mp.moduleId === moduleId);
    if (moduleProgIndex === -1) {
      // Module not found, create a new entry
      enrollment.moduleProgress.push({
        moduleId: moduleId,
        contentProgress: [],
        completed: false,
        quizAttempt: {}
      });
      moduleProgIndex = enrollment.moduleProgress.length - 1;
    }

    let moduleProg = enrollment.moduleProgress[moduleProgIndex];

    // Find or create contentProgress entry
    let contentProgIndex = moduleProg.contentProgress.findIndex(cp => cp.contentId === contentId);
    if (contentProgIndex === -1) {
      // Content not found, create a new entry
      moduleProg.contentProgress.push({
        contentId: contentId,
        completed: false,
        lastAccessedAt: new Date()
      });
      contentProgIndex = moduleProg.contentProgress.length - 1;
    }

    // Mark content as completed
    moduleProg.contentProgress[contentProgIndex].completed = true;
    moduleProg.contentProgress[contentProgIndex].lastAccessedAt = new Date();

    // Check if module is now complete
    let allContentsCompleted = moduleProg.contentProgress.every(cp => cp.completed);
    let quizCompleted = moduleProg.quizAttempt && Object.keys(moduleProg.quizAttempt).length > 0;
    moduleProg.completed = allContentsCompleted && quizCompleted;

    // Calculate overall progress
    let totalModules = enrollment.moduleProgress.length;
    let completedModules = enrollment.moduleProgress.filter(mp => mp.completed).length;
    let progress = await enrollmentProgress(enrollment);

    // Update enrollment in DB
    await db.collection('enrollments').updateOne(
      { _id: enrollment._id },
      {
        $set: {
          moduleProgress: enrollment.moduleProgress,
          progress: progress
        }
      }
    );

    try {
      statsService.updateUserXp(req.user.userId, req.app.locals.db, XP_CONSTANTS.COURSE_COMPLETION);
      statsService.updateCoursesCompleted(req.user.userId, req.app.locals.db);
    }
    catch(error) {
      console.error('Problem updating user xp');
      console.error(error);
    }

    res.status(200).json({ message: 'Content marked as completed', progress });
  } catch (error) {
    console.error('Error marking content as completed:', error);
    res.status(500).json({ message: 'Server error' });
  }

});

// Submit Quiz Endpoint
router.post('/courses/:courseId/modules/:moduleId/quiz/submit', auth, statsMiddleware.updateLastActive, async (req, res) => {
  try {
    let db = req.app.locals.db;
    let { courseId, moduleId } = req.params;
    let quizData = req.body.quizData;
    let studentId = req.user.userId;
    const perfectQuiz = quizData.score === 100 ;
    const highScoreQuiz = quizData.score >= STAT_THRESHOLDS.HIGHSCORE_QUIZ;

    

    // Find enrollment
    let enrollment = await db.collection('enrollments').findOne({
      course: courseId,
      learner: studentId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Find moduleProgress
    let moduleProgIndex = enrollment.moduleProgress.findIndex(mp => mp.moduleId === moduleId);
    if (moduleProgIndex === -1) {
      return res.status(404).json({ message: 'Module not found in enrollment' });
    }

    let moduleProg = enrollment.moduleProgress[moduleProgIndex];

    // Update quizAttempt
    moduleProg.quizAttempt = quizData;

    // Check if module is now complete
    let allContentsCompleted = moduleProg.contentProgress.every(cp => cp.completed);
    let quizCompleted = moduleProg.quizAttempt && Object.keys(moduleProg.quizAttempt).length > 0;
    moduleProg.completed = allContentsCompleted && quizCompleted;

    // Calculate overall progress
    let totalModules = enrollment.moduleProgress.length;
    let completedModules = enrollment.moduleProgress.filter(mp => mp.completed).length;
    let progress = await enrollmentProgress(enrollment);

    // Update enrollment in DB
    await db.collection('enrollments').updateOne(
      { _id: enrollment._id },
      {
        $set: {
          'moduleProgress.$[elem].quizAttempt': quizData,
          'moduleProgress.$[elem].completed': moduleProg.completed,
          progress: progress
        }
      },
      {
        arrayFilters: [{ 'elem.moduleId': moduleId }]
      }
    );

    try {
      await statsService.updateUserXp(req.user.userId, req.app.locals.db, XP_CONSTANTS.SUBMIT_QUIZ);
      if (perfectQuiz) await statsService.updatePerfectQuizzes(req.user.userId, req.app.locals.db);
      if (highScoreQuiz) await statsService.updateHighscoreQuizzes(req.user.userId, req.app.locals.db);

    }
    catch(error) {
      console.error('Problem updating user stats');
      console.error(error);
    }

    res.status(200).json({ message: 'Quiz submitted successfully', progress });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Server error' });
  }

});

// Enroll in a course
router.post('/courses/:courseId/enroll', auth, statsMiddleware.updateLastActive, async (req, res) => {
  try {
    let db = req.app.locals.db;
    let courseId = req.params.courseId;
    clg('enrollment courseId',courseId)
    // Check if course exists and is published
    let course = await db.collection('courses').findOne({ 
      key: courseId,
      status: 'published'
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or not available for enrollment' });
    }
    
    // Check if already enrolled
    let existingEnrollment = await db.collection('enrollments').findOne({
      courseId: courseId,
      studentId: req.user.userId
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }
    
    // Get student details
    let student = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
    clg('students --' , req.user.userId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Create enrollment document
    let enrollmentData = {
      courseId: courseId,
      studentId: req.user.userId,
      enrolledAt: new Date(),
      progress: 0,
      moduleProgress: course.modules ? course.modules.map(module => ({
        moduleId: module.title,
        completed: false,
        contentProgress: module.content ? module.content.map(content => ({
          contentId: content.title,
          completed: false,
          lastAccessedAt: null
        })) : [],
        quizAttempt: {}
      })) : [],
      lastAccessedAt: new Date()
    };
    
    // Insert enrollment record
    let enrollmentResult = await db.collection('enrollments').insertOne(enrollmentData);
    
    // Update student's enrolled courses
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $addToSet: { enrolledCourses: courseId } }
    );
    
    // Update course enrolled count and add student to course's enrolled students
    await db.collection('courses').updateOne(
      { key: courseId },
      { 
        $inc: { enrolled: 1 },
        $addToSet: { enrolledStudents: req.user.userId }
      }
    );
    
    // Update facilitator's students list
    if (course.facilitator) {
      await db.collection('users').updateOne(
        { _id: course.facilitator },
        { 
          $addToSet: { 
            studentsEnrolled: {
              studentId: req.user.userId,
              courseId: courseId,
              enrollmentId: enrollmentResult.insertedId.toString(),
              enrolledAt: new Date(),
              progress: 0,
              lastAccessedAt: new Date()
            } 
          }
        }
      );
      
      // Get facilitator details for email notification
      let facilitator = await db.collection('users').findOne({ _id: new ObjectId(course.facilitator) });
      
      // Send email to facilitator if we have their email
      if (facilitator && facilitator.email) {
        try {
          await sendEnrollmentNotification(
            facilitator,
            student,
            course
          );
        } catch (emailError) {
          console.error('Failed to send enrollment email notification:', emailError);
        }
      }
      
      // Create notification for facilitator
      try {
        await sendPushNotification(
          db,
          courseId,
          req.user.userId,
          course.facilitator
        );
      } catch (notificationError) {
        console.error('Failed to create facilitator notification:', notificationError);
      }
    }
    
    res.status(201).json({ 
      message: 'Successfully enrolled in course',
      enrollmentId: enrollmentResult.insertedId
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check enrollment status for a course
router.get('/courses/:courseId/status', auth, roleAuth(['student']),async (req, res) => {
  try {
    let db = req.app.locals.db;
    let courseId = req.params.courseId;
    
    if (!courseId || courseId === 'undefined' || courseId === 'null') {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    let enrollment = await db.collection('enrollments').findOne({
      courseId: courseId,
      studentId: req.user.userId
    });
    
    res.json({
      isEnrolled: !!enrollment
    });
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific enrolled course with progress
router.get('/courses/:courseId', auth, roleAuth(['student']), async (req, res) => {
  try {
    let db = req.app.locals.db;
    let courseId = req.params.courseId;
    
    // Check if course exists and is published
    let course = await db.collection('courses').findOne({ 
      key: courseId,
      status:'published'
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if(!course.enrolledStudents)course.enrolledStudents=[];
    // Check if student is enrolled
    let enrollment = await db.collection('enrollments').findOne({
      course: courseId,
      student: req.user.userId
    });
    
    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }
    
    // Get facilitator info
    let facilitator = await db.collection('users').findOne(
      { _id: new ObjectId(course.facilitator) },
      { projection: { name: 1, profilePicture: 1, title: 1, bio: 1 } }
    );
    
    // Return course with enrollment details
    res.json({
      ...course,
      progress: enrollment.progress || 0,
      moduleProgress: enrollment.moduleProgress || [],
      enrolledAt: enrollment.enrolledAt,
      lastAccessedAt: enrollment.lastAccessedAt,
      facilitatorInfo: facilitator || null
    });
  } catch (error) {
    console.error('Error fetching enrolled course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get enrollment data for a course
router.get('/courses/:courseId/enrollment', auth, roleAuth(['student']), async (req, res) => {
  try {
    const courseKey = req.params.courseId;
    const learnerId = req.user.userId;
    let db = req.app.locals.db;

    console.log(`stuff: ${courseKey}, ${learnerId}`)
    let enrollment = await db.collection('enrollments').findOne({ 
      learner: new ObjectId(learnerId),
      course: courseKey
    });

    if (!enrollment) {
      return res.status(404).json({message: "Enrollment not found"})
    }

    res.status(200).json(enrollment);
  }
  catch(error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course progress
router.put('/courses/:courseId/progress', auth, async (req, res) => {
  try {
    let db = req.app.locals.db;
    let courseId = req.params.courseId;
    let { moduleId, contentId, completed } = req.body;
    
    if (!moduleId || !contentId) {
      return res.status(400).json({ message: 'Module ID and content ID are required' });
    }
    
    console.log('Update progress params:', { courseId, moduleId, contentId, completed });
    
    let courseObjectId = courseId;
    
    // Check if student is enrolled
    let enrollment = await db.collection('enrollments').findOne({
      courseId: courseObjectId,
      studentId: req.user.userId
    });
    
    if (!enrollment) {
      console.log('Enrollment not found for user:', req.user.userId, 'course:', courseId);
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }
    
    // Update module progress
    let moduleProgress = enrollment.moduleProgress || [];
    let moduleIndex = moduleProgress.findIndex(m => m.moduleId === moduleId);
    
    if (moduleIndex === -1) {
      moduleProgress.push({
        moduleId,
        completedContent: completed ? [contentId] : [],
        completedAt: completed ? new Date() : null
      });
    } else {
      if (completed) {
        if (!moduleProgress[moduleIndex].completedContent) {
          moduleProgress[moduleIndex].completedContent = [];
        }
        if (!moduleProgress[moduleIndex].completedContent.includes(contentId)) {
          moduleProgress[moduleIndex].completedContent.push(contentId);
        }
      } else {
        if (moduleProgress[moduleIndex].completedContent) {
          moduleProgress[moduleIndex].completedContent = moduleProgress[moduleIndex].completedContent.filter(
            id => id !== contentId
          );
        }
      }
    }
    
    // Get course to calculate overall progress
    let course = await db.collection('courses').findOne({ key: courseObjectId });
    
    // Calculate overall progress
    let totalContentItems = 0;
    let completedContentItems = 0;
    
    if (course && course.modules) {
      course.modules.forEach(module => {
        if (module.content) {
          totalContentItems += module.content.length;
          
          let moduleProgressItem = moduleProgress.find(m => m.moduleId === module.title);
          if (moduleProgressItem && moduleProgressItem.completedContent) {
            completedContentItems += moduleProgressItem.completedContent.length;
          }
        }
      });
    }
    
    let overallProgress = totalContentItems > 0 
      ? Math.round((completedContentItems / totalContentItems) * 100) 
      : 0;
    
    // Update enrollment document
    await db.collection('enrollments').updateOne(
      { courseId: courseObjectId, studentId: req.user.userId },
      { 
        $set: { 
          moduleProgress,
          progress: overallProgress,
          lastAccessedAt: new Date()
        } 
      }
    );
    
    // Update progress in facilitator's students list
    if (course && course.facilitator) {
      await db.collection('users').updateOne(
        { 
          _id: new ObjectId(course.facilitator),
          "studentsEnrolled.studentId": req.user.userId,
          "studentsEnrolled.courseId": courseId
        },
        {
          $set: {
            "studentsEnrolled.$.progress": overallProgress,
            "studentsEnrolled.$.lastAccessedAt": new Date()
          }
        }
      );
    }
    
    // Track learning streak
    try {
      // Get user's learning streak data
      let streakData = await db.collection('learning_streaks').findOne({
        userId: req.user.userId
      });
      
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!streakData) {
        // First time user is learning, create streak
        await db.collection('learning_streaks').insertOne({
          userId: req.user.userId,
          currentStreak: 1,
          lastActiveDate: today,
          history: [{ date: today, courses: [courseId] }]
        });
      } else {
        let lastDate = new Date(streakData.lastActiveDate);
        lastDate.setHours(0, 0, 0, 0);
        
        let yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let newStreak = streakData.currentStreak;
        
        // If last active was today, just update courses
        if (lastDate.getTime() === today.getTime()) {
          // Already active today, just update courses if needed
          let todayRecord = streakData.history.find(
            h => new Date(h.date).toDateString() === today.toDateString()
          );
          
          if (todayRecord && !todayRecord.courses.includes(courseId)) {
            await db.collection('learning_streaks').updateOne(
              { 
                userId: req.user.userId,
                "history.date": { $eq: today }
              },
              { 
                $addToSet: { "history.$.courses": courseId }
              }
            );
          }
        } 
        // If last active was yesterday, increment streak
        else if (lastDate.getTime() === yesterday.getTime()) {
          newStreak += 1;
          
          await db.collection('learning_streaks').updateOne(
            { userId: req.user.userId },
            { 
              $set: { 
                currentStreak: newStreak,
                lastActiveDate: today
              },
              $push: { 
                history: { 
                  date: today, 
                  courses: [courseId] 
                } 
              }
            }
          );
        } 
        // If more than a day gap, reset streak
        else if (lastDate < yesterday) {
          newStreak = 1;
          
          await db.collection('learning_streaks').updateOne(
            { userId: req.user.userId },
            { 
              $set: { 
                currentStreak: newStreak,
                lastActiveDate: today
              },
              $push: { 
                history: { 
                  date: today, 
                  courses: [courseId] 
                } 
              }
            }
          );
        }
      }
    } catch (streakError) {
      console.error('Error updating learning streak:', streakError);
    }
    
    res.json({ 
      message: 'Progress updated successfully',
      progress: overallProgress,
      moduleProgress
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Less specific routes
// Get all enrolled courses
router.get('/courses', auth, roleAuth(['student']),  async (req, res) => {
  try {
      const db = req.app.locals.db;
      const userId = req.user.userId;
      const courses = await studentServices.getEnrolledCourses(db, userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      res.status(500).json({ message: "Server error" });
    }
});

// Fix and sync enrollment data
router.post('/sync-enrollments', auth, async (req, res) => {
  try {
    let db = req.app.locals.db;
    
    
    // Get all enrollments
    let enrollments = await db.collection('enrollments').find({}).toArray();
    
    if (enrollments.length === 0) {
      return res.json({ message: 'No enrollments to sync' });
    }
    
    let updatedStudents = 0;
    let updatedFacilitators = 0;
    let updatedCourses = 0;
    
    // Process each enrollment
    for (let enrollment of enrollments) {
      if (!enrollment.courseId || !enrollment.studentId) continue;
      
      try {
        let courseObjectId = enrollment.courseId;
        let studentObjectId = enrollment.studentId;
        let enProgress=await enrollmentProgress(enrollment);
        if(parse(enProgress)!=parse(enrollment.progress)){
          enrollment.progress=enProgress;
          await db.collection('enrollments').updateOne(
            { _id: enrollment._id },
            {
              $set: {
                progress: enProgress
              }
            }
          );
        }
        // Update student's enrolled courses
        let studentUpdate = await db.collection('users').updateOne(
          { _id: studentObjectId },
          { $addToSet: { enrolledCourses: courseObjectId } }
        );
        
        if (studentUpdate.modifiedCount > 0) {
          updatedStudents++;
        }
        
        // Get the course to update course and facilitator
        let course = await db.collection('courses').findOne({ key: courseObjectId });
        
        if (course) {
          // Update course's enrolled students count
          let enrollmentCount = await db.collection('enrollments').countDocuments({ 
            courseId: courseObjectId 
          });
          
          let courseUpdate = await db.collection('courses').updateOne(
            { _id: courseObjectId },
            { 
              $addToSet: { enrolledStudents: enrollment.studentId },
              $set: { enrolled: enrollmentCount }
            }
          );
          
          if (courseUpdate.modifiedCount > 0) {
            updatedCourses++;
          }
          
          // Update facilitator's students list
          if (course.facilitator) {
            let facilitatorObjectId = typeof course.facilitator === 'string' 
              ? new ObjectId(course.facilitator) 
              : course.facilitator;
              
            let facilitatorUpdate = await db.collection('users').updateOne(
              { _id: facilitatorObjectId },
              { 
                $addToSet: { 
                  studentsEnrolled: {
                    studentId: enrollment.studentId,
                    courseId: enrollment.courseId.toString(),
                    enrollmentId: enrollment._id.toString(),
                    enrolledAt: enrollment.enrolledAt || new Date(),
                    progress: enrollment.progress || 0,
                    lastAccessedAt: enrollment.lastAccessedAt || new Date()
                  } 
                }
              }
            );
            
            if (facilitatorUpdate.modifiedCount > 0) {
              updatedFacilitators++;
            }
          }
        }
      } catch (innerError) {
        console.error(`Error processing enrollment ${enrollment._id}:`, innerError);
        continue;
      }
    }
    
    res.json({
      message: 'Enrollment data synchronized successfully',
      stats: {
        totalEnrollments: enrollments.length,
        updatedStudents,
        updatedFacilitators,
        updatedCourses
      }
    });
  } catch (error) {
    console.error('Error syncing enrollment data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get learning stats
router.get('/stats', auth, async (req, res) => {
  try {
    let db = req.app.locals.db;
    
    // Get enrollment data
    let enrollments = await db.collection('enrollments').find({
      studentId: req.user.userId
    }).toArray();
    
    // Get streak data
    let streakData = await db.collection('learning_streaks').findOne({
      userId: req.user.userId
    });
    
    // Get learning goals 
    let goalsData = await db.collection('learning_goals').find({
      userId: req.user.userId
    }).toArray();
    
    let completedGoals = goalsData.filter(g => g.completed).length;
    
    res.json({
      totalEnrolled: enrollments.length,
      certificatesEarned: enrollments.filter(e => e.certificateIssued).length,
      completedCourses: enrollments.filter(e => e.progress === 100).length,
      learningStreak: streakData?.currentStreak || 0,
      learningGoals: {
        completed: completedGoals,
        total: goalsData.length || 4
      },
      lastActive: streakData?.lastActiveDate || null
    });
  } catch (error) {
    console.error('Error fetching learning stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
