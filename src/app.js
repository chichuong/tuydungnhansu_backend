// src/app.js
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io");
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const socketService = require('./services/socketService');
const savedJobRoutes = require('./routes/savedJobRoutes');
const userRoutes = require('./routes/userRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const profileRoutes = require('./routes/profileRoutes');
const interviewDeadlineChecker = require('./jobs/interviewDeadlineChecker');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swaggerOptions');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const port = process.env.SERVER_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); 
app.use('/public', express.static(path.join(__dirname, '../public')));

// Chạy service của Socket.IO
socketService.init(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/saved-jobs', savedJobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes); 
app.use('/api/admin', adminRoutes); 
app.use('/api/profile', profileRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api/auth/ping', (req, res) => res.json({ ok: 'auth alive' }));
app.get('/', (req, res) => {
    res.send('Chào mừng đến với Recruitment App API!');
});

server.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
  interviewDeadlineChecker.scheduleJob();
});