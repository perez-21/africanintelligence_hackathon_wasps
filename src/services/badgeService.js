import { BADGES } from "@/data/badges";
import { useSocket } from "@/services/socketService";

class BadgeService {
  constructor() {
    this.socket = null;
    this.unlockedBadges = new Set();
    this.stats = {
      // Streak stats
      currentStreak: 0,
      streakFreezesUsed: 0,

      // Course stats
      coursesCompleted: 0,
      completedSubjects: 0,
      fastCourseCompletions: 0,
      languagesLearned: 0,

      // XP and Rank stats
      totalXp: 0,
      weeklyRank: null,
      monthlyRank: null,
      yearlyRank: null,

      // Special stats
      isEarlyAdopter: false,
      perfectWeeks: 0,
      perfectMonths: 0,

      // Quiz stats
      perfectQuizzes: 0,
      highScoreQuizzes: 0,
      quizStreak: 0,

      // Community stats
      communityContributions: 0,
      commentLikes: 0,
      helpfulComments: 0,
      discussionsStarted: 0,
      solutionsProvided: 0,
      feedbackProvided: 0,

      // Learning stats
      certificatesEarned: 0,
      nightLessons: 0,
      morningLessons: 0,
      weekendLessons: 0,
      mobileLessons: 0,
      notesCreated: 0,
      articlesRead: 0,
      totalLearningHours: 0,
      maxDailyLearningHours: 0,
    };
  }

  initialize(socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    if (!this.socket) return;

    // Course completion events
    this.socket.on("course:completed", this.handleCourseCompleted.bind(this));

    // Quiz events
    this.socket.on("quiz:completed", this.handleQuizCompleted.bind(this));

    // Community events
    this.socket.on("comment:liked", this.handleCommentLiked.bind(this));
    this.socket.on("discussion:started", this.handleDiscussionStarted.bind(this));
    this.socket.on("solution:marked", this.handleSolutionMarked.bind(this));
    this.socket.on("feedback:given", this.handleFeedbackGiven.bind(this));

    // Streak events
    this.socket.on("streak:updated", this.handleStreakUpdated.bind(this));
    this.socket.on("streak:freeze", this.handleStreakFreeze.bind(this));

    // Learning events
    this.socket.on("lesson:completed", this.handleLessonCompleted.bind(this));

    // Note and article events
    this.socket.on("note:created", this.handleNoteCreated.bind(this));
    this.socket.on("article:read", this.handleArticleRead.bind(this));

    // Certificate events
    this.socket.on("certificate:earned", this.handleCertificateEarned.bind(this));

    // XP events
    this.socket.on("xp:earned", this.handleXpEarned.bind(this));

    // Rank events
    this.socket.on("rank:updated", this.handleRankUpdated.bind(this));

    // Perfect week/month tracking
    this.socket.on("challenge:completed", this.handleChallengeCompleted.bind(this));
  }

  // === Handlers ===
  handleCourseCompleted(data) {
    this.stats.coursesCompleted++;
    if (data.completionTime < 24) this.stats.fastCourseCompletions++;
    if (data.language && !this.stats.languagesLearned.includes(data.language)) {
      this.stats.languagesLearned.push(data.language);
    }
    if (data.subject) this.stats.completedSubjects++;
    this.checkCourseBadges();
  }

  handleQuizCompleted(result) {
    if (result.score === 100) {
      this.stats.perfectQuizzes++;
      this.stats.quizStreak++;
    } else {
      this.stats.quizStreak = 0;
    }
    if (result.score >= 90) this.stats.highScoreQuizzes++;
    this.checkQuizBadges();
  }

  handleCommentLiked() {
    this.stats.commentLikes++;
    this.checkCommunityBadges();
  }

  handleDiscussionStarted() {
    this.stats.discussionsStarted++;
    this.checkCommunityBadges();
  }

  handleSolutionMarked() {
    this.stats.solutionsProvided++;
    this.checkCommunityBadges();
  }

  handleFeedbackGiven() {
    this.stats.feedbackProvided++;
    this.checkCommunityBadges();
  }

  handleStreakUpdated(streak) {
    this.stats.currentStreak = streak || 0;
    this.checkStreakBadges();
  }

  handleStreakFreeze() {
    this.stats.streakFreezesUsed++;
    this.checkStreakBadges();
  }

  handleLessonCompleted(data) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    if (hour >= 22 || hour < 5) this.stats.nightLessons++;
    else if (hour >= 5 && hour < 8) this.stats.morningLessons++;
    if (day === 0 || day === 6) this.stats.weekendLessons++;
    if (data.deviceType === "mobile") this.stats.mobileLessons++;

