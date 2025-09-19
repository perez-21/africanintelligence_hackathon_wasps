const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
const { OAuth2Client } = require("google-auth-library");
const router = express.Router();
const auth = require("../middleware/auth");
const { sendWelcomeEmail } = require("../utils/mailer");
const { vapid_private_key, clientID } = require("../configs/config");
const { clg } = require("./basics");
const { body, validationResult } = require("express-validator");
const SPECIAL_CONSTANTS = require("./../constants/special");
const statsService = require("./../services/statService");
const { BADFLAGS } = require("dns");

const googleClient = new OAuth2Client(clientID);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the user
 *           example: "60c72b1f9b1e8b001c8e4d3a"
 *         name:
 *           type: string
 *           description: The user's name
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           description: The user's email
 *           example: "jane.doe@example.com"
 *         role:
 *           type: string
 *           description: The user's role (e.g., student, instructor, admin)
 *           example: "student"
 *         profilePicture:
 *           type: string
 *           description: URL of the user's profile picture
 *           example: "https://example.com/profile.jpg"
 *         bio:
 *           type: string
 *           description: User's biography
 *           example: "Experienced software developer"
 *         phone:
 *           type: string
 *           description: User's phone number
 *           example: "+234 000 000 0000"
 *         occupation:
 *           type: string
 *           description: User's occupation
 *           example: "Software Engineer"
 *         address:
 *           type: string
 *           description: User's address
 *           example: "Lagos, Nigeria"
 *         specialization:
 *           type: string
 *           description: User's area of specialization
 *           example: "Web Development"
 *         experience:
 *           type: number
 *           description: Years of experience
 *           example: 5
 *         certifications:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "AWS Certified Developer"
 *               verified:
 *                 type: boolean
 *                 example: true
 *         education:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               degree:
 *                 type: string
 *                 example: "Bachelor of Science"
 *               institution:
 *                 type: string
 *                 example: "University of Lagos"
 *               years:
 *                 type: string
 *                 example: "2015-2019"
 *     UserRegistrationInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: The user's full name
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *           example: "jane.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: The user's password
 *           example: "securePassword123"
 *         role:
 *           type: string
 *           enum: [student, instructor, admin]
 *           description: The user's role
 *           example: "student"
 *     UserLoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *           example: "jane.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: The user's password
 *           example: "securePassword123"
 *         role:
 *           type: string
 *           enum: [student, instructor, admin]
 *           description: Optional role verification
 *           example: "student"
 *     UserAuthData:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The user's ID
 *           example: "60c72b1f9b1e8b001c8e4d3a"
 *         name:
 *           type: string
 *           description: The user's name
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           description: The user's email
 *           example: "jane.doe@example.com"
 *         role:
 *           type: string
 *           description: The user's role
 *           example: "student"
 *     UserProfile:
 *       allOf:
 *         - $ref: '#/components/schemas/User'
 *         - type: object
 *           properties:
 *             enrolledCourses:
 *               type: array
 *               items:
 *                 type: string
 *               description: Array of enrolled course IDs
 *               example: ["60c72b1f9b1e8b001c8e4d3a"]
 *             createdCourses:
 *               type: array
 *               items:
 *                 type: string
 *               description: Array of created course IDs
 *               example: ["60c72b1f9b1e8b001c8e4d3a"]
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: Account creation timestamp
 *               example: "2024-03-20T10:00:00Z"
 *             authProvider:
 *               type: string
 *               description: Authentication provider
 *               example: "local"
 *     UserUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The user's full name
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *           example: "jane.doe@example.com"
 *         phone:
 *           type: string
 *           description: The user's phone number
 *           example: "+234 000 000 0000"
 *         bio:
 *           type: string
 *           description: User's biography
 *           example: "Experienced software developer"
 *         occupation:
 *           type: string
 *           description: User's occupation
 *           example: "Software Engineer"
 *         address:
 *           type: string
 *           description: User's address
 *           example: "Lagos, Nigeria"
 *         specialization:
 *           type: string
 *           description: User's area of specialization
 *           example: "Web Development"
 *         experience:
 *           type: number
 *           description: Years of experience
 *           example: 5
 *         profilePicture:
 *           type: string
 *           format: uri
 *           description: URL of the user's profile picture
 *           example: "https://example.com/profile.jpg"
 *         certifications:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "AWS Certified Developer"
 *               verified:
 *                 type: boolean
 *                 example: true
 *         education:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               degree:
 *                 type: string
 *                 example: "Bachelor of Science"
 *               institution:
 *                 type: string
 *                 example: "University of Lagos"
 *               years:
 *                 type: string
 *                 example: "2015-2019"
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management API
 */

