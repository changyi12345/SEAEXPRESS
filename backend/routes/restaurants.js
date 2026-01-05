const express = require('express');
const Restaurant = require('../models/Restaurant');
const router = express.Router();

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const { township, zone, search } = req.query;
    const query = { isActive: true, isApproved: true }; // Only show approved restaurants

    if (township) query['address.township'] = township;
    if (zone) query['address.zone'] = zone;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameMyanmar: { $regex: search, $options: 'i' } }
      ];
    }

    const restaurants = await Restaurant.find(query)
      .select('-menu')
      .sort({ rating: -1, createdAt: -1 });
    
    res.json({ restaurants });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single restaurant with menu
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

