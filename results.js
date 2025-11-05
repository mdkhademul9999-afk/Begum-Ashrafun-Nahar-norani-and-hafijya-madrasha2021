const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../utils/auth');

router.get('/', requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const results = await prisma.result.findMany({ include: { student:true }});
  res.json(results);
});

router.post('/', requireAuth, requireRole('TEACHER'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { studentId, subject, marks, total } = req.body;
  const r = await prisma.result.create({ data: { studentId, subject, marks: Number(marks)||0, total: Number(total)||100 }});
  res.status(201).json(r);
});

module.exports = router;