/**
 * @swagger
 * /auth:
 *   get:
 *     summary: Retrieve a list of all users
 *     tags: [Auth]
 *     description: Fetches a list of all registered users in the database.
 *     responses:
 *       200:
 *         description: A successful response with an array of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */

router.get("/", async (req, res) => {
  try {

    const db = req.app.locals.db;
    const users = await db.collection("users").find().toArray();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     description: Creates a new user account with provided name, email, password, and optional role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistrationInput'
 *     responses:
 *       201:
 *         description: User successfully registered and logged in.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserAuthData'
 *                 token:
 *                   type: string
 *                   description: JWT authentication token.
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Bad request, e.g., user already exists with this email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already exists with this email
 *       500:
 *         description: Internal server error during registration.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error during registration
 */

router.post("/register", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: role || "student",
      profilePicture: "",
      bio: "",
      enrolledCourses: [],
      createdCourses: [],
      createdAt: new Date(),
    };

    // Insert user into database
    const result = await db.collection("users").insertOne(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertedId.toString(), role: newUser.role },
      vapid_private_key,
      { expiresIn: "7d" }
    );

    // Return user data and token (without password)
    const userData = {
      id: result.insertedId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };

    // update stats
    if (userData.role === 'student')
    await statsService.updateEarlyAdopter(result.insertedId.toString(), db );

    // Get popular courses for welcome email
    const popularCourses = await db
      .collection("courses")
      .find({ status: "published" })
      .sort({ enrollmentCount: -1 })
      .limit(3)
      .toArray();

    // Send welcome email asynchronously
    sendWelcomeEmail(userData, popularCourses).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });

    res.status(201).json({ user: userData, token });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     description: Authenticates a user with email and password, returning a JWT token upon success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginInput'
 *     responses:
 *       200:
 *         description: User successfully logged in.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserAuthData'
 *                 token:
 *                   type: string
 *                   description: JWT authentication token.
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       404:
 *         description: User not found with the provided email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       403:
 *         description: Forbidden, e.g., invalid role for existing user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials or role
 *       400:
 *         description: Bad request, e.g., invalid credentials (incorrect password).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *       500:
 *         description: Internal server error during login.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error during login
 */
