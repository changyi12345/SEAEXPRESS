const express = require('express');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { auth, shopOwnerAuth } = require('../middleware/auth');
const router = express.Router();

// Get shop owner's shop
router.get('/my-shop', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create shop
router.post('/', auth, async (req, res) => {
  try {
    // Check if user already has a shop
    const existingShop = await Shop.findOne({ owner: req.user._id });
    if (existingShop) {
      return res.status(400).json({ message: 'You already have a shop' });
    }

    const shop = new Shop({
      ...req.body,
      owner: req.user._id
    });
    await shop.save();
    res.status(201).json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update shop
router.put('/my-shop', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    Object.assign(shop, req.body);
    await shop.save();
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Product Management
// Add product
router.post('/my-shop/products', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    shop.products.push(req.body);
    await shop.save();
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product
router.put('/my-shop/products/:productId', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const product = shop.products.id(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    Object.assign(product, req.body);
    await shop.save();
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product
router.delete('/my-shop/products/:productId', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    shop.products.id(req.params.productId).remove();
    await shop.save();
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get shop orders
router.get('/my-shop/orders', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { shop: shop._id };
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
router.put('/my-shop/orders/:orderId/status', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    let order = await Order.findById(req.params.orderId)
      .populate('user', 'name phone email')
      .populate('rider', 'name phone')
      .populate('restaurant', 'name nameMyanmar address phone')
      .populate('shop', 'name nameMyanmar address phone');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order belongs to this shop
    const orderShopId = order.shop?._id?.toString() || order.shop?.toString() || order.shop;
    if (!orderShopId || orderShopId !== shop._id.toString()) {
      return res.status(403).json({ message: 'Order does not belong to your shop' });
    }

    const { status } = req.body;
    const oldStatus = order.status;
    
    // Prevent shop from setting status to 'rider-assigned' - only rider can accept order
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
      // Shop accepts order - mark delivery fee as paid by shop
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
      
      // If status changed from 'pending' to 'preparing' (shop accepted order) and no rider assigned, broadcast to all riders
      // This means the shop has accepted the order, so it's now available for riders
      const hasRiderForBroadcast = order.rider && (
        (typeof order.rider === 'object' && order.rider._id) || 
        (typeof order.rider === 'string' && order.rider.length > 0) ||
        (order.rider && order.rider.toString() !== 'null' && order.rider.toString() !== 'undefined')
      );
      
      // Only broadcast when shop accepts order (pending -> preparing) and no rider assigned yet
      if (status === 'preparing' && oldStatus === 'pending' && !hasRiderForBroadcast) {
        console.log(`[Shop] ✅ Order ${order._id} accepted - Broadcasting to riders room`);
        io.to('riders').emit('new-order', orderData);
        io.to('riders').emit('order-available', orderData);
      } else if (status === 'preparing' && oldStatus === 'pending') {
        console.log(`[Shop] ❌ NOT broadcasting - order already has rider: ${order.rider}`);
      }

      // If order is cancelled, notify riders to remove it from available orders
      if (status === 'cancelled') {
        io.to('riders').emit('order-removed', { orderId: order._id });
        console.log(`[Shop] ❌ Order ${order._id} cancelled - Notifying riders`);
      }
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment status
router.put('/my-shop/orders/:orderId/payment', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to this shop
    const orderShopId = order.shop?._id?.toString() || order.shop?.toString() || order.shop;
    if (!orderShopId || orderShopId !== shop._id.toString()) {
      return res.status(403).json({ message: 'Order does not belong to your shop' });
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
router.post('/my-shop/promotions', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
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

    shop.promotions.push(promotion);
    await shop.save();

    // Notify all users via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('users').emit('new-promotion', {
        shop: {
          _id: shop._id,
          name: shop.name,
          nameMyanmar: shop.nameMyanmar
        },
        promotion
      });
    }

    res.json({ shop, promotion });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update promotion
router.put('/my-shop/promotions/:promotionId', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const promotion = shop.promotions.id(req.params.promotionId);
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    Object.assign(promotion, req.body);
    if (req.body.startDate) promotion.startDate = new Date(req.body.startDate);
    if (req.body.endDate) promotion.endDate = new Date(req.body.endDate);
    
    await shop.save();
    res.json({ shop, promotion });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete promotion
router.delete('/my-shop/promotions/:promotionId', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    shop.promotions.id(req.params.promotionId).remove();
    await shop.save();
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manage Closing Days
// Add closing day
router.post('/my-shop/closing-days', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
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

    shop.closingDays.push(closingDay);
    await shop.save();

    res.json({ shop, closingDay });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete closing day
router.delete('/my-shop/closing-days/:closingDayId', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    shop.closingDays.id(req.params.closingDayId).remove();
    await shop.save();
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get shop stats
router.get('/my-shop/stats', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate delivery fees paid to SEA EXPRESS
    const deliveryFeesPaid = await Order.aggregate([
      { 
        $match: { 
          shop: shop._id,
          restaurantShopPaymentStatus: 'paid'
        } 
      },
      { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
    ]).then(result => result[0]?.total || 0);

    const deliveryFeesPending = await Order.aggregate([
      { 
        $match: { 
          shop: shop._id,
          restaurantShopPaymentStatus: 'pending',
          status: { $in: ['preparing', 'rider-assigned', 'picking-up', 'picked-up', 'delivering', 'delivered'] }
        } 
      },
      { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
    ]).then(result => result[0]?.total || 0);

    const stats = {
      todayOrders: await Order.countDocuments({
        shop: shop._id,
        createdAt: { $gte: today }
      }),
      pendingOrders: await Order.countDocuments({
        shop: shop._id,
        status: 'pending'
      }),
      totalOrders: await Order.countDocuments({ shop: shop._id }),
      totalRevenue: await Order.aggregate([
        { $match: { shop: shop._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$subtotal' } } }
      ]).then(result => result[0]?.total || 0),
      products: shop.products.length,
      availableProducts: shop.products.filter(product => product.isAvailable).length,
      deliveryFeesPaid: deliveryFeesPaid,
      deliveryFeesPending: deliveryFeesPending,
      totalDeliveryFees: deliveryFeesPaid + deliveryFeesPending
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

