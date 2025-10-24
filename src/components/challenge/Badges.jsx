// Badges.jsx (enhanced component)
import React, { useState, useEffect } from "react";
import { BADGES, BADGE_CATEGORIES, getBadgeProgress } from "../../data/badges";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from '@/services/socketService';
import { motion, AnimatePresence } from "framer-motion";
import BadgeHelper from '@/services/badgeHelper';
import { useTourLMS } from "../../contexts/TourLMSContext";
import { StatsIncrementer } from "./StatsIncrementer";
import { useNavigate } from "react-router-dom";

export const Badges = ({ stats = {} }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showDetails, setShowDetails] = useState(null);
  // const [studentStats, setStudentStats] = useState(BadgeHelper.getStats());
  const { studentStats, setStudentStats, studentBadges, setStudentBadges } = useTourLMS();
  const { user } = useTourLMS();
  const { toast } = useToast();
  const socket = useSocket();
  const navigate = useNavigate();

  const categories = ['All', ...Object.values(BADGE_CATEGORIES)];
  
  const filteredBadges = activeCategory === 'All' 
    ? BADGES 
    : BADGES.filter(badge => badge.category === activeCategory);

  const unlockedCount = BADGES.filter(badge => badge.unlock(studentStats)).length;
  const totalBadges = BADGES.length;

  useEffect(() => {
    const checkNewBadges = () => {
      BADGES.forEach(badge => {
        if (badge.unlock(studentStats) && !studentBadges.has(badge.id)) {
          setStudentBadges(prev => new Set([...prev, badge.id]));
          toast({
            title: "New Badge Unlocked! 🎉",
            description: `${badge.name}: ${badge.description}`,
            duration: 5000,
          });
          try {
            // Notify server of new badge
            if (socket) {
              socket.emit('badge:unlocked', badge.id);
            }
          }
          catch (error) {
            console.error('Error emitting badge unlock:', error);
          }
        }
      });
    };

    checkNewBadges();
  }, [studentStats, toast]);

  // Listen for real-time badge updates
  // useEffect(() => {
  //   if (!socket) return;

  //   const handleBadgeUnlock = (badgeId) => {
  //     const badge = BADGES.find(b => b.id === badgeId);
  //     if (badge && !studentBadges.has(badgeId)) {
  //       setStudentBadges(prev => new Set([...prev, badgeId]));
  //       setStudentStats(BadgeHelper.getStats());
  //       toast({
  //         title: "New Badge Unlocked! 🎉",
  //         description: `${badge.name}: ${badge.description}`,
  //         duration: 5000,
  //       });
  //     }
  //   };

  //   socket.on('badge:unlocked', handleBadgeUnlock);

  //   return () => {
  //     socket.off('badge:unlocked', handleBadgeUnlock);
  //   };
  // }, [socket, studentBadges, toast]);

  // Check time-based badges periodically
  useEffect(() => {
    const checkTimeBadges = () => {
      BadgeHelper.checkTimeBasedBadges(studentStats, studentBadges);
    };

    const interval = setInterval(checkTimeBadges, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Badges Progress: {unlockedCount}/{totalBadges}
        </h2>
        <div className="flex items-center w-full max-w-xs gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(0, (unlockedCount / totalBadges) * 100))}%` }}
            ></div>
          </div>

          <button
            onClick={() => navigate(0)}
            aria-label="Refresh"
            title="Refresh"
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="21 3 21 9 15 9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1 text-sm rounded-full ${
              activeCategory === category 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <AnimatePresence>
          {filteredBadges.map(badge => {
            const unlocked = badge.unlock(studentStats);
            const progress = Math.min(100, Math.max(0, badge.progress(studentStats)));
            
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowDetails(badge.id === showDetails ? null : badge.id)}
                className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  unlocked 
                    ? "border-green-400 bg-green-50 hover:bg-green-100" 
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                } ${badge.exclusive ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <span className="text-3xl relative">
                  {badge.icon}
                  {badge.tier === 2 && <span className="absolute -top-1 -right-1 text-xs">②</span>}
                  {badge.tier === 3 && <span className="absolute -top-1 -right-1 text-xs">③</span>}
                </span>
                
                <span className="text-xs font-semibold mt-1 text-center">
                  {badge.name}
                </span>
                
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full" 
                    style={{ width: `${unlocked ? 100 : progress}%` }}
                  ></div>
                </div>
                
                {unlocked ? (
                  <span className="text-green-600 text-[10px] mt-1">Unlocked</span>
                ) : (
                  <span className="text-gray-500 text-[10px] mt-1">
                    {Math.round(progress)}% complete
                  </span>
                )}
                
                {showDetails === badge.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 p-2 bg-white border rounded text-xs text-center"
                  >
                    {badge.description}
                    {badge.exclusive && <div className="text-yellow-600 mt-1">Exclusive Badge</div>}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
};