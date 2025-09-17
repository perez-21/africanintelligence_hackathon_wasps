import { BADGES } from "@/data/badges";

export default class BadgeService {
  // === Handlers ===
  static handleCourseCompleted(data, stats, unlockedBadges) {
    stats.coursesCompleted++;
    if (data.completionTime < 24) stats.fastCourseCompletions++;
    if (data.language && !stats.languagesLearned.includes(data.language)) {
      stats.languagesLearned.push(data.language);
    }
    if (data.subject) stats.completedSubjects++;
    this.checkCourseBadges(stats, unlockedBadges);
  }

  static handleQuizCompleted(result, stats, unlockedBadges) {
    if (result.score === 100) {
      stats.perfectQuizzes++;
      stats.quizStreak++;
    } else {
      stats.quizStreak = 0;
    }
    if (result.score >= 90) stats.highScoreQuizzes++;
    this.checkQuizBadges(stats, unlockedBadges);
  }

  static handleCommentLiked(stats, unlockedBadges) {
    stats.commentLikes++;
    this.checkCommunityBadges(stats, unlockedBadges);
  }

  static handleDiscussionStarted(stats, unlockedBadges) {
    stats.discussionsStarted++;
    this.checkCommunityBadges(stats, unlockedBadges);
  }

  static handleSolutionMarked(stats, unlockedBadges) {
    stats.solutionsProvided++;
    this.checkCommunityBadges(stats, unlockedBadges);
  }

  static handleFeedbackGiven(stats, unlockedBadges) {
    stats.feedbackProvided++;
    this.checkCommunityBadges(stats, unlockedBadges);
  }

  static handleStreakUpdated(streak, stats, unlockedBadges) {
    stats.currentStreak = streak || 0;
    this.checkStreakBadges(stats, unlockedBadges);
  }

  static handleStreakFreeze(stats, unlockedBadges) {
    stats.streakFreezesUsed++;
    this.checkStreakBadges(stats, unlockedBadges);
  }

  static handleLessonCompleted(data, stats, unlockedBadges, dailyLearningHours = {}) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    if (hour >= 22 || hour < 5) stats.nightLessons++;
    else if (hour >= 5 && hour < 8) stats.morningLessons++;
    if (day === 0 || day === 6) stats.weekendLessons++;
    if (data.deviceType === "mobile") stats.mobileLessons++;

    const lessonHours = data.duration / 3600;
    stats.totalLearningHours += lessonHours;

    const today = new Date().toDateString();
    const dailyHours = (dailyLearningHours[today] || 0) + lessonHours;
    dailyLearningHours[today] = dailyHours;
    stats.maxDailyLearningHours = Math.max(stats.maxDailyLearningHours, dailyHours);

    this.checkTimeBasedBadges(stats, unlockedBadges);
  }

  static handleNoteCreated(stats) {
    stats.notesCreated++;
  }

  static handleArticleRead(stats) {
    stats.articlesRead++;
  }

  static handleCertificateEarned(stats, unlockedBadges) {
    stats.certificatesEarned++;
    this.checkCertificationBadges(stats, unlockedBadges);
  }

  static handleXpEarned(amount, stats, unlockedBadges) {
    stats.totalXp += amount || 0;
    this.checkXPBadges(stats, unlockedBadges);
  }

  static handleRankUpdated(ranks, stats, unlockedBadges) {
    if (ranks.weekly) stats.weeklyRank = ranks.weekly;
    if (ranks.monthly) stats.monthlyRank = ranks.monthly;
    if (ranks.yearly) stats.yearlyRank = ranks.yearly;
    this.checkRankBadges(stats, unlockedBadges);
  }

  static handleChallengeCompleted(data, stats, unlockedBadges) {
    if (data.type === "daily" && data.period === "week") stats.perfectWeeks++;
    else if (data.type === "daily" && data.period === "month") stats.perfectMonths++;
  }

  static updateStats(newStats, stats, setStudentStats, unlockedBadges) {
    // Ensure all stats are numbers and have default values
    const mergedStats = {
      ...stats,
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

    // TODO: persist stats
    console.log(mergedStats)
    this.checkAllBadges(mergedStats, unlockedBadges);
  }

  static checkAllBadges(stats, unlockedBadges) {
    BADGES.forEach((badge) => {
      const result = badge.unlock(stats) && !unlockedBadges.has(badge.id);
      console.log(`result: ${result}`);
      if (result) {
        this.unlockBadge(badge.id, unlockedBadges);
        console.log('unlocked')
      }
    });
  }

  static checkCourseBadges(stats, unlockedBadges) {
    const courseBadges = BADGES.filter((badge) => badge.category === "Course");
    courseBadges.forEach((badge) => {
      if (badge.unlock(stats) && !unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id, unlockedBadges);
      }
    });
  }

  static checkQuizBadges(stats, unlockedBadges) {
    const quizBadges = BADGES.filter((badge) => badge.category === "Quiz");
    quizBadges.forEach((badge) => {
      if (badge.unlock(stats) && !unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id, unlockedBadges);
      }
    });
  }

  static checkCommunityBadges(stats, unlockedBadges) {
    const communityBadges = BADGES.filter(
      (badge) => badge.category === "Community"
    );
    communityBadges.forEach((badge) => {
      if (badge.unlock(stats) && !unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id, unlockedBadges);
      }
    });
  }

  static checkStreakBadges(stats, unlockedBadges) {
    const streakBadges = BADGES.filter((badge) => badge.category === "Streak");
    streakBadges.forEach((badge) => {
      if (badge.unlock(stats) && !unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id, unlockedBadges);
      }
    });
  }

  static checkXPBadges(stats, unlockedBadges) {
    const xpBadges = BADGES.filter((badge) => badge.category === "XP");
    xpBadges.forEach((badge) => {
      if (badge.unlock(stats) && !unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id, unlockedBadges);
      }
    });
  }

  static checkCertificationBadges(stats, unlockedBadges) {
    const certBadges = BADGES.filter(
      (badge) => badge.category === "Certification"
    );
    certBadges.forEach((badge) => {
      if (badge.unlock(stats) && !unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id, unlockedBadges);
      }
    });
  }

  static checkTimeBasedBadges(stats, unlockedBadges) {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 22 || hour < 5) {
      stats.nightLessons = (stats.nightLessons || 0) + 1;
    } else if (hour >= 5 && hour < 8) {
      stats.morningLessons = (stats.morningLessons || 0) + 1;
    }

    const timeBadges = BADGES.filter(
      (badge) => badge.id === "night-owl" || badge.id === "early-bird"
    );
    timeBadges.forEach((badge) => {
      if (badge.unlock(stats) && !unlockedBadges.has(badge.id)) {
        this.unlockBadge(badge.id, unlockedBadges);
      }
    });
  }

  static unlockBadge(badgeId, unlockedBadges) {
    if (unlockedBadges.has(badgeId)) return;

    unlockedBadges.add(badgeId);
    console.log('unlocked');
  }

  static getUnlockedBadges(unlockedBadges) {
    return Array.from(unlockedBadges);
  }

  static isBadgeUnlocked(badgeId, unlockedBadges) {
    return unlockedBadges.has(badgeId);
  }
}


