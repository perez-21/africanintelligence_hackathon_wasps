import React, { useState, useEffect, useRef } from 'react';
import { useTourLMS } from '@/contexts/TourLMSContext';
import { trackVideoWatchTime } from '@/api/courseService';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { clg } from '../../lib/basic';

// Utility function for exponential backoff retry
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

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
    // Add confirm=1 to bypass some Google Drive restrictions
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
  const { token, API_URL, setToken } = useTourLMS();
  const { toast } = useToast();
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isYouTube, setIsYouTube] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [watchTime, setWatchTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchPercent, setWatchPercent] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackingInterval, setTrackingInterval] = useState(null);
  const [hasMetRequirement, setHasMetRequirement] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [youtubeError, setYoutubeError] = useState(null);
  const [trackingFailures, setTrackingFailures] = useState(0);
  const [lastSyncedWatchTime, setLastSyncedWatchTime] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(true);
  const [videoError, setVideoError] = useState(null);

  // Local storage key for storing watch time
  const localStorageKey = `watchTime_${courseId}_${moduleId}_${contentId}`;

  // Normalize video URL for Google Drive
  const normalizedVideoUrl = normalizeGoogleDriveUrl(videoUrl);

  // Load watch time from localStorage on mount
  useEffect(() => {
    const storedWatchTime = localStorage.getItem(localStorageKey);
    if (storedWatchTime) {
      setWatchTime(parseFloat(storedWatchTime));
      setLastSyncedWatchTime(parseFloat(storedWatchTime));
    }
  }, [localStorageKey]);

  // Check if the URL is a YouTube URL and extract the video ID
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

  // Check enrollment status on mount
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!token || !courseId) return;
      try {
        const response = await fetch(`${API_URL}/learner/courses/${courseId}/enrollment`, {
          headers: {
            'x-auth-token': token,
          },
        });
        if (response.status === 403 || response.status === 404) {
          setIsEnrolled(false);
          toast({
            title: "Enrollment Issue",
            description: "You are not enrolled in this course. Please enroll to track your progress.",
            variant: "destructive",
          });
        } else if (!response.ok) {
          throw new Error('Failed to check enrollment');
        }
      } catch (error) {
        console.error('Error checking enrollment:', error);
        setIsEnrolled(false);
        toast({
          title: "Enrollment Check Failed",
          description: "Unable to verify enrollment status. Progress will be saved locally.",
          variant: "destructive",
        });
      }
    };

    // checkEnrollment(); // Commented out as per your code
  }, [courseId, token, API_URL, toast]);

  // Call onWatchProgress when hasMetRequirement changes to true
  useEffect(() => {
    if (hasMetRequirement && onWatchProgress) {
      onWatchProgress(true);
    }
  }, [hasMetRequirement, onWatchProgress]);

  // Reset states when videoUrl changes
  useEffect(() => {
    setWatchTime(0);
    setWatchPercent(0);
    setCurrentTime(0);
    setHasMetRequirement(false);
    setIsSent(false);
    setVideoError(null);
  }, [videoUrl]);

  // Load YouTube IFrame API script
  useEffect(() => {
    if (isYouTube && !window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializeYouTubePlayer();
      };
    } else if (isYouTube && window.YT) {
      initializeYouTubePlayer();
    }

    return () => {
      if (trackingInterval) clearInterval(trackingInterval);
    };
  }, [isYouTube, youtubeVideoId]);

  // Function to handle fast-forward detection and reset
  const handleFastForward = (newTime, isYouTubeVideo) => {
    const timeDifference = newTime - currentTime;
    const maxAllowedJump = 60;
    const elapsedSinceLastUpdate = timeDifference > 0 ? timeDifference : 0;

    if (elapsedSinceLastUpdate > maxAllowedJump && newTime > currentTime) {
      toast({
        title: "Fast-Forward Not Allowed",
        description: "Fast-forwarding is not permitted. The video will restart from the beginning.",
        variant: "destructive",
      });

      if (isYouTubeVideo) {
        playerRef.current.seekTo(0);
        playerRef.current.pauseVideo();
      } else {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      }

      setWatchTime(0);
      setWatchPercent(0);
      setCurrentTime(0);
      setHasMetRequirement(false);
      setIsSent(false);
      localStorage.setItem(localStorageKey, '0');
    } else {
      setCurrentTime(newTime);
    }
  };

  // Function to track watch time for YouTube videos
  const trackYouTubeWatchTime = (initialDuration) => {
    setDuration(initialDuration - 1);
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
        setWatchTime(prev => {
          const newWatchTime = prev + 5;
          const percent = initialDuration > 0 ? (newWatchTime / (initialDuration - 1)) * 100 : 0;
          setWatchPercent(percent);
          clg('YouTube watch time update:', { watchTime: newWatchTime, percent, duration: initialDuration });

          localStorage.setItem(localStorageKey, newWatchTime.toString());

          if (percent >= requiredWatchPercent && !isSent) {
            setHasMetRequirement(true);
            markContentAsCompleted();
            setIsSent(true);
          }

          return newWatchTime;
        });
      }
    }, 5000);
    setTrackingInterval(interval);
  };

  const initializeYouTubePlayer = () => {
    try {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: youtubeVideoId,
        playerVars: {
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            const initialDuration = event.target.getDuration();
            clg('Initial duration onReady:', initialDuration);
            if (initialDuration > 0) {
              trackYouTubeWatchTime(initialDuration);
            } else {
              setTimeout(() => {
                const retryDuration = event.target.getDuration();
                clg('Retry duration after delay:', retryDuration);
                if (retryDuration > 0) {
                  trackYouTubeWatchTime(retryDuration);
                } else {
                  toast({
                    title: "Duration Unavailable",
                    description: "Unable to retrieve video duration. Progress tracking may be limited.",
                    variant: "destructive",
                  });
                }
              }, 2000);
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              const newTime = playerRef.current.getCurrentTime();
              handleFastForward(newTime, true);
            }
          },
          onError: (event) => {
            const errorMessage = `Failed to load YouTube video: Error code ${event.data}`;
            setYoutubeError(errorMessage);
            toast({
              title: "YouTube Error",
              description: "Unable to load the video. This may be due to ad blockers or network restrictions.",
              variant: "destructive",
            });
            console.warn(errorMessage);
          },
        },
      });

      const serverInterval = setInterval(async () => {
        if (!isEnrolled) return;
        if (token && courseId && moduleId && contentId && playerRef.current) {
          if (watchTime === lastSyncedWatchTime) return;

          try {
            await retryWithBackoff(() =>
              trackVideoWatchTime(
                courseId,
                moduleId,
                contentId,
                watchTime,
                duration,
                token
              )
            );
            setLastSyncedWatchTime(watchTime);
            setTrackingFailures(0);
            localStorage.removeItem(localStorageKey);
          } catch (err) {
            console.error('Error tracking watch time:', err);
            setTrackingFailures(prev => prev + 1);
            if (err.response?.status === 403) {
              setIsEnrolled(false);
              toast({
                title: "Enrollment Issue",
                description: "You are not enrolled in this course. Please enroll to track your progress.",
                variant: "destructive",
              });
            } else if (err.response?.status === 401) {
              toast({
                title: "Session Expired",
                description: "Your session has expired. Please log in again to sync your progress.",
                variant: "destructive",
              });
            } else {
              if (trackingFailures + 1 >= 3) {
                toast({
                  title: "Tracking Issue",
                  description: "Unable to sync watch time with the server. Progress is saved locally and will sync later.",
                  variant: "destructive",
                });
              }
            }
          }
        } else if (!token) {
          console.warn('No token available for tracking watch time');
          setTrackingFailures(prev => prev + 1);
          if (trackingFailures + 1 >= 3) {
            toast({
              title: "Authentication Required",
              description: "Please log in to sync your video progress.",
              variant: "destructive",
            });
          }
        }
      }, 30000);

      setTrackingInterval(serverInterval);
    } catch (error) {
      setYoutubeError("Failed to initialize YouTube player.");
      toast({
        title: "YouTube Error",
        description: "Unable to initialize the YouTube player. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Function to track watch time for non-YouTube videos
  const trackRegularVideoWatchTime = (videoDuration) => {
    setDuration(videoDuration);
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setWatchTime(prev => {
          const newWatchTime = prev + 5;
          const percent = videoDuration > 0 ? (newWatchTime / videoDuration) * 100 : 0;
          setWatchPercent(percent);
          clg('Regular video watch time update:', { watchTime: newWatchTime, percent, duration: videoDuration });

          localStorage.setItem(localStorageKey, newWatchTime.toString());

          if (percent >= requiredWatchPercent && !isSent) {
            setHasMetRequirement(true);
            markContentAsCompleted();
            setIsSent(true);
          }

          return newWatchTime;
        });
      }
    }, 5000);
    setTrackingInterval(interval);
  };

  // Set up tracking for regular videos
  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        const videoDuration = video.duration;
        clg('Regular video duration:', videoDuration);
        if (videoDuration > 0) {
          trackRegularVideoWatchTime(videoDuration);
        } else {
          toast({
            title: "Duration Unavailable",
            description: "Unable to retrieve video duration. Progress tracking may be limited.",
            variant: "destructive",
          });
        }
      };

      const debouncedHandleTimeUpdate = debounce(() => {
        const newTime = video.currentTime;
        handleFastForward(newTime, false);
      }, 1000);

      const handlePlay = () => {
        setCurrentTime(video.currentTime);
      };

      const handleError = (e) => {
        console.error("Video error:", e);
        let errorMessage = "An error occurred while playing the video.";
        
        if (videoUrl.includes('drive.google.com')) {
          errorMessage = "Video playback failed. Google Drive links may have restrictions or expired tokens.";
        }

        setVideoError(errorMessage);
        toast({
          title: "Video Playback Error",
          description: errorMessage,
          variant: "destructive",
        });

        // Attempt to reload the video
        setTimeout(() => {
          video.load();
          setVideoError(null);
          toast({
            title: "Retrying Playback",
            description: "Attempting to reload the video. Please wait.",
            variant: "default",
          });
        }, 2000);
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', debouncedHandleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('error', handleError);
      
      const interval = setInterval(async () => {
        if (!isEnrolled) return;
        if (token && courseId && moduleId && contentId) {
          if (watchTime === lastSyncedWatchTime) return;

          try {
            await retryWithBackoff(() =>
              trackVideoWatchTime(
                courseId,
                moduleId,
                contentId,
                watchTime,
                duration,
                token
              )
            );
            setLastSyncedWatchTime(watchTime);
            setTrackingFailures(0);
            localStorage.removeItem(localStorageKey);
          } catch (err) {
            console.error('Error tracking watch time:', err);
            setTrackingFailures(prev => prev + 1);
            if (err.response?.status === 403) {
              setIsEnrolled(false);
              toast({
                title: "Enrollment Issue",
                description: "You are not enrolled in this course. Please enroll to track your progress.",
                variant: "destructive",
              });
            } else if (err.response?.status === 401) {
              toast({
                title: "Session Expired",
                description: "Your session has expired. Please log in again to sync your progress.",
                variant: "destructive",
              });
            } else {
              if (trackingFailures + 1 >= 3) {
                toast({
                  title: "Tracking Issue",
                  description: "Unable to sync watch time with the server. Progress is saved locally and will sync later.",
                  variant: "destructive",
                });
              }
            }
          }
        } else if (!token) {
          console.warn('No token available for tracking watch time');
          setTrackingFailures(prev => prev + 1);
          if (trackingFailures + 1 >= 3) {
            toast({
              title: "Authentication Required",
              description: "Please log in to sync your video progress.",
              variant: "destructive",
            });
          }
        }
      }, 30000);
      
      setTrackingInterval(interval);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', debouncedHandleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('error', handleError);
        if (interval) clearInterval(interval);
      };
    }
  }, [isYouTube, courseId, moduleId, contentId, token, requiredWatchPercent, hasMetRequirement, onWatchProgress, lastSyncedWatchTime, trackingFailures, isEnrolled, videoUrl]);

  const markContentAsCompleted = async () => {
    if (hasMetRequirement) return;

    try {
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please login to track your progress",
          variant: "destructive",
        });
        return;
      }

      if (!isEnrolled) {
        toast({
          title: "Enrollment Required",
          description: "You are not enrolled in this course. Please enroll to mark content as completed.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${API_URL}/learner/courses/${courseId}/modules/${moduleId}/contents/${contentId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setIsEnrolled(false);
          toast({
            title: "Enrollment Issue",
            description: "You are not enrolled in this course. Please enroll to track your progress.",
            variant: "destructive",
          });
        } else if (response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again to sync your progress.",
            variant: "destructive",
          });
        }
        throw new Error('Failed to mark content as completed');
      }

      toast({
        title: "Video marked as completed",
        description: "You have watched enough of this video to mark it as completed.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error marking content as completed:', error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getProgressBarColor = () => {
    if (watchPercent >= 90) {
      return 'bg-green-500';
    } else if (watchPercent >= 50) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  };

  if (youtubeError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{youtubeError}</p>
        <p className="text-sm text-gray-600 mt-2">
          Please try disabling ad blockers or use a different browser. Alternatively, you can watch the video directly on YouTube.
        </p>
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          Open in YouTube
        </a>
      </div>
    );
  }

  if (videoError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{videoError}</p>
        <p className="text-sm text-gray-600 mt-2">
          If this issue persists, please try a different video host or contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Progress Bar at the Top */}
      <div className="w-full h-3 rounded-full overflow-hidden bg-gray-200/30 backdrop-blur-sm mb-4">
        <div
          className={`h-full rounded-full ${getProgressBarColor()} transition-all duration-500 ease-in-out relative overflow-hidden`}
          style={{ width: `${Math.min(watchPercent, 100)}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
        </div>
      </div>

      {/* Header with Title, Description, and Close Button */}
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
          <div
            id="youtube-player"
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-presentation"
          ></div>
          <p className="mt-2 text-sm text-gray-500">
            Note: YouTube videos are displayed via iframe. Progress tracking may be limited.
          </p>
          {watchPercent > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${watchPercent >= requiredWatchPercent ? 'bg-green-600' : 'bg-blue-600'}`} 
                  style={{ width: `${watchPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {watchPercent >= requiredWatchPercent 
                  ? 'You have watched enough of this video to mark it as completed' 
                  : `Watched ${Math.round(watchPercent)}% (${requiredWatchPercent}% required to complete)`}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full">
          <style>
            {`
              /* Hide the download button in Chrome's video controls */
              video::-webkit-media-controls-download-button {
                display: none !important;
              }
              /* Ensure other controls remain visible */
              video::-webkit-media-controls {
                display: flex !important;
              }
              video::-webkit-media-controls-play-button,
              video::-webkit-media-controls-timeline,
              video::-webkit-media-controls-current-time-display,
              video::-webkit-media-controls-time-remaining-display,
              video::-webkit-media-controls-mute-button,
              video::-webkit-media-controls-volume-slider,
              video::-webkit-media-controls-fullscreen-button {
                display: flex !important;
              }
            `}
          </style>
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
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;