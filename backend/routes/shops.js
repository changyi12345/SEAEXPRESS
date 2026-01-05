const express = require('express');
const Shop = require('../models/Shop');
const router = express.Router();

// Get all shops
router.get('/', async (req, res) => {
  try {
    const { township, zone, search, category } = req.query;
    const query = { isActive: true, isApproved: true }; // Only show approved shops

    if (township) query['address.township'] = township;
    if (zone) query['address.zone'] = zone;
    if (category) query['products.category'] = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameMyanmar: { $regex: search, $options: 'i' } }
      ];
    }

    const shops = await Shop.find(query)
      .select('-products')
      .sort({ rating: -1, createdAt: -1 });
    
    res.json({ shops });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single shop with products
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    
    if (!shop || !shop.isActive) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

