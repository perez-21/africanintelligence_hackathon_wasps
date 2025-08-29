// badges.js (expanded data file)
export const BADGE_CATEGORIES = {
  STREAK: "Streak",
  COURSE: "Course",
  XP: "XP",
  RANK: "Rank",
  SPECIAL: "Special",
  QUIZ: "Quiz",
  COMMUNITY: "Community",
  CERTIFICATION: "Certification",
};

export const BADGES = [
  // Streak Badges
  {
    id: "streak-3",
    name: "3-Day Streak",
    description: "Logged in and made progress for 3 days in a row.",
    icon: "🔥",
    category: BADGE_CATEGORIES.STREAK,
    unlock: (stats) => stats.currentStreak >= 3,
    progress: (stats) => (Math.min(stats.currentStreak, 3) / 3) * 100,
    tier: 1,
  },
  {
    id: "streak-7",
    name: "7-Day Streak",
    description: "Logged in and made progress for 7 days in a row.",
    icon: "🔥🔥",
    category: BADGE_CATEGORIES.STREAK,
    unlock: (stats) => stats.currentStreak >= 7,
    progress: (stats) => (Math.min(stats.currentStreak, 7) / 7) * 100,
    tier: 2,
  },
  {
    id: "streak-30",
    name: "Monthly Streak",
    description: "Logged in and made progress for 30 days in a row.",
    icon: "🔥🔥🔥",
    category: BADGE_CATEGORIES.STREAK,
    unlock: (stats) => stats.currentStreak >= 30,
    progress: (stats) => (Math.min(stats.currentStreak, 30) / 30) * 100,
    tier: 3,
  },

  // Course Badges
  {
    id: "course-1",
    name: "First Course",
    description: "Completed your first course.",
    icon: "📚",
    category: BADGE_CATEGORIES.COURSE,
    unlock: (stats) => stats.coursesCompleted >= 1,
    progress: (stats) => (stats.coursesCompleted >= 1 ? 100 : 0),
    tier: 1,
  },
  {
    id: "course-5",
    name: "Course Explorer",
    description: "Completed 5 courses.",
    icon: "🎓",
    category: BADGE_CATEGORIES.COURSE,
    unlock: (stats) => stats.coursesCompleted >= 5,
    progress: (stats) => (Math.min(stats.coursesCompleted, 5) / 5) * 100,
    tier: 2,
  },
  {
    id: "course-10",
    name: "Course Master",
    description: "Completed 10 courses.",
    icon: "🏫",
    category: BADGE_CATEGORIES.COURSE,
    unlock: (stats) => stats.coursesCompleted >= 10,
    progress: (stats) => (Math.min(stats.coursesCompleted, 10) / 10) * 100,
    tier: 3,
  },

  // XP Badges
  {
    id: "xp-100",
    name: "XP Starter",
    description: "Earned 100 XP.",
    icon: "✨",
    category: BADGE_CATEGORIES.XP,
    unlock: (stats) => stats.totalXp >= 100,
    progress: (stats) => (Math.min(stats.totalXp, 100) / 100) * 100,
    tier: 1,
  },
  {
    id: "xp-250",
    name: "XP Starter II",
    description: "Earned 250 XP.",
    icon: "✨",
    category: BADGE_CATEGORIES.XP,
    unlock: (stats) => stats.totalXp >= 250,
    progress: (stats) => (Math.min(stats.totalXp, 250) / 250) * 100,
    tier: 1,
  },
  {
    id: "xp-500",
    name: "XP Starter III",
    description: "Earned 500 XP.",
    icon: "✨",
    category: BADGE_CATEGORIES.XP,
    unlock: (stats) => stats.totalXp >= 500,
    progress: (stats) => (Math.min(stats.totalXp, 500) / 500) * 100,
    tier: 1,
  },
  {
    id: "xp-1000",
    name: "XP Master",
    description: "Earned 1,000 XP.",
    icon: "⭐",
    category: BADGE_CATEGORIES.XP,
    unlock: (stats) => stats.totalXp >= 1000,
    progress: (stats) => (Math.min(stats.totalXp, 1000) / 1000) * 100,
    tier: 2,
  },
  {
    id: "xp-5000",
    name: "XP Legend",
    description: "Earned 5,000 XP.",
    icon: "🌟",
    category: BADGE_CATEGORIES.XP,
    unlock: (stats) => stats.totalXp >= 5000,
    progress: (stats) => (Math.min(stats.totalXp, 5000) / 5000) * 100,
    tier: 3,
  },

  // Rank Badges
  {
    id: "weekly-top50",
    name: "Weekly Top 50",
    description: "Ranked in top 50 for the week.",
    icon: "🥉",
    category: BADGE_CATEGORIES.RANK,
    unlock: (stats) => stats.weeklyRank && stats.weeklyRank <= 50,
    progress: (stats) => (stats.weeklyRank && stats.weeklyRank <= 50 ? 100 : 0),
    tier: 1,
  },
  {
    id: "weekly-top10",
    name: "Weekly Top 10",
    description: "Ranked in top 10 for the week.",
    icon: "🥈",
    category: BADGE_CATEGORIES.RANK,
    unlock: (stats) => stats.weeklyRank && stats.weeklyRank <= 10,
    progress: (stats) => (stats.weeklyRank && stats.weeklyRank <= 10 ? 100 : 0),
    tier: 2,
  },
  {
    id: "weekly-top1",
    name: "Weekly Champion",
    description: "Ranked #1 for the week.",
    icon: "🥇",
    category: BADGE_CATEGORIES.RANK,
    unlock: (stats) => stats.weeklyRank && stats.weeklyRank === 1,
    progress: (stats) => (stats.weeklyRank && stats.weeklyRank === 1 ? 100 : 0),
    tier: 3,
  },

  // Special Badges
  {
    id: "early-adopter",
    name: "Early Adopter",
    description: "Joined the platform during beta testing.",
    icon: "🚀",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.isEarlyAdopter,
    progress: (stats) => (stats.isEarlyAdopter ? 100 : 0),
    exclusive: true,
  },
  {
    id: "perfect-week",
    name: "Perfect Week",
    description: "Completed all daily challenges for a week.",
    icon: "✅",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.perfectWeeks >= 1,
    progress: (stats) => (stats.perfectWeeks >= 1 ? 100 : 0),
    tier: 1,
  },
  {
    id: "community-contributor",
    name: "Community Contributor",
    description: "Created content shared with the community.",
    icon: "💡",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.communityContributions >= 1,
    progress: (stats) => (stats.communityContributions >= 1 ? 100 : 0),
    tier: 1,
  },

  // Quiz Badges
  {
    id: "quiz-perfect",
    name: "Perfect Score",
    description: "Achieved 100% on any quiz.",
    icon: "🎯",
    category: BADGE_CATEGORIES.QUIZ,
    unlock: (stats) => stats.perfectQuizzes >= 1,
    progress: (stats) => (stats.perfectQuizzes >= 1 ? 100 : 0),
    tier: 1,
  },
  {
    id: "quiz-master",
    name: "Quiz Master",
    description: "Completed 10 quizzes with 90% or higher.",
    icon: "🎓",
    category: BADGE_CATEGORIES.QUIZ,
    unlock: (stats) => stats.highScoreQuizzes >= 10,
    progress: (stats) => (Math.min(stats.highScoreQuizzes, 10) / 10) * 100,
    tier: 2,
  },

  // Community Badges
  {
    id: "helpful-comment",
    name: "Helpful Contributor",
    description: "Received 10 likes on your comments.",
    icon: "💬",
    category: BADGE_CATEGORIES.COMMUNITY,
    unlock: (stats) => stats.commentLikes >= 10,
    progress: (stats) => (Math.min(stats.commentLikes, 10) / 10) * 100,
    tier: 1,
  },
  {
    id: "forum-expert",
    name: "Forum Expert",
    description: "Posted 50 helpful comments.",
    icon: "👨‍🏫",
    category: BADGE_CATEGORIES.COMMUNITY,
    unlock: (stats) => stats.helpfulComments >= 50,
    progress: (stats) => (Math.min(stats.helpfulComments, 50) / 50) * 100,
    tier: 2,
  },

  // Certification Badges
  {
    id: "first-cert",
    name: "First Certificate",
    description: "Earned your first course certificate.",
    icon: "📜",
    category: BADGE_CATEGORIES.CERTIFICATION,
    unlock: (stats) => stats.certificatesEarned >= 1,
    progress: (stats) => (stats.certificatesEarned >= 1 ? 100 : 0),
    tier: 1,
  },
  {
    id: "cert-master",
    name: "Certificate Master",
    description: "Earned 5 course certificates.",
    icon: "🏆",
    category: BADGE_CATEGORIES.CERTIFICATION,
    unlock: (stats) => stats.certificatesEarned >= 5,
    progress: (stats) => (Math.min(stats.certificatesEarned, 5) / 5) * 100,
    tier: 2,
  },

  // Additional Special Badges
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Completed 5 lessons after 10 PM.",
    icon: "🦉",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.nightLessons >= 5,
    progress: (stats) => (Math.min(stats.nightLessons, 5) / 5) * 100,
    tier: 1,
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Completed 5 lessons before 8 AM.",
    icon: "🌅",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.morningLessons >= 5,
    progress: (stats) => (Math.min(stats.morningLessons, 5) / 5) * 100,
    tier: 1,
  },
  // Additional badges to add to your BADGES array
  {
    id: "streak-100",
    name: "Century Streak",
    description: "Logged in and made progress for 100 days in a row!",
    icon: "💯",
    category: BADGE_CATEGORIES.STREAK,
    unlock: (stats) => stats.currentStreak >= 100,
    progress: (stats) => (Math.min(stats.currentStreak, 100) / 100) * 100,
    tier: 4,
  },
  {
    id: "course-25",
    name: "Course Collector",
    description: "Completed 25 courses. You're a learning machine!",
    icon: "📚📚📚",
    category: BADGE_CATEGORIES.COURSE,
    unlock: (stats) => stats.coursesCompleted >= 25,
    progress: (stats) => (Math.min(stats.coursesCompleted, 25) / 25) * 100,
    tier: 4,
  },
  {
    id: "xp-10000",
    name: "XP Overlord",
    description: "Earned 10,000 XP. Absolute mastery!",
    icon: "👑",
    category: BADGE_CATEGORIES.XP,
    unlock: (stats) => stats.totalXp >= 10000,
    progress: (stats) => (Math.min(stats.totalXp, 10000) / 10000) * 100,
    tier: 4,
  },
  {
    id: "monthly-top10",
    name: "Monthly Elite",
    description: "Ranked in top 10 for the month.",
    icon: "🏅",
    category: BADGE_CATEGORIES.RANK,
    unlock: (stats) => stats.monthlyRank && stats.monthlyRank <= 10,
    progress: (stats) =>
      stats.monthlyRank && stats.monthlyRank <= 10 ? 100 : 0,
    tier: 3,
  },
  {
    id: "yearly-top10",
    name: "Yearly Legend",
    description: "Ranked in top 10 for the year.",
    icon: "🏆",
    category: BADGE_CATEGORIES.RANK,
    unlock: (stats) => stats.yearlyRank && stats.yearlyRank <= 10,
    progress: (stats) => (stats.yearlyRank && stats.yearlyRank <= 10 ? 100 : 0),
    tier: 4,
  },
  {
    id: "perfect-month",
    name: "Perfect Month",
    description: "Completed all daily challenges for a month.",
    icon: "✔️✔️",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.perfectMonths >= 1,
    progress: (stats) => (stats.perfectMonths >= 1 ? 100 : 0),
    tier: 3,
  },
  {
    id: "speed-learner",
    name: "Speed Learner",
    description: "Completed a course in under 24 hours.",
    icon: "⚡",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.fastCourseCompletions >= 1,
    progress: (stats) => (stats.fastCourseCompletions >= 1 ? 100 : 0),
    tier: 2,
  },
  {
    id: "polyglot",
    name: "Polyglot",
    description: "Completed courses in 3 different languages.",
    icon: "🌎",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.languagesLearned >= 3,
    progress: (stats) => (Math.min(stats.languagesLearned, 3) / 3) * 100,
    tier: 2,
  },
  {
    id: "quiz-streak-5",
    name: "Quiz Champion",
    description: "Got 5 perfect quiz scores in a row.",
    icon: "🏅",
    category: BADGE_CATEGORIES.QUIZ,
    unlock: (stats) => stats.quizStreak >= 5,
    progress: (stats) => (Math.min(stats.quizStreak, 5) / 5) * 100,
    tier: 3,
  },
  {
    id: "discussion-starter",
    name: "Discussion Starter",
    description: "Started 10 forum discussions that got replies.",
    icon: "💬",
    category: BADGE_CATEGORIES.COMMUNITY,
    unlock: (stats) => stats.discussionsStarted >= 10,
    progress: (stats) => (Math.min(stats.discussionsStarted, 10) / 10) * 100,
    tier: 2,
  },
  {
    id: "mentor",
    name: "Community Mentor",
    description: "Had 5 of your answers marked as correct solutions.",
    icon: "👨‍🏫",
    category: BADGE_CATEGORIES.COMMUNITY,
    unlock: (stats) => stats.solutionsProvided >= 5,
    progress: (stats) => (Math.min(stats.solutionsProvided, 5) / 5) * 100,
    tier: 3,
  },
  {
    id: "cert-pro",
    name: "Certification Pro",
    description: "Earned 10 course certificates.",
    icon: "🏅",
    category: BADGE_CATEGORIES.CERTIFICATION,
    unlock: (stats) => stats.certificatesEarned >= 10,
    progress: (stats) => (Math.min(stats.certificatesEarned, 10) / 10) * 100,
    tier: 3,
  },
  {
    id: "weekend-warrior",
    name: "Weekend Warrior",
    description: "Completed 10 lessons on weekends.",
    icon: "🎮",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.weekendLessons >= 10,
    progress: (stats) => (Math.min(stats.weekendLessons, 10) / 10) * 100,
    tier: 1,
  },
  {
    id: "mobile-learner",
    name: "Mobile Learner",
    description: "Completed 10 lessons on mobile.",
    icon: "📱",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.mobileLessons >= 10,
    progress: (stats) => (Math.min(stats.mobileLessons, 10) / 10) * 100,
    tier: 1,
  },
  {
    id: "subject-master",
    name: "Subject Master",
    description: "Completed all courses in one subject area.",
    icon: "🎯",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.completedSubjects >= 1,
    progress: (stats) => (stats.completedSubjects >= 1 ? 100 : 0),
    tier: 3,
  },
  {
    id: "feedback-champion",
    name: "Feedback Champion",
    description: "Provided 10 pieces of constructive feedback.",
    icon: "📝",
    category: BADGE_CATEGORIES.COMMUNITY,
    unlock: (stats) => stats.feedbackProvided >= 10,
    progress: (stats) => (Math.min(stats.feedbackProvided, 10) / 10) * 100,
    tier: 2,
  },
  {
    id: "note-taker",
    name: "Note Taker",
    description: "Saved 100 notes across your courses.",
    icon: "📓",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.notesTaken >= 100,
    progress: (stats) => (Math.min(stats.notesTaken, 100) / 100) * 100,
    tier: 2,
  },
  {
    id: "bookworm",
    name: "Bookworm",
    description: "Spent 50 hours learning on the platform.",
    icon: "📖",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.totalLearningHours >= 50,
    progress: (stats) => (Math.min(stats.totalLearningHours, 50) / 50) * 100,
    tier: 2,
  },
  {
    id: "marathoner",
    name: "Learning Marathoner",
    description: "Spent 5 hours learning in a single day.",
    icon: "🏃‍♂️",
    category: BADGE_CATEGORIES.SPECIAL,
    unlock: (stats) => stats.maxDailyLearningHours >= 5,
    progress: (stats) => (Math.min(stats.maxDailyLearningHours, 5) / 5) * 100,
    tier: 2,
  },
  {
    id: "streak-saver",
    name: "Streak Saver",
    description: "Used a streak freeze to save your streak.",
    icon: "❄️",
    category: BADGE_CATEGORIES.STREAK,
    unlock: (stats) => stats.streakFreezesUsed >= 1,
    progress: (stats) => (stats.streakFreezesUsed >= 1 ? 100 : 0),
    tier: 1,
  },
];

