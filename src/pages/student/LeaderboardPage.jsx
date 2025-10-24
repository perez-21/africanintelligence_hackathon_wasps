// LeaderboardPage.jsx (with dummy data)
import React, { useEffect, useState } from "react";
import { Leaderboard } from "../../components/challenge/Leaderboard";
import { useTourLMS } from "../../contexts/TourLMSContext";
import { useSocket } from "../../services/socketService";
import { XPProgress } from "../../components/challenge/XPProgress";
// import { Badge } from "../../components/ui/Badge";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';


const TABS = [
  { key: "global", label: "Global", icon: "🌍" },
  { key: "weekly", label: "Weekly", icon: "📅" },
  { key: "course", label: "Course", icon: "📚" },
  { key: "friends", label: "Friends", icon: "👥" }
];

const TIME_RANGES = [
  { key: "all", label: "All Time" },
  { key: "month", label: "This Month" },
  { key: "week", label: "This Week" }
];

// Dummy data generators
const generateUsers = (count, isWeekly = false) => {
  const names = [
    "Alex Johnson", "Maria Garcia", "James Smith", "Sarah Williams", 
    "David Brown", "Emma Jones", "Michael Miller", "Sophia Davis",
    "Robert Wilson", "Olivia Taylor", "William Anderson", "Ava Thomas"
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    userId: `user-${i}`,
    name: names[i % names.length],
    xp: Math.floor(Math.random() * 10000) + 1000,
    level: Math.floor(Math.random() * 10) + 1,
    avatar: i < 5 ? `https://i.pravatar.cc/150?img=${i + 1}` : null,
    isPremium: i % 3 === 0,
    xpChange: isWeekly ? Math.floor(Math.random() * 200) - 100 : null,
    weeklyProgress: isWeekly ? Math.floor(Math.random() * 100) : null
  })).sort((a, b) => b.xp - a.xp);
};

const fetchGlobalLeaderboard = async () => {
  const response = await axios.get(`${API_URL}/leaderboard`);
  console.log(response);
  const board = response.data.map((element) => ({
    userId: element._id,
    name: element.name,
    xp: element.stats.totalXp,
    level: element.stats.rank,
    avatar: element.profilePicture || `https://i.pravatar.cc/150`,
    isPremium: false,
    xpChange: null,
    weeklyProgress: null,
  }));
  console.log(board);
  return board;
}

const generateCourses = () => [
  { id: "math101", name: "Mathematics Fundamentals" },
  { id: "cs101", name: "Computer Science Basics" },
  { id: "lang201", name: "Advanced Language" },
  { id: "hist101", name: "World History" },
  { id: "art101", name: "Art Appreciation" }
];

const generateFriendsData = (userId) => {
  const allUsers = generateUsers(8);
  return allUsers.filter(user => user.userId !== userId).slice(0, 5);
};

export default function LeaderboardPage() {
  const [tab, setTab] = useState("global");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState(generateCourses());
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useTourLMS();
  
  // Enhance user data for demo
  const demoUser = {
    ...user,
    id: "user-current",
    name: "You",
    xp: 4250,
    nextLevelXp: 5000,
    rank: 15,
    level: 4,
    avatar: "https://i.pravatar.cc/150?img=68",
    isPremium: true
  };

  useEffect(async () => {
    setIsLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(async () => {
      let newData = [];
      
      switch(tab) {
        case "global":
          // newData = generateUsers(20);
          newData = await fetchGlobalLeaderboard();
          break;
        case "weekly":
          newData = generateUsers(15, true);
          break;
        case "course":
          newData = generateUsers(10);
          break;
        case "friends":
          newData = generateFriendsData(demoUser.id);
          break;
        default:
          newData = generateUsers(10);
      }
      
      setData(newData);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [tab, timeRange, selectedCourse]);

  // socket connection
  /*
  const ioClient = io('http://localhost:3001', {auth: {userId: user.id}});
  ioClient.on('connected', (d) => console.log('connected', d));
  ioClient.on('score.updated', (evt) => {
    console.log('score updated', evt);
    // update score UI
  });
  */


  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leaderboards</h1>
          <p className="text-gray-600">
            Compete with others and track your learning progress
          </p>
        </div>
        <XPProgress 
          currentXp={demoUser.xp} 
          nextLevelXp={demoUser.nextLevelXp} 
          level={demoUser.level}
        />
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap ${
                tab === t.key 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {(tab === "global" || tab === "weekly") && (
          <div className="flex gap-2">
            {TIME_RANGES.map(range => (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key)}
                className={`px-3 py-1 text-sm rounded ${
                  timeRange === range.key 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-gray-100'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}

        {tab === "course" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Select Course
            </label>
            <select
              value={selectedCourse || ""}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="p-2 border rounded-md bg-white"
              disabled={isLoading}
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <>
          <Leaderboard 
            data={data} 
            highlightUserId={demoUser.id} 
            currentUserRank={demoUser.rank} 
            type={tab}
          />
          
          {data.length === 0 && tab !== "friends" && (
            <div className="text-center py-10 text-gray-500">
              No leaderboard data available
            </div>
          )}
        </>
      )}

      {tab === "friends" && data.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">You haven't added any friends yet</p>
          <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
            Invite Friends
          </button>
        </div>
      )}
    </div>
  );
}