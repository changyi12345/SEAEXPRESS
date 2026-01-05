const express = require('express');
const DeliveryFee = require('../models/DeliveryFee');
const router = express.Router();

// Get delivery fees
router.get('/', async (req, res) => {
  try {
    const { city, zone } = req.query;
    const query = { isActive: true };
    
    if (city) query.city = city;
    if (zone) query.zone = zone;

    const fees = await DeliveryFee.find(query).sort({ fee: 1 });
    res.json({ fees });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get delivery fee by township
router.get('/township/:township', async (req, res) => {
  try {
    const fee = await DeliveryFee.findOne({
      townships: { $in: [req.params.township] },
      isActive: true
    });

    if (!fee) {
      return res.json({ fee: { fee: 2000, zone: 'default' } }); // minimum fee
    }

    res.json({ fee });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