export const getBadgeProgress = (badge, stats) => {
  if (!stats) return 0;

  const safeGet = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  switch (badge.id) {
    case "quiz-champion":
      return Math.min(100, (safeGet(stats.perfectQuizzes) / 10) * 100);

    case "discussion-starter":
      return Math.min(100, (safeGet(stats.communityContributions) / 20) * 100);

    case "community-mentor":
      return Math.min(100, (safeGet(stats.helpfulComments) / 50) * 100);

    case "certification-pro":
      return Math.min(100, (safeGet(stats.certificatesEarned) / 5) * 100);

    case "weekend-warrior":
      return Math.min(100, (safeGet(stats.weekendLessons) / 10) * 100);

    case "mobile-learner":
      return Math.min(100, (safeGet(stats.mobileLessons) / 20) * 100);

    case "subject-master":
      return Math.min(100, (safeGet(stats.coursesCompleted) / 10) * 100);

    case "feedback-champion":
      return Math.min(100, (safeGet(stats.feedbackGiven) / 15) * 100);

    case "note-taker":
      return Math.min(100, (safeGet(stats.notesCreated) / 30) * 100);

    case "bookworm":
      return Math.min(100, (safeGet(stats.articlesRead) / 25) * 100);

    case "learning-marathoner":
      return Math.min(100, (safeGet(stats.currentStreak) / 30) * 100);

    case "early-bird":
      return Math.min(100, (safeGet(stats.morningLessons) / 5) * 100);

    case "night-owl":
      return Math.min(100, (safeGet(stats.nightLessons) / 5) * 100);

    case "perfect-score":
      return Math.min(100, (safeGet(stats.perfectQuizzes) / 1) * 100);

    case "quiz-master":
      return Math.min(100, (safeGet(stats.highScoreQuizzes) / 10) * 100);

    case "helpful-contributor":
      return Math.min(100, (safeGet(stats.commentLikes) / 10) * 100);

    case "forum-expert":
      return Math.min(100, (safeGet(stats.helpfulComments) / 50) * 100);

    case "first-certificate":
      return Math.min(100, (safeGet(stats.certificatesEarned) / 1) * 100);

    case "certificate-master":
      return Math.min(100, (safeGet(stats.certificatesEarned) / 5) * 100);

    case "early-adopter":
      return stats.isEarlyAdopter ? 100 : 0;

    case "perfect-week":
      return Math.min(100, (safeGet(stats.perfectWeeks) / 1) * 100);

    case "top-contributor":
      return Math.min(100, safeGet(stats.weeklyRank) === 1 ? 100 : 0);

    default:
      return 0;
  }
};
