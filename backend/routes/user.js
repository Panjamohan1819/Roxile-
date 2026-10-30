// routes/user.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { Rating, Store, User, sequelize } = require('../models');
require('dotenv').config();

const router = express.Router();

// All user routes require authentication and role "user"
router.use(authenticateToken);
router.use(authorizeRoles('user'));

// GET /api/user/ratings – list ratings submitted by the logged‑in user
router.get('/ratings', async (req, res) => {
  try {
    const ratings = await Rating.findAll({
      where: { userId: req.user.id },
      include: [{ model: Store, attributes: ['id', 'name', 'address'] }],
    });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/ratings – submit a rating for a store (or update if already exists)
router.post('/ratings', [
  body('storeId').isInt().withMessage('storeId must be integer'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating 1‑5')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { storeId, rating } = req.body;
  try {
    // Ensure store exists
    const store = await Store.findByPk(storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });
    // Check if user already rated this store
    const existing = await Rating.findOne({ where: { userId: req.user.id, storeId } });
    if (existing) {
      // Update existing rating
      await existing.update({ rating });
      return res.json({ message: 'Rating updated', rating: existing });
    }
    // Create new rating
    const newRating = await Rating.create({ userId: req.user.id, storeId, rating });
    res.status(201).json({ message: 'Rating submitted', rating: newRating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/ratings/:id – modify a rating (only own rating)
router.put('/ratings/:id', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating 1‑5')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { id } = req.params;
  const { rating } = req.body;
  try {
    const existing = await Rating.findByPk(id);
    if (!existing) return res.status(404).json({ error: 'Rating not found' });
    if (existing.userId !== req.user.id) return res.status(403).json({ error: 'Cannot modify others\' rating' });
    await existing.update({ rating });
    res.json({ message: 'Rating modified', rating: existing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
