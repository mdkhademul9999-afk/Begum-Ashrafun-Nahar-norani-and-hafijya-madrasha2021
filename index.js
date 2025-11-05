require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const feeRoutes = require('./routes/fees');
const attendanceRoutes = require('./routes/attendance');
const resultRoutes = require('./routes/results');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
app.locals.prisma = prisma;

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/results', resultRoutes);

// Serve frontend build if present
app.use(express.static(path.join(__dirname, '../../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Server listening on', port);
});
