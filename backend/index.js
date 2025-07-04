require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const initSocket = require('./socket');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const promptRoutes = require('./routes/promptRoutes'); // Import prompt routes

// --- Initial Setup ---
const app = express();
const server = http.createServer(app);

// --- Database Connection ---
connectDB();

// --- Middleware ---
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true
}));
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/prompts', promptRoutes); // Use prompt routes

app.get('/', (req, res) => {
  res.send('API for CodeCast is running...');
});

// --- Initialize Socket.IO ---
const io = initSocket(server);
app.set('io', io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));