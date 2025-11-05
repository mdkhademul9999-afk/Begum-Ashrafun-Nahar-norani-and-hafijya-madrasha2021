const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { sign } = require('../utils/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Register (admin creates users typically; for demo allow open register)
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password required' });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { email, password: hashed, name: name || email, role: role || 'TEACHER' }});
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (e) {
    res.status(400).json({ error: 'User exists or invalid' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email }});
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = sign(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role }});
});

module.exports = router;
