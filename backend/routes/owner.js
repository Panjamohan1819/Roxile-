// routes/owner.js
const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { Rating, Store, User, sequelize } = require('../models');

const router = express.Router();

// All owner routes require authentication + owner role
router.use(authenticateToken);
router.use(authorizeRoles('owner'));

// Helper: find store belonging to the logged‑in owner (by matching user's email with store.email)
async function getOwnerStore(userId) {
  const owner = await User.findByPk(userId);
  if (!owner) return null;
  // Assuming store.email == owner.email for ownership relation
  return await Store.findOne({ where: { email: owner.email } });
}

// GET /api/owner/ratings – list users who rated the owner's store
router.get('/ratings', async (req, res) => {
  try {
    const store = await getOwnerStore(req.user.id);
    if (!store) return res.status(404).json({ error: 'Store not found for owner' });
    const ratings = await Rating.findAll({
      where: { storeId: store.id },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/owner/average-rating – average rating of the owner's store
router.get('/average-rating', async (req, res) => {
  try {
    const store = await getOwnerStore(req.user.id);
    if (!store) return res.status(404).json({ error: 'Store not found for owner' });
    const result = await Rating.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'average'] ],
      where: { storeId: store.id },
      raw: true,
    });
    const avg = parseFloat(result.average).toFixed(2);
    res.json({ storeId: store.id, averageRating: avg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
