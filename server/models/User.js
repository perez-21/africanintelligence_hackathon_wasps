const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["admin", "facilitator", "learner"],
    default: "learner",
  },
  profilePicture: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    default: "",
  },
  badges: [{
    type: String,
  }],
  stats: {
    // Streak stats
    currentStreak: {
      type: Number,
      default: 0
    },
    streakFreezesUsed: {
      type: Number,
      default: 0
    },

    // Course stats
    coursesCompleted: {
      type: Number,
      default: 0
    },
    completedSubjects: {
      type: Number,
      default: 0
    },
    fastCourseCompletions: {
      type: Number,
      default: 0
    },
    languagesLearned: {
      type: Number,
      default: 0
    },

    // XP and Rank stats
    totalXp: {
      type: Number,
      default: 0
    },
    weeklyRank: null,
    monthlyRank: null,
    yearlyRank: null,

    // Special stats
    isEarlyAdopter: {
      type: Boolean,
      default: false
    },
    perfectWeeks: {
      type: Number,
      default: 0
    },
    perfectMonths: {
      type: Number,
      default: 0
    },

    // Quiz stats
    perfectQuizzes: {
      type: Number,
      default: 0
    },
    highScoreQuizzes: {
      type: Number,
      default: 0
    },
    quizStreak: {
      type: Number,
      default: 0
    },

    // Community stats
    communityContributions: {
      type: Number,
      default: 0
    },
    commentLikes: {
      type: Number,
      default: 0
    },
    helpfulComments: {
      type: Number,
      default: 0
    },
    discussionsStarted: {
      type: Number,
      default: 0
    },
    solutionsProvided: {
      type: Number,
      default: 0
    },
    feedbackProvided: {
      type: Number,
      default: 0
    },

    // Learning stats
    certificatesEarned: {
      type: Number,
      default: 0
    },
    nightLessons: {
      type: Number,
      default: 0
    },
    morningLessons: {
      type: Number,
      default: 0
    },
    weekendLessons: {
      type: Number,
      default: 0
    },
    mobileLessons: {
      type: Number,
      default: 0
    },
    notesCreated: {
      type: Number,
      default: 0
    },
    articlesRead: {
      type: Number,
      default: 0
    },
    totalLearningHours: {
      type: Number,
      default: 0
    },
    maxDailyLearningHours: {
      type: Number,
      default: 0
    },
  },
  enrolledCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  createdCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