    const lessonHours = data.duration / 3600;
    this.stats.totalLearningHours += lessonHours;

    const today = new Date().toDateString();
    const dailyHours = (this.dailyLearningHours[today] || 0) + lessonHours;
    this.dailyLearningHours[today] = dailyHours;
    this.stats.maxDailyLearningHours = Math.max(this.stats.maxDailyLearningHours, dailyHours);

    this.checkTimeBasedBadges();
  }

  handleNoteCreated() {
    this.stats.notesCreated++;
  }

  handleArticleRead() {
    this.stats.articlesRead++;
  }

  handleCertificateEarned() {
    this.stats.certificatesEarned++;
    this.checkCertificationBadges();
  }

  handleXpEarned(amount) {
    this.stats.totalXp += amount || 0;
    this.checkXPBadges();
  }

  handleRankUpdated(ranks) {
    if (ranks.weekly) this.stats.weeklyRank = ranks.weekly;
    if (ranks.monthly) this.stats.monthlyRank = ranks.monthly;
    if (ranks.yearly) this.stats.yearlyRank = ranks.yearly;
    this.checkRankBadges();
  }

  handleChallengeCompleted(data) {
    if (data.type === "daily" && data.period === "week") this.stats.perfectWeeks++;
    else if (data.type === "daily" && data.period === "month") this.stats.perfectMonths++;
  }

  updateStats(newStats) {
    // Ensure all stats are numbers and have default values
    this.stats = {
      ...this.stats,
      ...Object.entries(newStats).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]:
            typeof value === "number"
              ? value
              : Array.isArray(value)
              ? value
              : typeof value === "boolean"
              ? value
              : value === null
              ? 0
              : 0,
        }),
        {}
      ),
    };
    this.checkAllBadges();
  }

  checkAllBadges() {
    BADGES.forEach((badge) => {
      if (badge.unlock(this.stats) && !this.unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id);
      }
    });
  }

  checkCourseBadges() {
    const courseBadges = BADGES.filter((badge) => badge.category === "Course");
    courseBadges.forEach((badge) => {
      if (badge.unlock(this.stats) && !this.unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id);
      }
    });
  }

  checkQuizBadges() {
    const quizBadges = BADGES.filter((badge) => badge.category === "Quiz");
    quizBadges.forEach((badge) => {
      if (badge.unlock(this.stats) && !this.unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id);
      }
    });
  }

  checkCommunityBadges() {
    const communityBadges = BADGES.filter(
      (badge) => badge.category === "Community"
    );
    communityBadges.forEach((badge) => {
      if (badge.unlock(this.stats) && !this.unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id);
      }
    });
  }

  checkStreakBadges() {
    const streakBadges = BADGES.filter((badge) => badge.category === "Streak");
    streakBadges.forEach((badge) => {
      if (badge.unlock(this.stats) && !this.unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id);
      }
    });
  }

  checkXPBadges() {
    const xpBadges = BADGES.filter((badge) => badge.category === "XP");
    xpBadges.forEach((badge) => {
      if (badge.unlock(this.stats) && !this.unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id);
      }
    });
  }

  checkCertificationBadges() {
    const certBadges = BADGES.filter(
      (badge) => badge.category === "Certification"
    );
    certBadges.forEach((badge) => {
      if (badge.unlock(this.stats) && !this.unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id);
      }
    });
  }

  checkTimeBasedBadges() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 22 || hour < 5) {
      this.stats.nightLessons = (this.stats.nightLessons || 0) + 1;
    } else if (hour >= 5 && hour < 8) {
      this.stats.morningLessons = (this.stats.morningLessons || 0) + 1;
    }

    const timeBadges = BADGES.filter(
      (badge) => badge.id === "night-owl" || badge.id === "early-bird"
    );
    timeBadges.forEach((badge) => {
      if (badge.unlock(this.stats) && !this.unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id);
      }
    });
  }

  unlockBadge(badgeId) {
    if (this.unlockedBadges.has(badgeId)) return;

    this.unlockedBadges.add(badgeId);
    if (this.socket) {
      this.socket.emit("badge:unlocked", badgeId);
    }
  }

  getUnlockedBadges() {
    return Array.from(this.unlockedBadges);
  }

  isBadgeUnlocked(badgeId) {
    return this.unlockedBadges.has(badgeId);
  }

  getStats() {
    return { ...this.stats };
  }
}

export const badgeService = new BadgeService();
