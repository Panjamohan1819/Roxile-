const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const router = express.Router();

// Register normal user (role=user)
router.post('/register', [
  body('name').isLength({ min: 20, max: 60 }).withMessage('Name must be 20-60 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('address').isLength({ max: 400 }).withMessage('Address max 400 chars'),
  body('password').isLength({ min: 8, max: 16 })
    .matches(/[A-Z]/).withMessage('Password must contain uppercase')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain special char')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, address, password } = req.body;
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, address, passwordHash: hash, role: 'user' });
    res.status(201).json({ message: 'User registered' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Login for any role
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, role: user.role, name: user.name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Change password (protected)
router.post('/change-password', [
  body('oldPassword').exists(),
  body('newPassword').isLength({ min: 8, max: 16 })
    .matches(/[A-Z]/).withMessage('Password must contain uppercase')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain special char')
], async (req, res) => {
  const { authenticateToken } = require('../middleware/auth');
  authenticateToken(req, res, async () => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { oldPassword, newPassword } = req.body;
    try {
      const user = await User.findByPk(req.user.id);
      const match = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!match) return res.status(400).json({ error: 'Old password incorrect' });
      const newHash = await bcrypt.hash(newPassword, 10);
      await user.update({ passwordHash: newHash });
      res.json({ message: 'Password updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
});

module.exports = router;
