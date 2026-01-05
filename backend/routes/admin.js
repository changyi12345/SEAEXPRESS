const express = require('express');
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const Withdrawal = require('../models/Withdrawal');
const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Manage users
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};
    if (role) {
      query.role = role;
    }
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { name, email, phone, password, role, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      phone,
      password, // Will be hashed by pre-save hook
      role,
      address,
      isActive: true
    });

    await user.save();

    res.status(201).json({ 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, phone, role, address, isActive, password } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (address) user.address = address;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password; // Will be hashed by pre-save hook

    await user.save();

    res.json({ 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard stats
// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalRiders = await User.countDocuments({ role: 'rider' });
    const totalRestaurants = await Restaurant.countDocuments({ isActive: true });
    const totalShops = await Shop.countDocuments({ isActive: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Payment-related statistics
    const pendingTransactionVerifications = await Order.countDocuments({
      riderPaymentTransactionId: { $exists: true, $ne: null },
      riderPaymentStatus: 'pending',
      status: { $in: ['picked-up', 'delivering', 'delivered'] }
    });

    const pendingDeliveryConfirmations = await Order.countDocuments({
      status: 'delivered',
      riderPaymentStatus: 'verified',
      riderServiceFeeStatus: 'pending',
      proofOfDelivery: { $exists: true, $ne: null }
    });

    const totalRiderServiceFeesPaid = await Order.aggregate([
      { $match: { riderServiceFeeStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$riderServiceFee' } } }
    ]);

    const totalDeliveryFeesCollected = await Order.aggregate([
      { 
        $match: { 
          $or: [
            { orderType: 'restaurant', restaurantShopPaymentStatus: 'paid' },
            { orderType: 'shop', restaurantShopPaymentStatus: 'paid' }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalRiders,
        totalRestaurants,
        totalShops,
        todayOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingTransactionVerifications,
        pendingDeliveryConfirmations,
        totalRiderServiceFeesPaid: totalRiderServiceFeesPaid[0]?.total || 0,
        totalDeliveryFeesCollected: totalDeliveryFeesCollected[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manage restaurants
router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ restaurants });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/restaurants', async (req, res) => {
  try {
    const { ownerEmail, ownerPhone, ownerName, ownerPassword, ...restaurantData } = req.body;
    
    let owner = null;
    
    // Create owner account if provided
    if (ownerEmail || ownerPhone) {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          ownerEmail ? { email: ownerEmail } : {},
          ownerPhone ? { phone: ownerPhone } : {}
        ]
      });
      
      if (existingUser) {
        // Update existing user to restaurant-admin role
        if (existingUser.role !== 'restaurant-admin' && existingUser.role !== 'admin') {
          existingUser.role = 'restaurant-admin';
          await existingUser.save();
        }
        owner = existingUser;
      } else {
        // Create new user with restaurant-admin role
        if (!ownerName || !ownerEmail || !ownerPhone || !ownerPassword) {
          return res.status(400).json({ 
            message: 'Owner name, email, phone, and password are required to create new account' 
          });
        }
        
        const newUser = new User({
          name: ownerName,
          email: ownerEmail,
          phone: ownerPhone,
          password: ownerPassword,
          role: 'restaurant-admin'
        });
        await newUser.save();
        owner = newUser;
      }
    }
    
    const restaurant = new Restaurant({
      ...restaurantData,
      owner: owner ? owner._id : undefined,
      isApproved: req.body.isApproved || false
    });
    await restaurant.save();
    
    const populatedRestaurant = await Restaurant.findById(restaurant._id)
      .populate('owner', 'name email phone');
    
    res.status(201).json({ restaurant: populatedRestaurant, owner });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign owner to restaurant
router.put('/restaurants/:id/owner', async (req, res) => {
  try {
    const { ownerId } = req.body;
    const owner = await User.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Update user role to restaurant-admin if not already
    if (owner.role !== 'restaurant-admin' && owner.role !== 'admin') {
      owner.role = 'restaurant-admin';
      await owner.save();
    }
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { owner: ownerId },
      { new: true }
    );
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ restaurant, owner });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve restaurant
router.post('/restaurants/:id/approve', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: true,
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    );
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('approvedBy', 'name email');
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage shops
router.get('/shops', async (req, res) => {
  try {
    const { approved } = req.query;
    const query = {};
    if (approved !== undefined) {
      query.isApproved = approved === 'true';
    }
    
    const shops = await Shop.find(query)
      .populate('owner', 'name email phone')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ shops });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/shops', async (req, res) => {
  try {
    const { ownerEmail, ownerPhone, ownerName, ownerPassword, ...shopData } = req.body;
    
    let owner = null;
    
    // Create owner account if provided
    if (ownerEmail || ownerPhone) {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          ownerEmail ? { email: ownerEmail } : {},
          ownerPhone ? { phone: ownerPhone } : {}
        ]
      });
      
      if (existingUser) {
        // Update existing user to shop-admin role
        if (existingUser.role !== 'shop-admin' && existingUser.role !== 'admin') {
          existingUser.role = 'shop-admin';
          await existingUser.save();
        }
        owner = existingUser;
      } else {
        // Create new user with shop-admin role
        if (!ownerName || !ownerEmail || !ownerPhone || !ownerPassword) {
          return res.status(400).json({ 
            message: 'Owner name, email, phone, and password are required to create new account' 
          });
        }
        
        const newUser = new User({
          name: ownerName,
          email: ownerEmail,
          phone: ownerPhone,
          password: ownerPassword,
          role: 'shop-admin'
        });
        await newUser.save();
        owner = newUser;
      }
    }

    const shop = new Shop({
      ...shopData,
      owner: owner ? owner._id : undefined,
      isApproved: req.body.isApproved || false
    });
    await shop.save();
    
    const populatedShop = await Shop.findById(shop._id)
      .populate('owner', 'name email phone');

    res.status(201).json({ shop: populatedShop, owner });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign owner to shop
router.put('/shops/:id/owner', async (req, res) => {
  try {
    const { ownerId } = req.body;
    const owner = await User.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Update user role to shop-admin if not already
    if (owner.role !== 'shop-admin' && owner.role !== 'admin') {
      owner.role = 'shop-admin';
      await owner.save();
    }
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { owner: ownerId },
      { new: true }
    );
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json({ shop, owner });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve shop
router.post('/shops/:id/approve', async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: true,
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    );
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/shops/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('approvedBy', 'name email');
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/shops/:id', async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage riders
router.get('/riders', async (req, res) => {
  try {
    const riders = await User.find({ role: 'rider' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ riders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/riders/:id', async (req, res) => {
  try {
    const rider = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!rider || rider.role !== 'rider') {
      return res.status(404).json({ message: 'Rider not found' });
    }
    
    res.json({ rider });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage orders
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, pendingVerification, pendingConfirmation } = req.query;
    const query = {};
    
    if (pendingVerification === 'true') {
      // Orders that need transaction ID verification
      query.riderPaymentTransactionId = { $exists: true, $ne: null };
      query.riderPaymentStatus = 'pending';
      query.status = { $in: ['picked-up', 'delivering', 'delivered'] };
    } else if (pendingConfirmation === 'true') {
      // Orders that need delivery confirmation and rider payment
      query.status = 'delivered';
      query.riderPaymentStatus = 'verified';
      query.riderServiceFeeStatus = 'pending';
      query.proofOfDelivery = { $exists: true, $ne: null };
    } else if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'name phone email')
      .populate('restaurant', 'name nameMyanmar')
      .populate('shop', 'name nameMyanmar')
      .populate('rider', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);
    res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order detail
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate('restaurant', 'name nameMyanmar phone address')
      .populate('shop', 'name nameMyanmar phone address')
      .populate('rider', 'name phone email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify rider payment transaction ID
router.put('/orders/:id/verify-rider-payment', async (req, res) => {
  try {
    const { verified } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate('restaurant', 'name nameMyanmar phone address')
      .populate('shop', 'name nameMyanmar phone address')
      .populate('rider', 'name phone email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.riderPaymentTransactionId) {
      return res.status(400).json({ message: 'Rider has not submitted transaction ID yet' });
    }

    if (verified) {
      order.riderPaymentStatus = 'verified';
    } else {
      order.riderPaymentStatus = 'failed';
    }

    await order.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const orderData = order.toObject ? order.toObject() : order;
      io.to(`order-${order._id}`).emit('order-updated', orderData);
      if (order.rider) {
        const riderId = order.rider._id || order.rider;
        io.to(`rider-${riderId}`).emit('order-updated', orderData);
      }
    }

    res.json({ 
      message: verified ? 'Transaction ID verified successfully' : 'Transaction ID verification failed',
      order 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Confirm delivery and pay rider service fee
router.put('/orders/:id/confirm-delivery', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate('restaurant', 'name nameMyanmar phone address')
      .populate('shop', 'name nameMyanmar phone address')
      .populate('rider', 'name phone email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Order must be delivered first' });
    }

    // Check if rider payment is verified
    if (order.riderPaymentStatus !== 'verified') {
      return res.status(400).json({ 
        message: 'Rider payment transaction ID must be verified first' 
      });
    }

    // Check if proof of delivery exists
    if (!order.proofOfDelivery) {
      return res.status(400).json({ 
        message: 'Proof of delivery must be uploaded first' 
      });
    }

    // Mark rider service fee as paid
    order.riderServiceFeeStatus = 'paid';
    order.status = 'completed';
    await order.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const orderData = order.toObject ? order.toObject() : order;
      io.to(`order-${order._id}`).emit('order-updated', orderData);
      io.to('admin').emit('order-updated', orderData);
      if (order.user) {
        const userId = order.user._id || order.user;
        io.to(`user-${userId}`).emit('order-updated', orderData);
      }
      if (order.rider) {
        const riderId = order.rider._id || order.rider;
        io.to(`rider-${riderId}`).emit('order-updated', orderData);
      }
    }

    res.json({ 
      message: 'Delivery confirmed and rider service fee paid',
      order 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Notification Management
// Send notification to all users of a specific type
router.post('/notifications/send', async (req, res) => {
  try {
    const { title, titleMyanmar, message, messageMyanmar, type, recipientType, recipientIds, restaurantIds, shopIds } = req.body;

    if (!title || !message || !recipientType) {
      return res.status(400).json({ message: 'Title, message, and recipient type are required' });
    }

    let recipients = [];
    let restaurants = [];
    let shops = [];

    let allRestaurants = [];
    let allShops = [];

    // Determine recipients based on recipientType
    if (recipientType === 'all') {
      // Send to all users, restaurants, shops, and riders
      const allUsers = await User.find({}).select('_id');
      recipients = allUsers.map(u => u._id);
      
      allRestaurants = await Restaurant.find({}).select('_id owner');
      restaurants = allRestaurants.map(r => r._id);
      recipients.push(...allRestaurants.map(r => r.owner).filter(Boolean));
      
      allShops = await Shop.find({}).select('_id owner');
      shops = allShops.map(s => s._id);
      recipients.push(...allShops.map(s => s.owner).filter(Boolean));
    } else if (recipientType === 'user') {
      const users = await User.find({ role: 'user' }).select('_id');
      recipients = users.map(u => u._id);
    } else if (recipientType === 'restaurant-admin') {
      const restaurantAdmins = await User.find({ role: 'restaurant-admin' }).select('_id');
      recipients = restaurantAdmins.map(u => u._id);
      
      if (restaurantIds && restaurantIds.length > 0) {
        restaurants = restaurantIds;
        const restaurantOwners = await Restaurant.find({ _id: { $in: restaurantIds } }).select('owner');
        recipients.push(...restaurantOwners.map(r => r.owner).filter(Boolean));
      } else {
        allRestaurants = await Restaurant.find({}).select('_id owner');
        restaurants = allRestaurants.map(r => r._id);
        recipients.push(...allRestaurants.map(r => r.owner).filter(Boolean));
      }
    } else if (recipientType === 'shop-admin') {
      const shopAdmins = await User.find({ role: 'shop-admin' }).select('_id');
      recipients = shopAdmins.map(u => u._id);
      
      if (shopIds && shopIds.length > 0) {
        shops = shopIds;
        const shopOwners = await Shop.find({ _id: { $in: shopIds } }).select('owner');
        recipients.push(...shopOwners.map(s => s.owner).filter(Boolean));
      } else {
        allShops = await Shop.find({}).select('_id owner');
        shops = allShops.map(s => s._id);
        recipients.push(...allShops.map(s => s.owner).filter(Boolean));
      }
    } else if (recipientType === 'rider') {
      const riders = await User.find({ role: 'rider' }).select('_id');
      recipients = riders.map(u => u._id);
    } else if (recipientType === 'specific') {
      if (!recipientIds || recipientIds.length === 0) {
        return res.status(400).json({ message: 'Recipient IDs are required for specific notifications' });
      }
      recipients = recipientIds;
    }

    // Remove duplicates
    recipients = [...new Set(recipients.map(id => id.toString()))];

    // Create notification
    const notification = new Notification({
      title,
      titleMyanmar: titleMyanmar || title,
      message,
      messageMyanmar: messageMyanmar || message,
      type: type || 'info',
      recipientType,
      recipients,
      restaurants: restaurants.length > 0 ? restaurants : undefined,
      shops: shops.length > 0 ? shops : undefined,
      sentBy: req.user._id
    });

    await notification.save();

    // Emit notification via Socket.io
    const io = req.app.get('io');
    if (io) {
      const notificationData = {
        _id: notification._id,
        title: notification.title,
        titleMyanmar: notification.titleMyanmar,
        message: notification.message,
        messageMyanmar: notification.messageMyanmar,
        type: notification.type,
        createdAt: notification.createdAt
      };

      // Send to specific recipients
      recipients.forEach(recipientId => {
        io.to(`user-${recipientId}`).emit('admin-notification', notificationData);
      });

      // Send to restaurant admins room
      if (recipientType === 'all' || recipientType === 'restaurant-admin') {
        if (restaurants.length > 0) {
          const restaurantOwners = await Restaurant.find({ _id: { $in: restaurants } }).select('owner');
          restaurantOwners.forEach(restaurant => {
            if (restaurant.owner) {
              io.to(`restaurant-admin-${restaurant.owner}`).emit('admin-notification', notificationData);
            }
          });
        }
      }

      // Send to shop admins room
      if (recipientType === 'all' || recipientType === 'shop-admin') {
        if (shops.length > 0) {
          const shopOwners = await Shop.find({ _id: { $in: shops } }).select('owner');
          shopOwners.forEach(shop => {
            if (shop.owner) {
              io.to(`shop-admin-${shop.owner}`).emit('admin-notification', notificationData);
            }
          });
        }
      }

      // Send to riders room
      if (recipientType === 'all' || recipientType === 'rider') {
        io.to('riders').emit('admin-notification', notificationData);
      }

      // Send to users room
      if (recipientType === 'all' || recipientType === 'user') {
        io.to('users').emit('admin-notification', notificationData);
      }
    }

    res.json({ message: 'Notification sent successfully', notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all notifications (for admin)
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's notifications
router.get('/notifications/my', async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    // Get notifications where user is in recipients, or all notifications for their role
    const notifications = await Notification.find({
      $or: [
        { recipients: userId },
        { recipientType: 'all' },
        { recipientType: user.role },
        { recipientType: 'restaurant-admin', restaurants: { $in: await Restaurant.find({ owner: userId }).select('_id') } },
        { recipientType: 'shop-admin', shops: { $in: await Shop.find({ owner: userId }).select('_id') } }
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
router.put('/notifications/:id/read', async (req, res) => {
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

// Get all withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const withdrawals = await Withdrawal.find(query)
      .populate('rider', 'name phone email')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ withdrawals });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get withdrawal by ID
router.get('/withdrawals/:id', async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('rider', 'name phone email address')
      .populate('processedBy', 'name email')
      .populate('orders');
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    
    res.json({ withdrawal });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve withdrawal
router.put('/withdrawals/:id/approve', async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('rider', 'name phone email');
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal is not pending' });
    }
    
    withdrawal.status = 'approved';
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    
    // Emit real-time update to rider
    const io = req.app.get('io');
    if (io) {
      io.to(`rider-${withdrawal.rider._id}`).emit('withdrawal-updated', {
        withdrawal: await Withdrawal.findById(withdrawal._id)
          .populate('rider', 'name phone email')
          .populate('processedBy', 'name email')
      });
    }
    
    res.json({ 
      message: 'Withdrawal approved successfully',
      withdrawal: await Withdrawal.findById(withdrawal._id)
        .populate('rider', 'name phone email')
        .populate('processedBy', 'name email')
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject withdrawal
router.put('/withdrawals/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('rider', 'name phone email');
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal is not pending' });
    }
    
    withdrawal.status = 'rejected';
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    if (rejectionReason) {
      withdrawal.rejectionReason = rejectionReason;
    }
    await withdrawal.save();
    
    // Emit real-time update to rider
    const io = req.app.get('io');
    if (io) {
      io.to(`rider-${withdrawal.rider._id}`).emit('withdrawal-updated', {
        withdrawal: await Withdrawal.findById(withdrawal._id)
          .populate('rider', 'name phone email')
          .populate('processedBy', 'name email')
      });
    }
    
    res.json({ 
      message: 'Withdrawal rejected successfully',
      withdrawal: await Withdrawal.findById(withdrawal._id)
        .populate('rider', 'name phone email')
        .populate('processedBy', 'name email')
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark withdrawal as completed (after payment is made)
router.put('/withdrawals/:id/complete', async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('rider', 'name phone email');
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    
    if (withdrawal.status !== 'approved') {
      return res.status(400).json({ message: 'Withdrawal must be approved first' });
    }
    
    withdrawal.status = 'completed';
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    
    // Emit real-time update to rider
    const io = req.app.get('io');
    if (io) {
      io.to(`rider-${withdrawal.rider._id}`).emit('withdrawal-updated', {
        withdrawal: await Withdrawal.findById(withdrawal._id)
          .populate('rider', 'name phone email')
          .populate('processedBy', 'name email')
      });
    }
    
    res.json({ 
      message: 'Withdrawal marked as completed',
      withdrawal: await Withdrawal.findById(withdrawal._id)
        .populate('rider', 'name phone email')
        .populate('processedBy', 'name email')
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

