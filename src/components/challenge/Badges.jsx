// Badges.jsx (enhanced component)
import React, { useState, useEffect } from "react";
import { BADGES, BADGE_CATEGORIES, getBadgeProgress } from "../../data/badges";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from '@/services/socketService';
import { motion, AnimatePresence } from "framer-motion";
import { badgeService } from '@/services/badgeService';
import { useTourLMS } from "../../contexts/TourLMSContext";
import { StatsIncrementer } from "./StatsIncrementer";

export const Badges = ({ stats = {} }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showDetails, setShowDetails] = useState(null);
  const [unlockedBadges, setUnlockedBadges] = useState(new Set());
  const [currentStats, setCurrentStats] = useState(badgeService.getStats());
  const { user } = useTourLMS();
  const { toast } = useToast();
  const socket = useSocket();

  const categories = ['All', ...Object.values(BADGE_CATEGORIES)];
  
  const filteredBadges = activeCategory === 'All' 
    ? BADGES 
    : BADGES.filter(badge => badge.category === activeCategory);

  const unlockedCount = BADGES.filter(badge => badge.unlock(currentStats)).length;
  const totalBadges = BADGES.length;
  console.log(badgeService.getStats());

  /*
  useEffect(() => {

    const fetchBadges = async () => {
      const response = await axios.get(`http://localhost:3000/users/${user.id}/badges`);
      const badges = response.data;
    
      return badges;
    }

    const handleBadgeUnlock = (badgeId) => {
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge && !unlockedBadges.has(badgeId)) {
        setUnlockedBadges(prev => new Set([...prev, badgeId]));
        //setCurrentStats(badgeService.getStats());
        toast({
          title: "New Badge Unlocked! 🎉",
          description: `${badge.name}: ${badge.description}`,
          duration: 5000,
        });
      }
    };

    async function run() {

      // update stats
      setCurrentStats(prev => ({...prev, totalXp: 400}));

      const userBadges = await fetchBadges();
      console.log(`user badges: ${userBadges}`);

      for (let badge of userBadges) {
        switch (badge) {
          case 'Milestone-100':
            handleBadgeUnlock('xp-100');
            break;
          case 'Milestone-250':
            handleBadgeUnlock('xp-250');
            break;
          case 'Milestone-500':
            handleBadgeUnlock('xp-500');
            break;
          case 'Milestone-1000':
            handleBadgeUnlock('xp-1000');
            break;
          
        }
      }
    }
    run();
  }, []);
  */
  

  // Initialize badge service with socket
  useEffect(() => {
    if (socket) {
      badgeService.initialize(socket);
    }
  }, [socket]);

  // Update stats in badge service and local state
  useEffect(() => {
    badgeService.updateStats(stats);
    //setCurrentStats(badgeService.getStats());
    setCurrentStats(prev => ({...prev, totalXp: badgeService.getStats().totalXp + 100}));
  }, []);

  // Check for newly unlocked badges
  useEffect(() => {
    const checkNewBadges = () => {
      BADGES.forEach(badge => {
        if (badge.unlock(currentStats) && !unlockedBadges.has(badge.id)) {
          setUnlockedBadges(prev => new Set([...prev, badge.id]));
          toast({
            title: "New Badge Unlocked! 🎉",
            description: `${badge.name}: ${badge.description}`,
            duration: 5000,
          });
        }
      });
    };

    checkNewBadges();
  }, [currentStats, unlockedBadges, toast]);

  // Listen for real-time badge updates
  useEffect(() => {
    if (!socket) return;

    const handleBadgeUnlock = (badgeId) => {
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge && !unlockedBadges.has(badgeId)) {
        setUnlockedBadges(prev => new Set([...prev, badgeId]));
        setCurrentStats(badgeService.getStats());
        toast({
          title: "New Badge Unlocked! 🎉",
          description: `${badge.name}: ${badge.description}`,
          duration: 5000,
        });
      }
    };

    socket.on('badge:unlocked', handleBadgeUnlock);

    return () => {
      socket.off('badge:unlocked', handleBadgeUnlock);
    };
  }, [socket, unlockedBadges, toast]);

  // Check time-based badges periodically
  useEffect(() => {
    const checkTimeBadges = () => {
      badgeService.checkTimeBasedBadges();
      setCurrentStats(badgeService.getStats());
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
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-green-500 h-2.5 rounded-full" 
            style={{ width: `${Math.min(100, Math.max(0, (unlockedCount / totalBadges) * 100))}%` }}
          ></div>
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
            const unlocked = badge.unlock(currentStats);
            const progress = Math.min(100, Math.max(0, getBadgeProgress(badge, currentStats)));
            
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
        <StatsIncrementer currentStats={currentStats} setCurrentStats={setCurrentStats}></StatsIncrementer>
      </div>

    </div>
  );
};