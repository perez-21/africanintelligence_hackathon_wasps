
import { useTourLMS } from '@/contexts/TourLMSContext';

// Create a singleton socket service to be used across the app
class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.connected = false;
  }

  initialize(socket) {
    if (!socket) return;
    
    this.socket = socket;
    this.connected = true;
    
    // Set up default listeners
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      this.connected = false;
    });
    
    // Setup listeners for forum activities
    this.setupForumListeners();
  }

  setupForumListeners() {
    if (!this.socket) return;

    // Listen for new forum posts
    this.socket.on('forum:new_post', (data) => {
      if (this.listeners['forum:new_post']) {
        this.listeners['forum:new_post'].forEach(callback => callback(data));
      }
    });

    // Listen for new comments
    this.socket.on('forum:new_comment', (data) => {
      if (this.listeners['forum:new_comment']) {
        this.listeners['forum:new_comment'].forEach(callback => callback(data));
      }
    });
    
    // Listen for post updates (edits, likes, etc.)
    this.socket.on('forum:post_updated', (data) => {
      if (this.listeners['forum:post_updated']) {
        this.listeners['forum:post_updated'].forEach(callback => callback(data));
      }
    });
  }

  // Add a listener for an event
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // If the socket is active and this is a custom event, add the native listener
    if (this.socket && !event.startsWith('forum:')) {
      this.socket.on(event, callback);
    }
    
    // Return a function to remove this specific listener
    return () => this.off(event, callback);
  }

  // Remove a specific listener for an event
  off(event, callbackToRemove) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(
      callback => callback !== callbackToRemove
    );
    
    // If this is a custom event, remove from socket too
    if (this.socket && !event.startsWith('forum:')) {
      this.socket.off(event, callbackToRemove);
    }
  }

  // Join a room (useful for course-specific forums)
  joinRoom(roomId) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('join_room', roomId);
  }

  // Leave a room
  leaveRoom(roomId) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('leave_room', roomId);
  }

  // Emit an event to the server
  emit(event, data) {
    if (!this.socket || !this.connected) return;
    this.socket.emit(event, data);
  }

  // Send a new forum post
  sendForumPost(postData) {
    this.emit('forum:create_post', postData);
  }
  
  // Comment on a forum post
  sendForumComment(postId, commentData) {
    this.emit('forum:create_comment', { postId, ...commentData });
  }
  
  // Like or unlike a post
  togglePostLike(postId) {
    this.emit('forum:toggle_like', { postId });
  }
  
  // Get socket connection status
  isConnected() {
    return this.connected;
  }
}

// Create a singleton instance
export const socketService = new SocketService();

// Custom hook to use the socket service
export const useSocket = () => {
  const { socket } = useTourLMS();
  
  if (socket && !socketService.socket) {
    socketService.initialize(socket);
  }
  
  return socketService;
};


