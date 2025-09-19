import React, { useState, useEffect, useRef } from 'react';
import { useTourLMS } from '@/contexts/TourLMSContext';
import { trackVideoWatchTime } from '@/api/courseService';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

// Utility function to debounce a callback
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Utility function to normalize Google Drive URL for better streaming
const normalizeGoogleDriveUrl = (url) => {
  if (!url.includes('drive.google.com')) return url;

  const urlObj = new URL(url);
  const videoIdMatch = urlObj.search.match(/id=([^&]+)/);
  if (videoIdMatch && videoIdMatch[1]) {
    const videoId = videoIdMatch[1];
    return `https://drive.google.com/uc?export=download&confirm=1&id=${videoId}`;
  }
  return url;
};

const VideoPlayer = ({ 
  videoUrl, 
  courseId, 
  moduleId, 
  contentId,
  videoTitle,
  videoDescription,
  onWatchProgress,
  onClose,
  requiredWatchPercent = 70
}) => {
  const { token, API_URL } = useTourLMS();
  const { toast } = useToast();
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  
  const [isYouTube, setIsYouTube] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [watchTime, setWatchTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchPercent, setWatchPercent] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [videoError, setVideoError] = useState(null);

  // Local storage key for storing watch time
  const localStorageKey = `watchTime_${courseId}_${moduleId}_${contentId}`;
  const normalizedVideoUrl = normalizeGoogleDriveUrl(videoUrl);

  // Cleanup function
  const cleanup = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  };

  // Load saved watch time
  useEffect(() => {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      setWatchTime(parseFloat(saved));
    }
  }, [localStorageKey]);

  // Check if URL is YouTube and extract video ID
  useEffect(() => {
    const checkYouTubeUrl = (url) => {
      if (!url) return false;
      
      const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          setYoutubeVideoId(match[1]);
          return true;
        }
      }
      return false;
    };
    
    setIsYouTube(checkYouTubeUrl(videoUrl));
  }, [videoUrl]);

  // Reset states when video changes
  useEffect(() => {
    cleanup();
    setWatchTime(0);
    setWatchPercent(0);
    setCurrentTime(0);
    setHasCompleted(false);
    setVideoError(null);
  }, [videoUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = null;
      }
    };
  }, []);

  // Call onWatchProgress when completed
  useEffect(() => {
    if (hasCompleted && onWatchProgress) {
      onWatchProgress(true);
    }
  }, [hasCompleted, onWatchProgress]);

  // Anti-cheat: Handle fast-forward detection
  const handleFastForward = (newTime, isYouTubeVideo) => {
    const timeDifference = newTime - currentTime;
    const maxAllowedJump = 60;

    if (timeDifference > maxAllowedJump && newTime > currentTime) {
      toast({
        title: "Fast-Forward Not Allowed",
        description: "Fast-forwarding is not permitted. The video will restart.",
        variant: "destructive",
      });

      if (isYouTubeVideo && playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.pauseVideo();
      } else if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      }

      setWatchTime(0);
      setWatchPercent(0);
      setCurrentTime(0);
      setHasCompleted(false);
      localStorage.setItem(localStorageKey, '0');
    } else {
      setCurrentTime(newTime);
    }
  };

  // Update watch time and check completion
  const updateWatchTime = (videoDuration) => {
    setWatchTime(prev => {
      const newWatchTime = prev + 5;
      const percent = videoDuration > 0 ? (newWatchTime / videoDuration) * 100 : 0;
      setWatchPercent(percent);
      
      localStorage.setItem(localStorageKey, newWatchTime.toString());

      // Check if content should be completed
      if (percent >= requiredWatchPercent && !hasCompleted) {
        setHasCompleted(true);
        markContentAsCompleted(newWatchTime, videoDuration);
      }

      return newWatchTime;
    });
  };

  // Mark content as completed and send watch time to server
  const markContentAsCompleted = async (finalWatchTime, videoDuration) => {
    try {
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please login to track your progress",
          variant: "destructive",
        });
        return;
      }

      // Send watch time to server only when completing
      await trackVideoWatchTime(
        courseId,
        moduleId,
        contentId,
        finalWatchTime,
        videoDuration,
        token
      );

      // Mark as completed
      const response = await fetch(`${API_URL}/learner/courses/${courseId}/modules/${moduleId}/contents/${contentId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark content as completed');
      }

      toast({
        title: "Video completed!",
        description: "You have successfully completed this video.",
        variant: "default",
      });

      // Clear local storage since it's now synced
      localStorage.removeItem(localStorageKey);

    } catch (error) {
      console.error('Error completing content:', error);
      toast({
        title: "Error",
        description: "Failed to update progress. Your progress is saved locally.",
        variant: "destructive",
      });
    }
  };

  // YouTube setup
  useEffect(() => {
    if (isYouTube && !window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, document.getElementsByTagName('script')[0]);

      window.onYouTubeIframeAPIReady = () => {
        initializeYouTubePlayer();
      };
    } else if (isYouTube && window.YT) {
      initializeYouTubePlayer();
    }
  }, [isYouTube, youtubeVideoId]);

  const initializeYouTubePlayer = () => {
    try {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: youtubeVideoId,
        playerVars: {
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            const videoDuration = event.target.getDuration();
            if (videoDuration > 0) {
              setDuration(videoDuration);
              startTracking(videoDuration, true);
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              const newTime = playerRef.current.getCurrentTime();
              handleFastForward(newTime, true);
            }
          },
          onError: (event) => {
            setVideoError(`YouTube Error: ${event.data}`);
            toast({
              title: "YouTube Error",
              description: "Unable to load the video.",
              variant: "destructive",
            });
          },
        },
      });
    } catch (error) {
      setVideoError("Failed to initialize YouTube player.");
    }
  };

  // Regular video setup
  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        const videoDuration = video.duration;
        if (videoDuration > 0) {
          setDuration(videoDuration);
          startTracking(videoDuration, false);
        }
      };

      const debouncedTimeUpdate = debounce(() => {
        handleFastForward(video.currentTime, false);
      }, 1000);

      const handleError = () => {
        const errorMsg = videoUrl.includes('drive.google.com') 
          ? "Google Drive video failed to load. The link may be restricted."
          : "Video playback error occurred.";
        
        setVideoError(errorMsg);
        toast({
          title: "Video Error",
          description: errorMsg,
          variant: "destructive",
        });
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', debouncedTimeUpdate);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', debouncedTimeUpdate);
        video.removeEventListener('error', handleError);
      };
    }
  }, [isYouTube, videoUrl]);

  // Start tracking watch time
  const startTracking = (videoDuration, isYouTubeVideo) => {
    cleanup(); // Clear any existing interval

    trackingIntervalRef.current = setInterval(() => {
      let isPlaying = false;
      
      if (isYouTubeVideo && playerRef.current) {
        isPlaying = playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING;
      } else if (videoRef.current) {
        isPlaying = !videoRef.current.paused;
      }

      if (isPlaying && !hasCompleted) {
        updateWatchTime(videoDuration);
      }
    }, 5000);
  };

  const getProgressBarColor = () => {
    if (watchPercent >= 90) return 'bg-green-500';
    if (watchPercent >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (videoError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{videoError}</p>
        <p className="text-sm text-gray-600 mt-2">
          Please try a different video or contact support if this issue persists.
        </p>
        {videoUrl.includes('youtube') && (
          <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            Open in YouTube
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Progress Bar */}
      <div className="w-full h-3 rounded-full overflow-hidden bg-gray-200/30 backdrop-blur-sm mb-4">
        <div
          className={`h-full rounded-full ${getProgressBarColor()} transition-all duration-500 ease-in-out`}
          style={{ width: `${Math.min(watchPercent, 100)}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold">{videoTitle || "Video Content"}</h2>
          <p className="text-sm text-gray-600">{videoDescription || "No description available."}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Video Player */}
      {isYouTube && youtubeVideoId ? (
        <div className="aspect-video w-full rounded-md overflow-hidden">
          <div id="youtube-player" className="w-full h-full" />
          {watchPercent > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${watchPercent >= requiredWatchPercent ? 'bg-green-600' : 'bg-blue-600'}`} 
                  style={{ width: `${watchPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {hasCompleted 
                  ? 'Video completed!' 
                  : `Watched ${Math.round(watchPercent)}% (${requiredWatchPercent}% required)`}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full">
          <video
            ref={videoRef}
            src={normalizedVideoUrl}
            controls
            className="w-full rounded-md"
            disablePictureInPicture
            disableRemotePlayback
            onContextMenu={(e) => e.preventDefault()}
          >
            Your browser does not support the video element.
          </video>
          {watchPercent > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${watchPercent >= requiredWatchPercent ? 'bg-green-600' : 'bg-blue-600'}`} 
                  style={{ width: `${watchPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {hasCompleted 
                  ? 'Video completed!' 
                  : `Watched ${Math.round(watchPercent)}% (${requiredWatchPercent}% required)`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;