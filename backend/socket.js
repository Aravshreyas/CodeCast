const { Server } = require("socket.io");
const ClassroomSession = require('./models/ClassroomSession');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  const userToSocketMap = {};

  io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on('join-room', async (room, userId) => {
      socket.join(room);
      userToSocketMap[userId] = socket.id;
      
      const session = await ClassroomSession.findOne({ inviteCode: room }).populate('participants', 'name role');
      if (session) {
        io.in(room).emit('participants-update', session.participants);
      }
    });
    
    // Updated to handle multiple files
    socket.on('file-update', (data) => {
        socket.to(data.room).emit('file-update', { 
            fileName: data.fileName, 
            newContent: data.newContent 
        });
    });

    socket.on('add-file', (data) => {
        io.in(data.room).emit('add-file', { newFile: data.newFile });
    });

    socket.on('run-command', (data) => {
        io.in(data.room).emit('new-terminal-output', {
             output: `> ${data.command}`
        });
        if(data.command.trim().toLowerCase() === 'run') {
             io.in(data.room).emit('run-code', { files: data.files });
        } else if (data.command.trim().toLowerCase() === 'clear') {
            io.in(data.room).emit('clear-terminal');
        }
    });

    socket.on('send-message', (data) => {
        io.in(data.room).emit('new-message', { user: data.user, text: data.text, timestamp: new Date() });
    });

    socket.on('send-reaction', (data) => {
        io.in(data.room).emit('new-reaction', { userId: data.userId, reaction: data.reaction });
    });
    
    socket.on('broadcast-prompt', (data) => {
        io.in(data.room).emit('new-prompt', { prompt: data.prompt });
    });

    socket.on('request-control', async (data) => {
        const session = await ClassroomSession.findOne({ inviteCode: data.room });
        if(session) {
            const instructorSocketId = userToSocketMap[session.instructor];
            if (instructorSocketId) {
                io.to(instructorSocketId).emit('new-control-request', { requester: data.requester });
            }
        }
    });

    socket.on('grant-control', (data) => {
        io.in(data.room).emit('control-granted', { controller: data.controller });
    });

    socket.on('deny-control', (data) => {
        const studentSocketId = userToSocketMap[data.requesterId];
        if (studentSocketId) {
            io.to(studentSocketId).emit('request-denied');
        }
    });

    socket.on('revoke-control', (data) => {
        io.in(data.room).emit('control-revoked');
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      for(let userId in userToSocketMap) {
          if(userToSocketMap[userId] === socket.id) {
              delete userToSocketMap[userId];
              break;
          }
      }
    });
  });

  return io;
};

module.exports = initSocket;
