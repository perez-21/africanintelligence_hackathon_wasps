// Leaderboard.jsx (enhanced)
import React from "react";
// import { Badge } from "../ui/Badge";

export const Leaderboard = ({ 
  data, 
  highlightUserId, 
  currentUserRank,
  type = "global"
}) => {
  const getRankBadge = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  const getXpChange = (user) => {
    if (!user.xpChange) return null;
    const isPositive = user.xpChange >= 0;
    return (
      <span className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(user.xpChange)}
      </span>
    );
  };

  return (
    <div className="w-full bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                XP
              </th>
              {type === "weekly" && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((entry, idx) => (
              <tr
                key={entry.userId}
                className={`${
                  entry.userId === highlightUserId 
                    ? 'bg-amber-50' 
                    : idx % 2 === 0 
                      ? 'bg-white' 
                      : 'bg-gray-50'
                } hover:bg-gray-100 transition-colors`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="font-medium w-6">
                      {getRankBadge(idx + 1)}
                    </span>
                    {entry.userId === highlightUserId && (
                      <Badge color="amber" className="ml-2">
                        You
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt={entry.name} />
                      ) : (
                        <span className="text-gray-600 text-sm">
                          {entry.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">
                        {entry.name}
                        {entry.isPremium && (
                          <span className="ml-1 text-amber-500">★</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Level {entry.level || 1}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.xp.toLocaleString()}</span>
                    {getXpChange(entry)}
                  </div>
                </td>
                {type === "weekly" && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(entry.weeklyProgress || 0, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentUserRank && !data.some(u => u.userId === highlightUserId) && (
        <div className="bg-gray-50 px-4 py-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="font-medium w-6">{currentUserRank}</span>
              <div className="ml-3">
                <div className="font-medium">Your Position</div>
              </div>
            </div>
            <button className="text-sm text-amber-600 hover:text-amber-800">
              View Full Ranking
            </button>
          </div>
        </div>
      )}
    </div>
  );
};