// BadgesPage.jsx (enhanced page)
import React, { useEffect } from "react";
import { useTourLMS } from "../../contexts/TourLMSContext";
import { Badges } from "../../components/challenge/Badges";

export default function BadgesPage() {
  const { userStats } = useTourLMS();
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Badges</h1>
          <p className="text-gray-600">
            Earn achievements by completing courses, maintaining streaks, and climbing the leaderboard.
          </p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <div className="text-blue-800 font-semibold">Badge Levels</div>
          <div className="flex gap-2 text-xs mt-1">
            <span className="flex items-center"><span className="mr-1">①</span> Basic</span>
            <span className="flex items-center"><span className="mr-1">②</span> Advanced</span>
            <span className="flex items-center"><span className="mr-1">③</span> Expert</span>
          </div>
        </div>
      </div>
      
      <Badges stats={userStats} />
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="font-semibold mb-2">How to earn more badges?</h2>
        <ul className="text-sm space-y-1 list-disc pl-5">
          <li>Complete courses to earn course badges</li>
          <li>Login daily to maintain your streak</li>
          <li>Earn XP by completing lessons and challenges</li>
          <li>Participate in weekly challenges to climb the leaderboard</li>
          <li>Contribute to the community for special badges</li>
        </ul>
      </div>
    </div>
  );
}