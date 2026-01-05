const express = require('express');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { auth, restaurantOwnerAuth } = require('../middleware/auth');
const router = express.Router();

// Get restaurant owner's restaurant
router.get('/my-restaurant', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create restaurant
router.post('/', auth, async (req, res) => {
  try {
    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ owner: req.user._id });
    if (existingRestaurant) {
      return res.status(400).json({ message: 'You already have a restaurant' });
    }

    const restaurant = new Restaurant({
      ...req.body,
      owner: req.user._id
    });
    await restaurant.save();
    res.status(201).json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update restaurant
router.put('/my-restaurant', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    Object.assign(restaurant, req.body);
    await restaurant.save();
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Menu Management
// Add menu item
router.post('/my-restaurant/menu', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.menu.push(req.body);
    await restaurant.save();
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update menu item
router.put('/my-restaurant/menu/:itemId', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItem = restaurant.menu.id(req.params.itemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    Object.assign(menuItem, req.body);
    await restaurant.save();
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete menu item
router.delete('/my-restaurant/menu/:itemId', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.menu.id(req.params.itemId).remove();
    await restaurant.save();
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get restaurant orders
router.get('/my-restaurant/orders', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { restaurant: restaurant._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user', 'name phone email')
      .populate('rider', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status
router.put('/my-restaurant/orders/:orderId/status', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    let order = await Order.findById(req.params.orderId)
      .populate('user', 'name phone email')
      .populate('rider', 'name phone')
      .populate('restaurant', 'name nameMyanmar address phone')
      .populate('shop', 'name nameMyanmar address phone');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order belongs to this restaurant
    const orderRestaurantId = order.restaurant?._id?.toString() || order.restaurant?.toString() || order.restaurant;
    if (!orderRestaurantId || orderRestaurantId !== restaurant._id.toString()) {
      return res.status(403).json({ message: 'Order does not belong to your restaurant' });
    }

    const { status } = req.body;
    const oldStatus = order.status;
    
    // Prevent restaurant from setting status to 'rider-assigned' - only rider can accept order
    // Check if rider exists - could be ObjectId, populated object, or null
    const hasRider = order.rider && (
      (typeof order.rider === 'object' && order.rider._id) || 
      (typeof order.rider === 'string' && order.rider.length > 0) ||
      (order.rider && order.rider.toString() !== 'null' && order.rider.toString() !== 'undefined')
    );
    
    if (status === 'rider-assigned' && !hasRider) {
      return res.status(400).json({ 
        message: 'Cannot set status to rider-assigned. A rider must accept the order first.' 
      });
    }

    // Allow cancellation only for pending or preparing orders (before rider picks up)
    if (status === 'cancelled') {
      if (!['pending', 'preparing'].includes(order.status)) {
        return res.status(400).json({ 
          message: 'Cannot cancel order. Order has already been picked up or is in progress.' 
        });
      }
    }
    
    order.status = status;
    
    if (status === 'preparing') {
      // Restaurant accepts order - mark delivery fee as paid by restaurant
      order.restaurantShopPaymentStatus = 'paid';
      // Order is being prepared - make it available to riders
    } else if (status === 'rider-assigned') {
      // Ready for pickup (only if rider is already assigned)
    }

    await order.save();
    
    // Refresh order to get latest state
    order = await Order.findById(req.params.orderId)
      .populate('user', 'name phone email')
      .populate('rider', 'name phone')
      .populate('restaurant', 'name nameMyanmar address phone')
      .populate('shop', 'name nameMyanmar address phone');

    // Convert to plain object for socket emission
    const orderData = order.toObject ? order.toObject() : order;

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      // Send to user
      if (order.user) {
        const userId = order.user._id || order.user;
        io.to(`user-${userId}`).emit('order-updated', orderData);
      }
      
      // Send to assigned rider if exists
      if (order.rider) {
        const riderId = order.rider._id || order.rider;
        io.to(`rider-${riderId}`).emit('order-updated', orderData);
      }
      
      // Send to admin
      io.to('admin').emit('order-updated', orderData);
      
      // If status changed from 'pending' to 'preparing' (restaurant accepted order) and no rider assigned, broadcast to all riders
      // This means the restaurant has accepted the order, so it's now available for riders
      const hasRiderForBroadcast = order.rider && (
        (typeof order.rider === 'object' && order.rider._id) || 
        (typeof order.rider === 'string' && order.rider.length > 0) ||
        (order.rider && order.rider.toString() !== 'null' && order.rider.toString() !== 'undefined')
      );
      
      // Only broadcast when restaurant accepts order (pending -> preparing) and no rider assigned yet
      if (status === 'preparing' && oldStatus === 'pending' && !hasRiderForBroadcast) {
        console.log(`[Restaurant] ✅ Order ${order._id} accepted - Broadcasting to riders room`);
        io.to('riders').emit('new-order', orderData);
        io.to('riders').emit('order-available', orderData);
      } else if (status === 'preparing' && oldStatus === 'pending') {
        console.log(`[Restaurant] ❌ NOT broadcasting - order already has rider: ${order.rider}`);
      }

      // If order is cancelled, notify riders to remove it from available orders
      if (status === 'cancelled') {
        io.to('riders').emit('order-removed', { orderId: order._id });
        console.log(`[Restaurant] ❌ Order ${order._id} cancelled - Notifying riders`);
      }
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment status
router.put('/my-restaurant/orders/:orderId/payment', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to this restaurant
    const orderRestaurantId = order.restaurant?._id?.toString() || order.restaurant?.toString() || order.restaurant;
    if (!orderRestaurantId || orderRestaurantId !== restaurant._id.toString()) {
      return res.status(403).json({ message: 'Order does not belong to your restaurant' });
    }

    const { paymentStatus } = req.body;
    if (!['pending', 'paid', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    // Populate order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name phone email')
      .populate('rider', 'name phone')
      .populate('restaurant', 'name nameMyanmar address phone')
      .populate('shop', 'name nameMyanmar address phone');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const orderData = populatedOrder.toObject ? populatedOrder.toObject() : populatedOrder;
      io.to(`order-${order._id}`).emit('order-updated', orderData);
      io.to('admin').emit('order-updated', orderData);
      if (order.user) {
        const userId = order.user._id || order.user;
        io.to(`user-${userId}`).emit('order-updated', orderData);
      }
    }

    res.json({ order: populatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manage Promotions
// Add promotion
router.post('/my-restaurant/promotions', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const { title, titleMyanmar, description, descriptionMyanmar, discountPercentage, startDate, endDate } = req.body;

    if (!title || !discountPercentage || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, discount percentage, start date, and end date are required' });
    }

    const promotion = {
      title,
      titleMyanmar: titleMyanmar || title,
      description: description || '',
      descriptionMyanmar: descriptionMyanmar || description || '',
      discountPercentage: Number(discountPercentage),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true
    };

    restaurant.promotions.push(promotion);
    await restaurant.save();

    // Notify all users via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('users').emit('new-promotion', {
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          nameMyanmar: restaurant.nameMyanmar
        },
        promotion
      });
    }

    res.json({ restaurant, promotion });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update promotion
router.put('/my-restaurant/promotions/:promotionId', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const promotion = restaurant.promotions.id(req.params.promotionId);
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    Object.assign(promotion, req.body);
    if (req.body.startDate) promotion.startDate = new Date(req.body.startDate);
    if (req.body.endDate) promotion.endDate = new Date(req.body.endDate);
    
    await restaurant.save();
    res.json({ restaurant, promotion });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete promotion
router.delete('/my-restaurant/promotions/:promotionId', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.promotions.id(req.params.promotionId).remove();
    await restaurant.save();
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manage Closing Days
// Add closing day
router.post('/my-restaurant/closing-days', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const { date, reason, reasonMyanmar } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const closingDay = {
      date: new Date(date),
      reason: reason || 'Closed',
      reasonMyanmar: reasonMyanmar || reason || 'ပိတ်ထားသည်'
    };

    restaurant.closingDays.push(closingDay);
    await restaurant.save();

    res.json({ restaurant, closingDay });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete closing day
router.delete('/my-restaurant/closing-days/:closingDayId', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.closingDays.id(req.params.closingDayId).remove();
    await restaurant.save();
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get restaurant stats
router.get('/my-restaurant/stats', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate delivery fees paid to SEA EXPRESS
    const deliveryFeesPaid = await Order.aggregate([
      { 
        $match: { 
          restaurant: restaurant._id,
          restaurantShopPaymentStatus: 'paid'
        } 
      },
      { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
    ]).then(result => result[0]?.total || 0);

    const deliveryFeesPending = await Order.aggregate([
      { 
        $match: { 
          restaurant: restaurant._id,
          restaurantShopPaymentStatus: 'pending',
          status: { $in: ['preparing', 'rider-assigned', 'picking-up', 'picked-up', 'delivering', 'delivered'] }
        } 
      },
      { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
    ]).then(result => result[0]?.total || 0);

    const stats = {
      todayOrders: await Order.countDocuments({
        restaurant: restaurant._id,
        createdAt: { $gte: today }
      }),
      pendingOrders: await Order.countDocuments({
        restaurant: restaurant._id,
        status: 'pending'
      }),
      totalOrders: await Order.countDocuments({ restaurant: restaurant._id }),
      totalRevenue: await Order.aggregate([
        { $match: { restaurant: restaurant._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$subtotal' } } }
      ]).then(result => result[0]?.total || 0),
      menuItems: restaurant.menu.length,
      availableMenuItems: restaurant.menu.filter(item => item.isAvailable).length,
      deliveryFeesPaid: deliveryFeesPaid,
      deliveryFeesPending: deliveryFeesPending,
      totalDeliveryFees: deliveryFeesPaid + deliveryFeesPending
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get restaurant admin's notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const restaurant = await Restaurant.findOne({ owner: userId });
    
    // Get notifications where user is in recipients, or all notifications for restaurant-admin, or specific restaurant
    const notifications = await Notification.find({
      $or: [
        { recipients: userId },
        { recipientType: 'all' },
        { recipientType: 'restaurant-admin' },
        { restaurants: restaurant?._id }
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

