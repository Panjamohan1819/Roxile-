const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { User, Store, Rating, sequelize } = require('../models');
require('dotenv').config();

const router = express.Router();

// Apply auth and admin check to all routes
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Helper for building filters
function buildFilter(model) {
  const where = {};
  if (model === 'user') {
    if (query.name) where.name = { [sequelize.Op.iLike]: `%${query.name}%` };
    if (query.email) where.email = { [sequelize.Op.iLike]: `%${query.email}%` };
    if (query.address) where.address = { [sequelize.Op.iLike]: `%${query.address}%` };
    if (query.role) where.role = query.role;
  } else if (model === 'store') {
    if (query.name) where.name = { [sequelize.Op.iLike]: `%${query.name}%` };
    if (query.email) where.email = { [sequelize.Op.iLike]: `%${query.email}%` };
    if (query.address) where.address = { [sequelize.Op.iLike]: `%${query.address}%` };
  }
  return where;
}

// Add new user (admin can specify role)
router.post('/users', [
  body('name').isLength({ min: 20, max: 60 }),
  body('email').isEmail(),
  body('address').isLength({ max: 400 }).optional({ nullable: true }),
  body('password').isLength({ min: 8, max: 16 })
    .matches(/[A-Z]/).matches(/[^A-Za-z0-9]/),
  body('role').isIn(['admin', 'user', 'owner'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, address, password, role } = req.body;
  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email already taken' });
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, address, passwordHash: hash, role });
    res.status(201).json({ message: 'User created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add new store
router.post('/stores', [
  body('name').isLength({ min: 20, max: 60 }),
  body('email').isEmail(),
  body('address').isLength({ max: 400 }).optional({ nullable: true })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, address } = req.body;
  try {
    const exists = await Store.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Store email already used' });
    await Store.create({ name, email, address });
    res.status(201).json({ message: 'Store created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Dashboard totals
router.get('/dashboard', async (req, res) => {
  try {
    const users = await User.count();
    const stores = await Store.count();
    const ratings = await Rating.count();
    res.json({ users, stores, ratings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// List users with filters, sorting, pagination
router.get('/users', async (req, res) => {
  const { sort = 'name', order = 'ASC', limit = 20, offset = 0 } = req.query;
  const where = {};
  if (req.query.name) where.name = { [sequelize.Op.like]: `%${req.query.name}%` };
  if (req.query.email) where.email = { [sequelize.Op.like]: `%${req.query.email}%` };
  if (req.query.address) where.address = { [sequelize.Op.like]: `%${req.query.address}%` };
  if (req.query.role) where.role = req.query.role;
  try {
    const users = await User.findAll({ where, order: [[sort, order]], limit: +limit, offset: +offset });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// List stores with filters, sorting, pagination
router.get('/stores', async (req, res) => {
  const { sort = 'name', order = 'ASC', limit = 20, offset = 0 } = req.query;
  const where = {};
  if (req.query.name) where.name = { [sequelize.Op.like]: `%${req.query.name}%` };
  if (req.query.email) where.email = { [sequelize.Op.like]: `%${req.query.email}%` };
  if (req.query.address) where.address = { [sequelize.Op.like]: `%${req.query.address}%` };
  try {
    const stores = await Store.findAll({ where, order: [[sort, order]], limit: +limit, offset: +offset });
    res.json(stores);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
