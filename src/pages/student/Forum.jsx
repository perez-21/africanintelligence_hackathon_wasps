// import React, { useState, useEffect } from 'react';
// import { io } from 'socket.io-client';
// // import { forumTopics, forumUsers } from './forumData';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";

// import { Search, MessageCircle, Users, TrendingUp } from 'lucide-react';
// import ForumCategories from '@/components/forum/ForumCategories';
// import ForumTopics from '@/components/forum/ForumTopics';
// import ForumGuidelinesModal from '@/components/forum/ForumGuidelinesModal';
// import { getCommunityForum, getForumCategories, togglePostLike } from '@/api/forumService';
// import { useTourLMS } from '@/contexts/TourLMSContext';
// import { useToast } from '@/hooks/use-toast';
// import { clg } from '../../lib/basic';

// const Forum = () => {
//   const { user, token } = useTourLMS();
//   const { toast } = useToast();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [categories, setCategories] = useState([]);
//   const [posts, setPosts] = useState([]);
//   const [stats, setStats] = useState({ totalTopics: 0, totalPosts: 0, activeUsers: 0, onlineNow: 0 });
//   const [loading, setLoading] = useState(true);
//   const [socket, setSocket] = useState(null);
//   const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

//   // Fetch forum data (categories, posts, and stats)
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const [categoriesData, postsData] = await Promise.all([
//           getForumCategories(token),
//           getCommunityForum(token),
//         ]);

//         clg([categoriesData,postsData])
//         setCategories(categoriesData);
//         setPosts(postsData.posts || []);

//         // Calculate forum stats
//         const totalTopics = postsData.posts?.length || 0;
//         const totalPosts = postsData.posts?.reduce((acc, post) => acc + (post.comments?.length || 0), 0) || 0;
//         const activeUsers = new Set(postsData.posts?.map(post => post.author?._id)).size || 0;
//         const onlineNow = 42; // This could be fetched via socket or another API if available

//         setStats({ totalTopics, totalPosts, activeUsers, onlineNow });
//       } catch (error) {
//         console.error('Error fetching forum data:', error);
//         toast({
//           title: 'Error',
//           description: 'Failed to load forum data. Please try again.',
//           variant: 'destructive',
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (token) {
//       fetchData();
//     }
//   }, [token, toast]);

//   // Set up socket.io for real-time updates
//   useEffect(() => {
//     if (!token) return;

//     const socketInstance = io('https://africanapi.onrender.com', {
//       auth: { token },
//     });

//     socketInstance.on('connect', () => {
//       console.log('Connected to socket server');
//       socketInstance.emit('join_room', 'forum:community');
//     });

//     // Listen for new posts
//     socketInstance.on('forum:new_community_post', (newPost) => {
//       setPosts(prevPosts => [newPost, ...prevPosts]);
//       setStats(prevStats => ({
//         ...prevStats,
//         totalTopics: prevStats.totalTopics + 1,
//       }));
//     });

//     // Listen for new comments
//     socketInstance.on('forum:new_community_comment', ({ postId, comment }) => {
//       setPosts(prevPosts =>
//         prevPosts.map(post =>
//           post._id === postId
//             ? { ...post, comments: [...(post.comments || []), comment] }
//             : post
//         )
//       );
//       setStats(prevStats => ({
//         ...prevStats,
//         totalPosts: prevStats.totalPosts + 1,
//       }));
//     });

//     // Listen for post updates (e.g., likes)
//     socketInstance.on('forum:community_post_updated', ({ _id }) => {
//       setPosts(prevPosts =>
//         prevPosts.map(async post => {
//           if (post._id === _id) {
//             const updatedPost = await getForumPost(_id, token);
//             return updatedPost;
//           }
//           return post;
//         })
//       );
//     });

//     setSocket(socketInstance);

//     return () => {
//       socketInstance.disconnect();
//     };
//   }, [token]);

//   // Handle like/unlike post
//   const handleLikePost = async (postId) => {
//     try {
//       const updatedPost = await togglePostLike(postId, token);
//       setPosts(prevPosts =>
//         prevPosts.map(post =>
//           post._id === postId ? { ...post, likes: updatedPost.likes } : post
//         )
//       );

//       // Emit socket event for real-time update
//       socket?.emit('forum:toggle_like', { postId, courseId: null });
//     } catch (error) {
//       console.error('Error toggling like:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to toggle like. Please try again.',
//         variant: 'destructive',
//       });
//     }
//   };

//   return (
//     <div className="container mx-auto p-6">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
//         <div>
//           <h1 className="text-2xl font-bold mb-2">Course Forum</h1>
//           <p className="text-gray-600">Connect with fellow students and instructors</p>
//         </div>
        
//         <div className="w-full md:w-72">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//             <Input 
//               className="pl-10" 
//               placeholder="Search forum..." 
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//         </div>
//       </div>
      
//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
//         <Card className="col-span-1 lg:col-span-3 bg-red-50 border-red-100">
//           <CardContent className="p-6">
//             <div className="flex items-start gap-4">
//               <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
//                 <MessageCircle className="h-6 w-6 text-red-600" />
//               </div>
//               <div>
//                 <h2 className="text-lg font-semibold mb-1">Welcome to our Course Forum</h2>
//                 <p className="text-gray-600 mb-3">
//                   This is a space for students and instructors to interact, ask questions, 
//                   and share knowledge. Please remember to be respectful and supportive.
//                 </p>
//                 <Button 
//                   size="sm"
//                   onClick={() => setIsGuidelinesOpen(true)}
//                 >
//                   Forum Guidelines
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-6">
//             <h3 className="font-semibold mb-4 flex items-center gap-2">
//               <TrendingUp className="h-4 w-4 text-red-500" />
//               Forum Stats
//             </h3>
//             <div className="space-y-3">
//               <div className="flex justify-between items-center">
//                 <span className="text-sm text-gray-600">Total Topics:</span>
//                 <Badge variant="outline">{stats.totalTopics}</Badge>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-sm text-gray-600">Total Posts:</span>
//                 <Badge variant="outline">{stats.totalPosts}</Badge>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-sm text-gray-600">Active Users:</span>
//                 <Badge variant="outline">{stats.activeUsers}</Badge>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-sm text-gray-600">Online Now:</span>
//                 <Badge className="bg-green-100 text-green-800">{stats.onlineNow}</Badge>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
      
//       <Tabs defaultValue="categories" className="space-y-6">
//         <TabsList>
//           <TabsTrigger value="categories">Categories</TabsTrigger>
//           <TabsTrigger value="recent">Recent Discussions</TabsTrigger>
//           <TabsTrigger value="popular">Popular Topics</TabsTrigger>
//           <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
//         </TabsList>
        
//         <TabsContent value="categories">
//           <ForumCategories categories={categories} />
//         </TabsContent>
        
//         <TabsContent value="recent">
//           <ForumTopics
//             categoryTitle="Recent Discussions"
//             posts={posts}
//             searchQuery={searchQuery}
//             onLikePost={handleLikePost}
//             currentUserId={user?._id}
//             socket={socket}
//           />
//         </TabsContent>
        
//         <TabsContent value="popular">
//           <ForumTopics
//             categoryTitle="Popular Topics"
//             posts={posts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))}
//             searchQuery={searchQuery}
//             onLikePost={handleLikePost}
//             currentUserId={user?._id}
//             socket={socket}
//           />
//         </TabsContent>
        
//         <TabsContent value="unanswered">
//           <ForumTopics
//             categoryTitle="Unanswered Questions"
//             posts={posts.filter(post => !post.comments || post.comments.length === 0)}
//             searchQuery={searchQuery}
//             onLikePost={handleLikePost}
//             currentUserId={user?._id}
//             socket={socket}
//           />
//         </TabsContent>
//       </Tabs>
//       <ForumGuidelinesModal
//         isOpen={isGuidelinesOpen}
//         onClose={() => setIsGuidelinesOpen(false)}
//       />
//     </div>
//   );
// };

// export default Forum;

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { forumTopics as mockTopics, forumUsers as mockUsers, forumCategories as mockCategories } from '../../data/forumData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Search, MessageCircle, Users, TrendingUp } from 'lucide-react';
import ForumCategories from '@/components/forum/ForumCategories';
import ForumTopics from '@/components/forum/ForumTopics';
import ForumGuidelinesModal from '@/components/forum/ForumGuidelinesModal';
import { getCommunityForum, getForumCategories, togglePostLike } from '@/api/forumService';
import { useTourLMS } from '@/contexts/TourLMSContext';
import { useToast } from '@/hooks/use-toast';
import { clg } from '../../lib/basic';

const Forum = () => {
  const { user, token } = useTourLMS();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ totalTopics: 0, totalPosts: 0, activeUsers: 0, onlineNow: 0 });
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [useMockData, setUseMockData] = useState(false); // Add state for mock data toggle

  // Fetch forum data (categories, posts, and stats)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (useMockData) {
          // Use mock data
          setCategories(mockCategories);
          setPosts(mockTopics);
          
          const totalTopics = mockTopics.length;
          const totalPosts = mockTopics.reduce((acc, topic) => acc + (topic.comments?.length || 0), 0);
          const activeUsers = new Set(mockTopics.map(topic => topic.author)).size;
          const onlineNow = 42;
          
          setStats({ totalTopics, totalPosts, activeUsers, onlineNow });
        } else {
          // Fetch real data
          const [categoriesData, postsData] = await Promise.all([
            getForumCategories(token),
            getCommunityForum(token),
          ]);

          clg([categoriesData, postsData]);
          setCategories(categoriesData);
          setPosts(postsData.posts || []);

          // Calculate forum stats
          const totalTopics = postsData.posts?.length || 0;
          const totalPosts = postsData.posts?.reduce((acc, post) => acc + (post.comments?.length || 0), 0) || 0;
          const activeUsers = new Set(postsData.posts?.map(post => post.author?._id)).size || 0;
          const onlineNow = 42;

          setStats({ totalTopics, totalPosts, activeUsers, onlineNow });
        }
      } catch (error) {
        console.error('Error fetching forum data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load forum data. Please try again.',
          variant: 'destructive',
        });
        
        // Fallback to mock data if API fails
        setUseMockData(true);
      } finally {
        setLoading(false);
      }
    };

    if (token || useMockData) {
      fetchData();
    }
  }, [token, toast, useMockData]);

  // Set up socket.io for real-time updates (skip if using mock data)
  useEffect(() => {
    if (!token || useMockData) return;

    const socketInstance = io('http://localhost:3031', {
      auth: { token },
    });

    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      socketInstance.emit('join_room', 'forum:community');
    });

    socketInstance.on('forum:new_community_post', (newPost) => {
      setPosts(prevPosts => [newPost, ...prevPosts]);
      setStats(prevStats => ({
        ...prevStats,
        totalTopics: prevStats.totalTopics + 1,
      }));
    });

    socketInstance.on('forum:new_community_comment', ({ postId, comment }) => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, comments: [...(post.comments || []), comment] }
            : post
        )
      );
      setStats(prevStats => ({
        ...prevStats,
        totalPosts: prevStats.totalPosts + 1,
      }));
    });

    socketInstance.on('forum:community_post_updated', ({ _id }) => {
      setPosts(prevPosts =>
        prevPosts.map(async post => {
          if (post._id === _id) {
            const updatedPost = await getForumPost(_id, token);
            return updatedPost;
          }
          return post;
        })
      );
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, useMockData]);

  // Handle like/unlike post
  const handleLikePost = async (postId) => {
    try {
      if (useMockData) {
        // Mock like functionality
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post.id === postId) {
              const hasLiked = post.votes.some(vote => vote.userId === 'current-user');
              return {
                ...post,
                votes: hasLiked
                  ? post.votes.filter(vote => vote.userId !== 'current-user')
                  : [...post.votes, { userId: 'current-user', vote: 'upvote' }]
              };
            }
            return post;
          })
        );
      } else {
        const updatedPost = await togglePostLike(postId, token);
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId ? { ...post, likes: updatedPost.likes } : post
          )
        );

        // Emit socket event for real-time update
        socket?.emit('forum:toggle_like', { postId, courseId: null });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle like. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Function to map mock users to posts and comments
  const mapMockUsers = (items) => {
    return items.map(item => {
      const authorData = mockUsers.find(user => user.id === item.author);
      const comments = item.comments?.map(comment => {
        const commentAuthor = mockUsers.find(user => user.id === comment.author);
        return {
          ...comment,
          author: {
            _id: comment.author,
            name: commentAuthor?.name || 'Unknown',
            avatar: commentAuthor?.avatar,
            role: commentAuthor?.role
          },
          replies: comment.replies?.map(reply => {
            const replyAuthor = mockUsers.find(user => user.id === reply.author);
            return {
              ...reply,
              author: {
                _id: reply.author,
                name: replyAuthor?.name || 'Unknown',
                avatar: replyAuthor?.avatar,
                role: replyAuthor?.role
              }
            };
          })
        };
      });
      
      return {
        ...item,
        _id: item.id,
        author: {
          _id: item.author,
          name: authorData?.name || 'Unknown',
          avatar: authorData?.avatar,
          role: authorData?.role
        },
        likes: item.votes?.map(vote => vote.userId) || [],
        comments
      };
    });
  };

  // Get the posts to display (either from API or mock data)
  const displayPosts = useMockData ? mapMockUsers(mockTopics) : posts;

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Course Forum</h1>
          <p className="text-gray-600">Connect with fellow students and instructors</p>
        </div>
        
        <div className="flex gap-4">
          <div className="w-full md:w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                className="pl-10" 
                placeholder="Search forum..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setUseMockData(!useMockData)}
            className="hidden md:block"
          >
            {useMockData ? 'Use Real Data' : 'Use Mock Data'}
          </Button>
        </div>
      </div>
      
      {useMockData && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
          You are currently viewing mock data. Switch to real data when API is available.
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="col-span-1 lg:col-span-3 bg-red-50 border-red-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                <MessageCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1">Welcome to our Course Forum</h2>
                <p className="text-gray-600 mb-3">
                  This is a space for students and instructors to interact, ask questions, 
                  and share knowledge. Please remember to be respectful and supportive.
                </p>
                <Button 
                  size="sm"
                  onClick={() => setIsGuidelinesOpen(true)}
                >
                  Forum Guidelines
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              Forum Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Topics:</span>
                <Badge variant="outline">{stats.totalTopics}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Posts:</span>
                <Badge variant="outline">{stats.totalPosts}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users:</span>
                <Badge variant="outline">{stats.activeUsers}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Online Now:</span>
                <Badge className="bg-green-100 text-green-800">{stats.onlineNow}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="recent">Recent Discussions</TabsTrigger>
          <TabsTrigger value="popular">Popular Topics</TabsTrigger>
          <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <ForumCategories 
            categories={useMockData ? mockCategories : categories} 
          />
        </TabsContent>
        
        <TabsContent value="recent">
          <ForumTopics
            categoryTitle="Recent Discussions"
            posts={displayPosts}
            searchQuery={searchQuery}
            onLikePost={handleLikePost}
            currentUserId={user?._id || 'current-user'}
            socket={socket}
          />
        </TabsContent>
        
        <TabsContent value="popular">
          <ForumTopics
            categoryTitle="Popular Topics"
            posts={[...displayPosts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))}
            searchQuery={searchQuery}
            onLikePost={handleLikePost}
            currentUserId={user?._id || 'current-user'}
            socket={socket}
          />
        </TabsContent>
        
        <TabsContent value="unanswered">
          <ForumTopics
            categoryTitle="Unanswered Questions"
            posts={displayPosts.filter(post => !post.comments || post.comments.length === 0)}
            searchQuery={searchQuery}
            onLikePost={handleLikePost}
            currentUserId={user?._id || 'current-user'}
            socket={socket}
          />
        </TabsContent>
      </Tabs>
      
      <ForumGuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </div>
  );
};

export default Forum;