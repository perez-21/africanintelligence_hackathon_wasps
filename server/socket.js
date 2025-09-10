const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { vapid_private_key } = require("./configs/config");


const setupSocket = (server, db) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Adjust based on your frontend URL for security
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, vapid_private_key);
      
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { _id: 1, name: 1, email: 1 } }
      );

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id}`);

    // Track online users per room
    const updateRoomOnlineCount = (room) => {
      const roomSockets = io.sockets.adapter.rooms.get(room);
      const count = roomSockets ? roomSockets.size : 0;
      io.to(room).emit('room:online_count', { room, count });
    };

    // Handle joining rooms
    socket.on('join_room', (room) => {
      if (!room || typeof room !== 'string') {
        socket.emit('error', { message: 'Invalid room name' });
        return;
      }

      socket.join(room);
      console.log(`User ${socket.user._id} joined room: ${room}`);
      updateRoomOnlineCount(room);
    });

    // Handle forum post creation
    socket.on('forum:create_post', (post) => {
      if (!post || !post._id || !post.title) {
        socket.emit('error', { message: 'Invalid post data' });
        return;
      }

      if (post.isCommunityPost) {
        io.to('forum:community').emit('forum:new_community_post', post);
      } else if (post.courseId) {
        io.to(`forum:course:${post.courseId}`).emit('forum:new_course_post', post);
      }
    });

    // Handle forum comment creation
    socket.on('forum:create_comment', ({ postId, courseId, comment }) => {
      if (!postId || !comment || !comment._id || !comment.content) {
        socket.emit('error', { message: 'Invalid comment data' });
        return;
      }

      if (courseId) {
        io.to(`forum:course:${courseId}`).emit('forum:new_course_comment', { postId, comment });
      } else {
        io.to('forum:community').emit('forum:new_community_comment', { postId, comment });
      }
    });

    // Handle toggling likes on a forum post
    socket.on('forum:toggle_like', ({ postId, courseId }) => {
      if (!postId) {
        socket.emit('error', { message: 'Invalid post ID' });
        return;
      }

      if (courseId) {
        io.to(`forum:course:${courseId}`).emit('forum:course_post_updated', { _id: postId });
      } else {
        io.to('forum:community').emit('forum:community_post_updated', { _id: postId });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id}`);
      // Update online count for all rooms the user was in
      socket.rooms.forEach(room => {
        if (room !== socket.id) { // Exclude the socket's own room
          updateRoomOnlineCount(room);
        }
      });
    });
  });

  return io;
};

module.exports = {setupSocket};