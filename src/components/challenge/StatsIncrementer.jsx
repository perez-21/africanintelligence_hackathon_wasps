import React from "react";

export const StatsIncrementer = ({ currentStats, setCurrentStats }) => {
  const handleIncrement = (field, amount = 1) => {
    setCurrentStats(prev => ({
      ...prev,
      [field]: (prev[field] || 0) + amount
    }));
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <button
        className="px-3 py-1 bg-blue-500 text-white rounded"
        onClick={() => handleIncrement("coursesCompleted")}
      >
        +1 Course Completed
      </button>
      <button
        className="px-3 py-1 bg-green-500 text-white rounded"
        onClick={() => handleIncrement("currentStreak")}
      >
        +1 Day Streak
      </button>
      <button
        className="px-3 py-1 bg-purple-500 text-white rounded"
        onClick={() => handleIncrement("totalXp", 100)}
      >
        +100 XP
      </button>
      <button
        className="px-3 py-1 bg-yellow-500 text-white rounded"
        onClick={() => handleIncrement("languagesLearned")}
      >
        +1 Language Learned
      </button>
      <button
        className="px-3 py-1 bg-gray-700 text-white rounded"
        onClick={() => handleIncrement("nightLessons")}
      >
        +1 Night Lesson
      </button>
    </div>
  );
};