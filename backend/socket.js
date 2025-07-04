const { Server } = require("socket.io");
const ClassroomSession = require('./models/ClassroomSession');

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    const userToSocketMap = {};

    io.on('connection', (socket) => {
        console.log(`A user connected: ${socket.id}`);

        // Handles a user joining a classroom session
        socket.on('join-room', async (room, userId) => {
            socket.join(room);
            userToSocketMap[userId] = socket.id;

            const session = await ClassroomSession.findOne({ inviteCode: room }).populate('participants', 'name role');
            if (session) {
                io.in(room).emit('participants-update', session.participants);
            }
        });

        // Handles real-time code updates from the simple editor
        socket.on('code-update', (data) => {
            socket.to(data.room).emit('code-update', { code: data.code });
        });

        // --- Classroom Interaction Handlers ---

        socket.on('send-message', (data) => {
            io.in(data.room).emit('new-message', { user: data.user, text: data.text, timestamp: new Date() });
        });

        socket.on('send-reaction', (data) => {
            io.in(data.room).emit('new-reaction', { userId: data.userId, reaction: data.reaction });
        });

        socket.on('broadcast-prompt', (data) => {
            io.in(data.room).emit('new-prompt', { prompt: data.prompt });
        });
        
        // --- Remote Control Handlers ---

        socket.on('request-control', async (data) => {
            const session = await ClassroomSession.findOne({ inviteCode: data.room });
            if (session) {
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
            if(studentSocketId) {
                io.to(studentSocketId).emit('request-denied');
            }
        });

        socket.on('revoke-control', (data) => {
            io.in(data.room).emit('control-revoked');
        });

        // --- Disconnect Handler ---

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            for (let userId in userToSocketMap) {
                if (userToSocketMap[userId] === socket.id) {
                    delete userToSocketMap[userId];
                    break;
                }
            }
        });
    });

    return io;
};

module.exports = initSocket;