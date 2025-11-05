const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../utils/auth');

router.get('/', requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const fees = await prisma.fee.findMany({ include: { student:true }});
  res.json(fees);
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { studentId, amount, month } = req.body;
  const f = await prisma.fee.create({ data: { studentId, amount: Number(amount)||0, month }});
  res.status(201).json(f);
});

module.exports = router;