router.post("/login", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { email, password, role } = req.body;

    // Find user by email
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify role if provided
    if (role && user.role !== role) {
      return res.status(403).json({ message: "Invalid credentials or role" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      vapid_private_key,
      { expiresIn: "7d" }
    );

    // Return user data and token (without password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({ user: userData, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google OAuth login/signup
 *     tags: [Auth]
 *     description: Authenticates or registers a user using a Google ID token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: The Google ID token received from the client.
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjY3ZTYxN2I0YWI1NDUyMWQ2MjQ2MGIzNzAwNzM1YjVjYjI0Y2U4YjQifQ..."
 *               role:
 *                 type: string
 *                 enum: [student, instructor, admin]
 *                 description: Optional role to assign to the user if they are registering for the first time.
 *                 example: "student"
 *     responses:
 *       200:
 *         description: User successfully authenticated or registered.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserAuthData'
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT authentication token.
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Bad request, e.g., missing Google token or invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Google token is required
 *       403:
 *         description: Forbidden, e.g., invalid role for an existing user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid role for existing user
 *       500:
 *         description: Internal server error during Google authentication.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error during Google authentication
 */

// Google OAuth login/signup
router.post("/google", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { token, role } = req.body;
    clg("google body -- ", { role });

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: clientID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || "User";

    if (!email) {
      return res
        .status(400)
        .json({ message: "Invalid Google token: Email not found" });
    }

    // Check if user exists
    let user = await db.collection("users").findOne({ email });

    if (user) {
      // User exists - verify role and log them in
      if (role && user.role !== role) {
        return res
          .status(403)
          .json({ message: "Invalid role for existing user" });
      }
    } else {
      // User doesn't exist - register them
      const newUser = {
        name,
        email,
        password: "", // No password for Google users
        role: role || "student",
        profilePicture: payload.picture || "",
        bio: "",
        enrolledCourses: [],
        createdCourses: [],
        createdAt: new Date(),
        authProvider: "google", // Indicate the user signed up via Google
      };

      const result = await db.collection("users").insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };

      // Get popular courses for welcome email
      const popularCourses = await db
        .collection("courses")
        .find({ status: "published" })
        .sort({ enrollmentCount: -1 })
        .limit(3)
        .toArray();

      // Send welcome email asynchronously
      sendWelcomeEmail(
        { id: user._id, name: user.name, email: user.email, role: user.role },
        popularCourses
      ).catch((error) => {
        console.error("Failed to send welcome email:", error);
      });
    }

    // Generate JWT token
    const jwtToken = await jwt.sign(
      { userId: user._id.toString(), role: user.role },
      vapid_private_key,
      { expiresIn: "7d" }
    );

    // Return user data and token (without password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    };
    clg("user data -- ", userData);
    res.status(200).json({ user: userData, success: true, token: jwtToken });
  } catch (error) {
    console.error("Google Auth error:", error);
    res
      .status(500)
      .json({ message: "Server error during Google authentication" });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user's profile
 *     tags: [Auth]
 *     description: Retrieves the profile information of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A successful response with the authenticated user's details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized - no token provided or invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: User not found (should ideally not happen if token is valid).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error fetching user data
 */

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = new ObjectId(req.user.userId);

    // Get user from database (excluding password)
    const user = await db
      .collection("users")
      .findOne({ _id: userId }, { projection: { password: 0 } });

    // Normalize dates to start of day
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const lastActiveMidnight = user.lastActive
      ? new Date(user.lastActive)
      : null;
    if (lastActiveMidnight) {
      lastActiveMidnight.setHours(0, 0, 0, 0);
    }

    // Only process if user hasn't been active today
    if (
      !lastActiveMidnight ||
      todayMidnight.getTime() > lastActiveMidnight.getTime()
    ) {
      if (!lastActiveMidnight) {
        // First time user - start streak at 1
        await db.collection("users").updateOne(
          { _id: userId },
          {
            $set: {
              "stats.currentStreak": 1,
              lastActive: new Date(),
            },
          }
        );
      } else {
        console.log(`times: ${todayMidnight}, ${lastActiveMidnight}`)
        const timeDifference =
          todayMidnight.getTime() - lastActiveMidnight.getTime();
        const dayDifference = Math.floor(
          timeDifference / (1000 * 60 * 60 * 24)
        );

        if (dayDifference === 1) {
          // Continue streak
          await db.collection("users").updateOne(
            { _id: userId },
            {
              $inc: { "stats.currentStreak": 1 },
              $set: { lastActive: new Date() },
            }
          );
        } else {
          // Streak broken - reset to 1
          await db.collection("users").updateOne(
            { _id: userId },
            {
              $set: {
                "stats.currentStreak": 1,
                lastActive: new Date(),
              },
            }
          );
        }
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.stats.languagesLearned = new Set(user.stats.languagesLearned).size

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      bio: user.bio,
      enrolledCourses: user.enrolledCourses,
      createdCourses: user.createdCourses,
      createdAt: user.createdAt,
      authProvider: user.authProvider || "local",
      phone: user.phone || "+234 000 000 0000",
      occupation: user.occupation || "unknown",
      address: user.address || "unknown",
      specialization: user.specialization || "unknown",
      experience: user.experience || 0,
      certifications: user.certifications || [],
      education: user.education || [],
      stats: user.stats || {},
      badges: user.badges || [],
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error fetching user data" });
  }
});

/**
 * @swagger
 * /auth/update-user:
 *   post:
 *     summary: Update user profile information
 *     tags: [Auth]
 *     description: Updates various fields of the authenticated user's profile.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateInput'
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Bad request, e.g., validation error or email already in use.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Email already in use
 *       401:
 *         description: Unauthorized - authentication required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Server error
 */

// POST /update-user - Update user profile
router.post(
  "/update-user",
  auth,
  [
    // Validation rules
    body("name").trim().notEmpty().withMessage("Full name is required"),
    body("email").optional().isEmail().withMessage("Invalid email address"),
    body("phone")
      .trim()
      .optional()
      .isMobilePhone()
      .withMessage("Invalid phone number"),
    body("bio").trim().optional(),
    body("occupation")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Occupation is required"),
    body("address").trim().optional(),
    body("specialization").trim().optional(),
    body("experience")
      .optional()
      .isNumeric()
      .withMessage("Experience must be a number"),
    body("profilePicture")
      .optional()
      .isURL()
      .withMessage("Profile picture must be a valid URL"),
    body("certifications")
      .optional()
      .isArray()
      .withMessage("Certifications must be an array"),
    body("certifications.*.title")
      .trim()
      .notEmpty()
      .withMessage("Certification title is required"),
    body("certifications.*.verified")
      .optional()
      .isBoolean()
      .withMessage("Verified must be a boolean"),
    body("education")
      .optional()
      .isArray()
      .withMessage("Education must be an array"),
    body("education.*.degree")
      .trim()
      .notEmpty()
      .withMessage("Degree is required"),
    body("education.*.institution")
      .trim()
      .notEmpty()
      .withMessage("Institution is required"),
    body("education.*.years")
      .trim()
      .notEmpty()
      .withMessage("Years are required"),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, error: errors.array()[0].msg });
    }

    const {
      name,
      email,
      phone,
      bio,
      occupation,
      address,
      specialization,
      experience,
      profilePicture,
      certifications,
      education,
    } = req.body;

    try {
      const db = req.app.locals.db;
      const userId = new ObjectId(req.user.userId);

      // Find the user by ID
      const user = await db.collection("users").findOne({ _id: userId });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // Check if the email is already used by another user
      if (email !== user.email) {
        const existingUser = await db.collection("users").findOne({ email });
        if (existingUser) {
          return res
            .status(400)
            .json({ success: false, error: "Email already in use" });
        }
      }

      // Update user fields
      const updatedUser = {
        name,
        email: email || user.email,
        phone: phone || user.phone,
        bio: bio || user.bio,
        occupation: occupation || user.occupation,
        address: address || user.address,
        specialization: specialization || user.specialization,
        experience: experience || user.experience,
        profilePicture: profilePicture || user.profilePicture,
        certifications: certifications || user.certifications,
        education: education || user.education,
      };

      // Update the user in the database
      await db
        .collection("users")
        .updateOne({ _id: userId }, { $set: updatedUser });

      // Fetch the updated user (excluding password)
      const updatedUserData = await db
        .collection("users")
        .findOne({ _id: userId }, { projection: { password: 0 } });

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUserData,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

/**
 * @swagger
 * /auth/profilepicture:
 *   post:
 *     summary: Update user's profile picture
 *     tags: [Auth]
 *     description: Updates the profile picture URL for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profilePicture
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *                 description: The new URL for the user's profile picture.
 *                 example: "https://example.com/new_profile.jpg"
 *     responses:
 *       200:
 *         description: Profile picture updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile picture updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Bad request, e.g., invalid URL for profile picture.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Profile picture must be a valid URL
 *       401:
 *         description: Unauthorized - authentication required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Server error
 */

// POST /profilepicture - Update user's profile picture
router.post(
  "/profilepicture",
  auth,
  [
    body("profilePicture")
      .isURL()
      .withMessage("Profile picture must be a valid URL"),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, error: errors.array()[0].msg });
    }

    const { profilePicture } = req.body;

    try {
      const db = req.app.locals.db;
      const userId = new ObjectId(req.user.userId);

      // Find the user by ID
      const user = await db.collection("users").findOne({ _id: userId });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // Update the profile picture
      await db
        .collection("users")
        .updateOne({ _id: userId }, { $set: { profilePicture } });

      // Fetch the updated user (excluding password)
      const updatedUser = await db
        .collection("users")
        .findOne({ _id: userId }, { projection: { password: 0 } });

      res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

module.exports = router;
