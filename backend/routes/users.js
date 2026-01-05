const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const Restaurant = require('../models/Restaurant');
const Shop = require('../models/Shop');
const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (avatar) updateData.avatar = avatar;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user orders
router.get('/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name nameMyanmar')
      .populate('shop', 'name nameMyanmar')
      .populate('rider', 'name phone')
      .sort({ createdAt: -1 });
    
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order
router.get('/orders/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    })
      .populate('restaurant', 'name nameMyanmar phone address')
      .populate('shop', 'name nameMyanmar phone address')
      .populate('rider', 'name phone');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate and review order
router.post('/orders/:id/review', auth, async (req, res) => {
  try {
    const { rating, review } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user._id,
      status: 'delivered'
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found or not delivered' });
    }

    order.rating = rating;
    order.review = review;
    await order.save();

    // Update restaurant/shop rating
    if (order.restaurant) {
      const Restaurant = require('../models/Restaurant');
      const restaurant = await Restaurant.findById(order.restaurant);
      if (restaurant) {
        const totalReviews = restaurant.totalReviews + 1;
        restaurant.rating = ((restaurant.rating * restaurant.totalReviews) + rating) / totalReviews;
        restaurant.totalReviews = totalReviews;
        await restaurant.save();
      }
    }

    if (order.shop) {
      const Shop = require('../models/Shop');
      const shop = await Shop.findById(order.shop);
      if (shop) {
        const totalReviews = shop.totalReviews + 1;
        shop.rating = ((shop.rating * shop.totalReviews) + rating) / totalReviews;
        shop.totalReviews = totalReviews;
        await shop.save();
      }
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    // Get notifications where user is in recipients, or all notifications for their role
    const notifications = await Notification.find({
      $or: [
        { recipients: userId },
        { recipientType: 'all' },
        { recipientType: 'user' }
      ]
    })
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const userId = req.user._id;
    const alreadyRead = notification.readBy.some(r => r.user.toString() === userId.toString());
    
    if (!alreadyRead) {
      notification.readBy.push({ user: userId });
      await notification.save();
    }

    res.json({ notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

