const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../utils/auth');

router.get('/', requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const students = await prisma.student.findMany();
  res.json(students);
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { name, dob, guardian, address, className, section, photoUrl } = req.body;
  const s = await prisma.student.create({ data: { name, dob: dob?new Date(dob):null, guardian, address, className, section, photoUrl }});
  res.status(201).json(s);
});

router.get('/:id', requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const s = await prisma.student.findUnique({ where: { id: req.params.id }, include: { results:true, fees:true }});
  if(!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

router.put('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const data = req.body;
  if (data.dob) data.dob = new Date(data.dob);
  const s = await prisma.student.update({ where: { id: req.params.id }, data });
  res.json(s);
});

router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const prisma = req.app.locals.prisma;
  await prisma.student.delete({ where: { id: req.params.id }});
  res.json({ ok:true });
});

module.exports = router;
