const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../utils/auth');

router.get('/', requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const teachers = await prisma.teacher.findMany({ include: { user:true }});
  res.json(teachers);
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { email, name, password, salary, duties } = req.body;
  // create user + teacher
  const bcrypt = require('bcrypt');
  const hashed = await bcrypt.hash(password || 'password', 10);
  const user = await prisma.user.create({ data: { email, name, password: hashed, role: 'TEACHER' }});
  const teacher = await prisma.teacher.create({ data: { userId: user.id, salary: Number(salary)||0, duties }});
  res.status(201).json({ user, teacher });
});

module.exports = router;
