const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../utils/auth');

router.get('/', requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const recs = await prisma.attendance.findMany({ include: { student:true }});
  res.json(recs);
});

router.post('/', requireAuth, requireRole('TEACHER'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { date, className, studentId, status } = req.body;
  const a = await prisma.attendance.create({ data: { date: new Date(date), className, studentId, status }});
  res.status(201).json(a);
});

module.exports = router;
