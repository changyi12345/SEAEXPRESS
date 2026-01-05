const express = require('express');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const DeliveryFee = require('../models/DeliveryFee');
const router = express.Router();

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { 
      items, 
      restaurant, 
      shop, 
      orderType,
      pickupAddress, 
      deliveryAddress, 
      paymentMethod, 
      notes 
    } = req.body;

    // User-to-user delivery
    if (orderType === 'user-to-user') {
      if (!pickupAddress || !deliveryAddress) {
        return res.status(400).json({ message: 'Pickup and delivery addresses are required' });
      }

      if (!paymentMethod) {
        return res.status(400).json({ message: 'Payment method is required' });
      }

      // Calculate delivery fee for two-stop delivery (pickup + delivery)
      let pickupFee = 2000;
      let deliveryFee = 2000;
      
      if (pickupAddress?.zone) {
        const feeConfig = await DeliveryFee.findOne({ 
          zone: pickupAddress.zone,
          isActive: true 
        });
        if (feeConfig) {
          pickupFee = feeConfig.fee;
        }
      }
      
      if (deliveryAddress?.zone) {
        const feeConfig = await DeliveryFee.findOne({ 
          zone: deliveryAddress.zone,
          isActive: true 
        });
        if (feeConfig) {
          deliveryFee = feeConfig.fee;
        }
      }

      // Total delivery fee = average of pickup and delivery fees (or max)
      const totalDeliveryFee = Math.max(pickupFee, deliveryFee);

      // Generate order number
      const count = await Order.countDocuments();
      const orderNumber = `SE${String(count + 1).padStart(6, '0')}`;

      const order = new Order({
        orderNumber,
        user: req.user._id,
        orderType: 'user-to-user',
        items: items || [],
        pickupAddress: {
          street: pickupAddress.street || '',
          city: pickupAddress.city || 'Yangon',
          township: pickupAddress.township || '',
          zone: pickupAddress.zone || '',
          phone: pickupAddress.phone || '',
          name: pickupAddress.name || '',
          notes: pickupAddress.notes || ''
        },
        deliveryAddress: {
          street: deliveryAddress.street || '',
          city: deliveryAddress.city || 'Yangon',
          township: deliveryAddress.township || '',
          zone: deliveryAddress.zone || '',
          phone: deliveryAddress.phone || '',
          name: deliveryAddress.name || '',
          notes: deliveryAddress.notes || ''
        },
        deliveryFee: totalDeliveryFee,
        subtotal: 0,
        total: totalDeliveryFee,
        paymentMethod: paymentMethod || 'cod',
        notes: notes || ''
      });

      try {
        await order.save();
      } catch (saveError) {
        console.error('Order save error:', saveError);
        return res.status(400).json({ 
          message: 'Failed to save order', 
          error: saveError.message 
        });
      }

      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('new-order', order);
        io.to('riders').emit('new-order', order);
      }

      return res.status(201).json({ order });
    }

    // Restaurant/Shop order
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    if (!restaurant && !shop) {
      return res.status(400).json({ message: 'Restaurant or shop is required' });
    }

    // Validate transaction ID for online payments
    const { transactionId } = req.body;
    if (paymentMethod !== 'cod') {
      if (!transactionId || transactionId.length !== 6 || !/^\d{6}$/.test(transactionId)) {
        return res.status(400).json({ 
          message: 'Transaction ID is required for online payments. Please enter a valid 6-digit transaction ID.' 
        });
      }
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Get delivery fee based on zone
    let deliveryFee = 2000; // minimum
    if (deliveryAddress?.zone) {
      const feeConfig = await DeliveryFee.findOne({ 
        zone: deliveryAddress.zone,
        isActive: true 
      });
      if (feeConfig) {
        deliveryFee = feeConfig.fee;
      }
    }

    const total = subtotal + deliveryFee;

    // Generate order number
    const count = await Order.countDocuments();
    const orderNumber = `SE${String(count + 1).padStart(6, '0')}`;

    const order = new Order({
      orderNumber,
      user: req.user._id,
      orderType: restaurant ? 'restaurant' : 'shop',
      restaurant,
      shop,
      items,
      deliveryAddress,
      deliveryFee,
      subtotal,
      total,
      paymentMethod,
      transactionId: paymentMethod !== 'cod' ? transactionId : null,
      notes
    });

    await order.save();

    // Populate order for real-time updates
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name phone email')
      .populate('restaurant', 'name nameMyanmar address phone owner')
      .populate('shop', 'name nameMyanmar address phone owner')
      .populate('rider', 'name phone');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const orderData = populatedOrder.toObject ? populatedOrder.toObject() : populatedOrder;
      io.to('admin').emit('new-order', orderData);
      io.to('riders').emit('new-order', orderData);
      
      // Emit to restaurant owner if it's a restaurant order
      if (order.restaurant && populatedOrder.restaurant?.owner) {
        const ownerId = populatedOrder.restaurant.owner._id || populatedOrder.restaurant.owner;
        io.to(`restaurant-admin-${ownerId}`).emit('new-order', orderData);
      }
      
      // Emit to shop owner if it's a shop order
      if (order.shop && populatedOrder.shop?.owner) {
        const ownerId = populatedOrder.shop.owner._id || populatedOrder.shop.owner;
        io.to(`shop-admin-${ownerId}`).emit('new-order', orderData);
      }
    }

    res.status(201).json({ order: populatedOrder });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all orders (for admin)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user', 'name phone email')
      .populate('restaurant', 'name nameMyanmar')
      .populate('shop', 'name nameMyanmar')
      .populate('rider', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, proofOfPickup, proofOfDelivery } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization checks
    if (req.user.role === 'user' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'rider' && order.rider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // For restaurant/shop orders, rider must have verified transaction ID before delivering
    if (req.user.role === 'rider' && status === 'delivering' && 
        (order.orderType === 'restaurant' || order.orderType === 'shop')) {
      if (!order.riderPaymentTransactionId) {
        return res.status(400).json({ 
          message: 'Please submit your transaction ID first before starting delivery' 
        });
      }
      if (order.riderPaymentStatus !== 'verified') {
        return res.status(400).json({ 
          message: 'Please wait for admin to verify your transaction ID before starting delivery' 
        });
      }
    }

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      // Auto-mark COD orders as paid when delivered
      if (order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
        order.paymentStatus = 'paid';
      }
    }

    // Update proof images
    if (proofOfPickup) {
      order.proofOfPickup = proofOfPickup;
    }
    if (proofOfDelivery) {
      order.proofOfDelivery = proofOfDelivery;
    }

    // Calculate rider service fee (80% of delivery fee)
    if (order.rider && order.deliveryFee && order.riderServiceFee === 0) {
      order.riderServiceFee = Math.round(order.deliveryFee * 0.8);
    }

    await order.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id}`).emit('order-updated', order);
      io.to('admin').emit('order-updated', order);
      io.to(`user-${order.user}`).emit('order-updated', order);
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel order
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['delivered', 'completed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.status = 'cancelled';
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id}`).emit('order-cancelled', order);
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

