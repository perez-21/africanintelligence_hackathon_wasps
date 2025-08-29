import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Send, Reply, ThumbsUp, Flag } from 'lucide-react';
import { useTourLMS } from '@/contexts/TourLMSContext';
import { useToast } from '@/hooks/use-toast';
import { getCourseForumPosts, createForumPost, addCommentToPost, toggleLikePost } from '@/api/forumService';
import io from 'socket.io-client';
import { badgeService } from '../../services/badgeService';

const CourseDiscussion = ({ courseId }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [discussions, setDiscussions] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(true);
  const socketRef = useRef(null);
  
  const { user, token } = useTourLMS();
  const { toast } = useToast();
  
  // Connect to socket
  useEffect(() => {
    if (!token) return;
    
    // Connect to the production server
    socketRef.current = io('https://africanapi.onrender.com', { 
      path: '/socket.io',
      auth: { token }
    });
    
    socketRef.current.on('connect', () => {
      console.log('Connected to forum socket');
      socketRef.current.emit('join-course-forum', courseId);
    });
    
    socketRef.current.on('forum-post-created', (post) => {
      if (post.course === courseId) {
        setDiscussions(prev => [post, ...prev]);
      }
    });
    
    socketRef.current.on('forum-post-commented', (updatedPost) => {
      if (updatedPost.course === courseId) {
        setDiscussions(prev => 
          prev.map(post => post._id === updatedPost._id ? updatedPost : post)
        );
        
        if (activeDiscussion?._id === updatedPost._id) {
          setActiveDiscussion(updatedPost);
        }
      }
    });
    
    socketRef.current.on('forum-post-liked', (updatedPost) => {
      if (updatedPost.course === courseId) {
        setDiscussions(prev => 
          prev.map(post => post._id === updatedPost._id ? updatedPost : post)
        );
        
        if (activeDiscussion?._id === updatedPost._id) {
          setActiveDiscussion(updatedPost);
        }
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [courseId, token]);
  
  // Fetch discussions
  useEffect(() => {
    const fetchDiscussions = async () => {
      if (!courseId || !token) {
        setIsLoadingDiscussions(false);
        return;
      }
      
      setIsLoadingDiscussions(true);
      
      try {
        const postsData = await getCourseForumPosts(courseId, token);
        setDiscussions(postsData || []);
      } catch (error) {
        console.error('Error fetching course discussions:', error);
        toast({
          title: "Error",
          description: "Failed to load course discussions.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDiscussions(false);
      }
    };
    
    fetchDiscussions();
  }, [courseId, token]);
  
  // Handle post submission
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for your post.",
        variant: "destructive",
      });
      return;
    }
    
    setIsPosting(true);
    
    try {
      const newPost = await createForumPost({
        title,
        content,
        course: courseId,
        isCommunityPost: false
      }, token);
      
      toast({
        title: "Post created",
        description: "Your discussion post has been created successfully.",
      });
      
      setTitle('');
      setContent('');
      
      // New post will be added via socket
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create discussion post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }

    badgeService.handleXpEarned(20);
  };
  
  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !activeDiscussion) {
      return;
    }
    
    setIsCommenting(true);
    
    try {
      await addCommentToPost(activeDiscussion._id, replyContent, token);
      
      toast({
        title: "Comment added",
        description: "Your reply has been posted successfully.",
      });
      
      setReplyContent('');
      
      // Updated post will be received via socket
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to post your reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCommenting(false);
    }
  };
  
  // Handle post like
  const handleLikePost = async (postId) => {
    try {
      await toggleLikePost(postId, token);
      // Updated post will be received via socket
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Error",
        description: "Failed to like the post. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // View discussion details
  const viewDiscussion = (discussion) => {
    setActiveDiscussion(discussion);
  };
  
  // Back to discussions list
  const backToDiscussions = () => {
    setActiveDiscussion(null);
    setReplyContent('');
  };
  
  // Check if user has liked a post
  const hasUserLiked = (post) => {
    return post.likes.includes(user?._id);
  };
  
  // Format the post or comment date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // If less than 24 hours ago, show relative time
    const diffMs = Date.now() - date.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);
    
    if (diffHrs < 24) {
      if (diffHrs < 1) {
        const diffMins = Math.round(diffMs / (1000 * 60));
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      }
      
      const hrs = Math.round(diffHrs);
      return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
    }
    
    // Otherwise show the date
    return date.toLocaleDateString();
  };
  
  // Render user badge based on role
  const UserRoleBadge = ({ userRole }) => {
    if (!userRole) return null;
    
    const badgeClasses = {
      facilitator: "bg-red-100 text-red-800",
      admin: "bg-purple-100 text-purple-800",
      student: "bg-blue-100 text-blue-800",
      learner: "bg-green-100 text-green-800"
    };
    
    return (
      <Badge className={badgeClasses[userRole] || "bg-gray-100 text-gray-800"}>
        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
      </Badge>
    );
  };

  return (
    <div>
      {!activeDiscussion ? (
        // Discussions List View
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold">Course Discussions</h2>
            <div className="w-full md:w-auto">
              <Input 
                placeholder="Search discussions..."
                className="w-full md:w-[250px]"
              />
            </div>
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Start a New Discussion</h3>
            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div>
                <Input
                  placeholder="Discussion title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPosting}
                />
              </div>
              <div>
                <Textarea
                  placeholder="What would you like to discuss?"
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isPosting}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isPosting}>
                  {isPosting ? "Posting..." : "Post Discussion"}
                </Button>
              </div>
            </form>
          </Card>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Discussions</h3>
            
            {isLoadingDiscussions ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading discussions...</p>
              </div>
            ) : discussions.length > 0 ? (
              discussions.map(discussion => (
                <Card 
                  key={discussion._id} 
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => viewDiscussion(discussion)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {discussion.author?.name?.charAt(0) || <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{discussion.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">
                              {discussion.author?.name || "Unknown user"}
                            </span>
                            <UserRoleBadge userRole={discussion.author?.role} />
                            <span className="text-sm text-gray-500">
                              {formatDate(discussion.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {discussion.likes.length}
                          </div>
                          <div className="flex items-center">
                            <Reply className="h-4 w-4 mr-1" />
                            {discussion.comments.length}
                          </div>
                        </div>
                      </div>
                      
                      <p className="mt-2 text-gray-700 line-clamp-2">{discussion.content}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No discussions yet. Be the first to start a discussion!</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Discussion Detail View
        <div className="space-y-6">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-4"
              onClick={backToDiscussions}
            >
              ← Back to Discussions
            </Button>
            
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {activeDiscussion.author?.name?.charAt(0) || <User className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-xl font-semibold">{activeDiscussion.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">
                          {activeDiscussion.author?.name || "Unknown user"}
                        </span>
                        <UserRoleBadge userRole={activeDiscussion.author?.role} />
                        <span className="text-sm text-gray-500">
                          {formatDate(activeDiscussion.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={hasUserLiked(activeDiscussion) ? "default" : "outline"} 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikePost(activeDiscussion._id);
                        }}
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        {activeDiscussion.likes.length}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-gray-700 whitespace-pre-line">{activeDiscussion.content}</div>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">
              Replies ({activeDiscussion.comments.length})
            </h4>
            
            {activeDiscussion.comments.length > 0 ? (
              activeDiscussion.comments.map((comment, index) => (
                <Card key={index} className="p-4 ml-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {comment.author?.name?.charAt(0) || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {comment.author?.name || "Unknown user"}
                        </span>
                        <UserRoleBadge userRole={comment.author?.role} />
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      
                      <p className="mt-2 text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center py-4 text-gray-500">
                No replies yet. Be the first to reply!
              </p>
            )}
            
            <Card className="p-4">
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.name?.charAt(0) || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write your reply..."
                      rows={3}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      disabled={isCommenting}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isCommenting || !replyContent.trim()}
                  >
                    {isCommenting ? (
                      "Posting..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" /> 
                        Post Reply
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDiscussion;
