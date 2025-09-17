import { useState, useEffect } from "react";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle 
} from "@/components/ui/card";
import { 
  BookOpen, 
  Award, 
  Clock, 
  Target, 
  Users, 
  TrendingUp, 
  ChevronRight,
  Trophy,
  Flame,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useTourLMS } from "@/contexts/TourLMSContext";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSocket } from '@/services/socketService';
import { useXP } from "@/contexts/XPContext";
import XPProgress from "@/components/xp/XPProgress";

const Dashboard = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const { enrolledCourses, CoursesHub } = useTourLMS();
  const [loading, setLoading] = useState(true);
  const { user, course, API_URL, token } = useTourLMS();
  const { userXP, awardXP } = useXP();
  const {studentStats, setStudentStats} = useTourLMS();
  const [userStats, setUserStats] = useState({
    totalXp: studentStats?.totalXp || 0,
    currentStreak: studentStats?.currentStreak || 0,
    completedLessons: 0,
    totalLessons: 0,
    completedQuizzes: 0,
    totalQuizzes: 0,
    averageScore: 0,
    lastActive: new Date(),
  });
  const [categories, setCategories] = useState([]);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const socket = useSocket();

  const { toast } = useToast();

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const courses = enrolledCourses || [];
        
        // Extract unique categories from enrolled courses
        const uniqueCategories = [...new Set(courses.map(course => (course.category || "").toLowerCase()).filter(cat => cat))];
        setCategories(uniqueCategories);

        // Update user stats
        setUserStats({
          totalXp: courses.reduce((sum, course) => sum + (course.points || 0), 0),
          currentStreak: calculateStreak(courses),
          completedLessons: courses.reduce((sum, course) => sum + (course.completedLessons || 0), 0),
          totalLessons: courses.reduce((sum, course) => sum + (course.totalLessons || 0), 0),
          completedQuizzes: courses.reduce((sum, course) => sum + (course.completedQuizzes || 0), 0),
          totalQuizzes: courses.reduce((sum, course) => sum + (course.totalQuizzes || 0), 0),
          lastActive: new Date(courses[0]?.lastAccessedAt || new Date()),
        });

        // Find related courses
        const enrolledCourseIds = new Set(courses.map(course => course._id));
        const related = CoursesHub.filter(course => 
          !enrolledCourseIds.has(course._id) && 
          uniqueCategories.includes((course.category || "").toLowerCase())
        ).slice(0, 3);
        setRelatedCourses(related);

        // Calculate recent activities
        const activities = [];
        courses.forEach(course => {
          const enrollment = course.enrollment || {};
          const moduleProgress = enrollment.moduleProgress || [];
          moduleProgress.forEach(module => {
            const contentProgress = module.contentProgress || [];
            contentProgress.forEach(content => {
              if (content.lastAccessedAt && content.completed) {
                activities.push({
                  courseTitle: course.title,
                  contentTitle: content.contentId,
                  lastAccessedAt: new Date(content.lastAccessedAt)
                });
              }
            });
          });
        });
        activities.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
        setRecentActivities(activities.slice(0, 3));
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        toast({
          title: "Failed to load courses",
          description: "There was an error loading your enrolled courses",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEnrolledCourses();
  }, [enrolledCourses, CoursesHub, token, toast, user.id]);

  useEffect(() => {
    if (!socket) return;

    socket.on('challenge:stats', (stats) => {
      setUserStats(prev => ({
        ...prev,
        ...stats
      }));
    });

    return () => {
      socket.off('challenge:stats');
    };
  }, [socket]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await fetch(`${API_URL}/users/${user._id}/stats`, {
          headers: {
            "x-auth-token": token,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user stats");
        }

        const stats = await response.json();
        setUserStats({
          ...stats,
          totalXp: userXP?.totalXP || 0,
        });

        // Award XP for daily login if not already awarded today
        const lastLogin = new Date(stats.lastActive);
        const today = new Date();
        if (lastLogin.toDateString() !== today.toDateString()) {
          await awardXP(user._id, 'DAILY_LOGIN');
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };

    if (user?._id) {
      //fetchUserStats();
    }
  }, [user?._id, API_URL, token, userXP, awardXP]);

  const calculateStreak = (courses) => {
    if (!courses || courses.length === 0) return 0;
    
    const sortedCourses = [...courses].sort((a, b) => {
      const dateA = new Date(a.lastAccessedAt || 0);
      const dateB = new Date(b.lastAccessedAt || 0);
      return dateB - dateA;
    });
    
    const mostRecent = new Date(sortedCourses[0].lastAccessedAt || 0);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = mostRecent.toDateString() === today.toDateString();
    const isYesterday = mostRecent.toDateString() === yesterday.toDateString();
    
    if (isToday || isYesterday) {
      return Math.max(1, Math.min(courses.length * 2, 8));
    }
    
    return 0;
  };

  const filteredCourses = activeCategory === "all" 
    ? enrolledCourses 
    : enrolledCourses.filter(course => (course.category || "").toLowerCase().includes(activeCategory));

  const formatDate = (date) => {
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };
  
  return (
    <div className="space-y-8 mt-16">
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to African Intelligence</h1>
            <p className="text-red-100 max-w-xl">
              Your journey into advanced AI education continues. Track your progress, join events, and connect with fellow learners.
            </p>
          </div>
          <Button 
            className="bg-white text-red-600 hover:bg-red-50"
            onClick={() => window.location.href = "/student/courses"}
          >
            Browse More Courses
          </Button>
        </div>
      </section>
      
      {/* Progress Overview */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
                  <Trophy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total XP</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-50">
                    {userXP?.totalXP || 0}
                  </p>
                  <Progress value={userXP ? (userXP.totalXP / (userXP.nextLevelXP + userXP.totalXP)) * 100 : 0} className="mt-2" />
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-xl">
                  <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Progress</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-50">
                    {userStats.totalLessons > 0 
                      ? Math.round((userStats.completedLessons / userStats.totalLessons) * 100)
                      : 0}%
                  </p>
                  <Progress 
                    value={userStats.totalLessons > 0 
                      ? (userStats.completedLessons / userStats.totalLessons) * 100 
                      : 0} 
                    className="mt-2" 
                  />
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded-xl">
                  <Flame className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Current Streak</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-50">{userStats.currentStreak} days</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Keep it up!</p>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-xl">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Challenges</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-50">0/1</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Completed</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.section>
      
      {/* XP Progress Section */}
        <XPProgress userId={user?._id} />
      
      {/* Course Progress Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Learning Journey</h2>
            <p className="text-gray-500 dark:text-gray-400">Continue where you left off</p>
          </div>
          
          {categories.length <= 3 ? (
            <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex-wrap gap-y-2">
              <button 
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeCategory === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                onClick={() => setActiveCategory('all')}
              >
                All
              </button>
              {categories.map(category => (
                <button 
                  key={category}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${activeCategory === category ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : (
            <Select onValueChange={setActiveCategory} value={activeCategory}>
              <SelectTrigger className="w-[180px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden h-full flex flex-col animate-pulse">
                <div className="h-36 bg-slate-200 dark:bg-slate-700"></div>
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="pt-2 flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mt-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mt-2"></div>
                  </div>
                  <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </Card>
            ))
          ) : filteredCourses.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No courses found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {activeCategory === 'all' 
                  ? "You haven't enrolled in any courses yet." 
                  : `You don't have any ${activeCategory} courses yet.`}
              </p>
              <Button className="mt-4 bg-red-600 hover:bg-red-700">
                <Link to="/student/courses">Browse Courses</Link>
              </Button>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <motion.div
                key={course._id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={`/student/courses/${course._id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                    <div className="h-36 relative">
                      <img 
                        src={course.thumbnail || `https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80`}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                        <p className="p-3 text-white font-semibold line-clamp-1">{course.title}</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3 flex-1 flex flex-col">
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Progress</span>
                        <span>{course.progress || 0}%</span>
                      </div>
                      <Progress value={course.progress || 0} className="h-2" />
                      <div className="pt-2 flex-1">
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Next: {course.nextModule || "Start learning"}
                          </p>
                        </div>
                        <div className="flex items-start gap-2 mt-2">
                          <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Instructor: {course.facilitatorName || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <Button className="w-full mt-2 bg-red-600 hover:bg-red-700">
                        Continue Learning
                      </Button>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </section>
      
      {/* Related Courses and Recent Activities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="h-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Explore Related Courses</h2>
              <div className="space-y-4">
                {relatedCourses.length === 0 ? (
                  <div className="text-center py-4">
                    <BookOpen className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No related courses found.</p>
                  </div>
                ) : (
                  relatedCourses.map((course, index) => (
                    <motion.div
                      key={course._id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link to={`/student/courses/${course._id}`}>
                        <div className="flex items-start gap-4 pb-4 border-b last:border-0 border-gray-100 dark:border-gray-800">
                          <div className="h-16 w-16 relative flex-shrink-0">
                            <img 
                              src={course.thumbnail || `https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80`}
                              alt={course.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{course.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{course.shortDescription || "No description available."}</p>
                            <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <Users className="h-4 w-4 mr-1" />
                              <span>Instructor: {course.facilitatorName || "Unknown"}</span>
                            </div>
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="ml-auto border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            Enroll
                          </Button>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
        
        <Card className="h-full">
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Activities</h2>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent activities.</p>
                </div>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 border-gray-100 dark:border-gray-800">
                    <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl text-blue-600 dark:text-blue-400">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        Completed <span className="font-medium">{activity.contentTitle}</span> in <span className="font-medium">{activity.courseTitle}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(activity.lastAccessedAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;