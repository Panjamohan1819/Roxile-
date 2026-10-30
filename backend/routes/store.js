// routes/store.js
const express = require('express');
const { Rating, Store, User, sequelize } = require('../models');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const router = express.Router();

// Helper to optionally decode JWT (if header present)
function optionalAuth(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (_) { return null; }
}

// GET /api/stores – list stores, optional search, include overall rating and user's rating if logged in
router.get('/', async (req, res) => {
  const { name, address, sort = 'name', order = 'ASC', limit = 20, offset = 0 } = req.query;
  const where = {};
  if (name) where.name = { [sequelize.Op.like]: `%${name}%` };
  if (address) where.address = { [sequelize.Op.like]: `%${address}%` };

  try {
    const stores = await Store.findAll({ where, order: [[sort, order]], limit: +limit, offset: +offset, raw: true });
    // Compute overall rating for each store (single query per store – acceptable for small demo)
    const results = await Promise.all(stores.map(async store => {
      const avgObj = await Rating.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'average']],
        where: { storeId: store.id },
        raw: true,
      });
      const overall = avgObj && avgObj.average ? parseFloat(avgObj.average).toFixed(2) : null;
      const user = optionalAuth(req);
      let userRating = null;
      if (user) {
        const r = await Rating.findOne({ where: { storeId: store.id, userId: user.id }, raw: true });
        if (r) userRating = r.rating;
      }
      return { ...store, overallRating: overall, userRating };
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
