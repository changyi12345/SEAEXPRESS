const express = require('express');
const { riderAuth, auth } = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Withdrawal = require('../models/Withdrawal');
const router = express.Router();

// Get available orders
// For restaurant/shop orders: Only show orders that have been accepted (status: 'preparing')
// For user-to-user orders: Show immediately (status: 'pending' or 'preparing')
// Riders cannot see 'pending' restaurant/shop orders - they must wait for restaurant/shop to accept first
router.get('/orders/available', riderAuth, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        // Restaurant/Shop orders: must be accepted (preparing)
        { orderType: { $in: ['restaurant', 'shop'] }, status: 'preparing' },
        // User-to-user orders: available immediately (pending or preparing)
        { orderType: 'user-to-user', status: { $in: ['pending', 'preparing'] } }
      ],
      rider: { $exists: false }
    })
      .populate('user', 'name phone email address')
      .populate('restaurant', 'name nameMyanmar address phone')
      .populate('shop', 'name nameMyanmar address phone')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept order
router.post('/orders/:id/accept', riderAuth, async (req, res) => {
  try {
    // Fetch order without populate first to check basic conditions
    const currentOrder = await Order.findById(req.params.id);

    if (!currentOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order already has a rider (check raw ObjectId)
    if (currentOrder.rider) {
      const riderId = currentOrder.rider._id?.toString() || currentOrder.rider.toString();
      if (riderId === req.user._id.toString()) {
        return res.status(400).json({ message: 'You have already accepted this order' });
      }
      return res.status(400).json({ message: 'Order already assigned to another rider' });
    }

    // Check if order status allows acceptance
    // For restaurant/shop orders: must be accepted by restaurant/shop first (status: 'preparing')
    // For user-to-user orders: can be accepted immediately (status: 'pending' or 'preparing')
    console.log(`[Rider Accept] Order ${currentOrder._id} - Status: ${currentOrder.status}, Type: ${currentOrder.orderType}, Has Rider: ${!!currentOrder.rider}`);
    
    if (currentOrder.orderType === 'user-to-user') {
      // User-to-user orders can be accepted when pending or preparing
      if (!['pending', 'preparing'].includes(currentOrder.status)) {
        console.log(`[Rider Accept] ❌ User-to-user order ${currentOrder._id} cannot be accepted - status: ${currentOrder.status}`);
        return res.status(400).json({ 
          message: `Order cannot be accepted. Current status: ${currentOrder.status}.` 
        });
      }
    } else {
      // Restaurant/shop orders must be accepted by restaurant/shop first (status: 'preparing')
      if (currentOrder.status !== 'preparing') {
        console.log(`[Rider Accept] ❌ Restaurant/Shop order ${currentOrder._id} cannot be accepted - status: ${currentOrder.status}`);
        return res.status(400).json({ 
          message: `Order cannot be accepted. Current status: ${currentOrder.status}. Only orders that have been accepted by the restaurant/shop can be accepted by riders.` 
        });
      }
    }

    // Use findOneAndUpdate to atomically check and update (prevents race conditions)
    const updateData = {
      rider: req.user._id
    };
    
    // For user-to-user delivery, start with picking-up
    // For restaurant/shop, if status is 'preparing', change to 'rider-assigned'
    if (currentOrder.orderType === 'user-to-user') {
      updateData.status = 'picking-up';
    } else {
      // For restaurant/shop orders, change from 'preparing' to 'rider-assigned'
      updateData.status = 'rider-assigned';
    }
    
    // Atomic update conditions
    const updateConditions = {
      _id: req.params.id,
      rider: { $exists: false }
    };
    
    // Status condition depends on order type
    if (currentOrder.orderType === 'user-to-user') {
      updateConditions.status = { $in: ['pending', 'preparing'] };
    } else {
      updateConditions.status = 'preparing'; // Restaurant/shop orders must be accepted first
    }
    
    const order = await Order.findOneAndUpdate(
      updateConditions,
      updateData,
      { new: true }
    )
      .populate('user', 'name phone email')
      .populate('rider', 'name phone')
      .populate('restaurant', 'name nameMyanmar address phone')
      .populate('shop', 'name nameMyanmar address phone');
    
    if (!order) {
      // Order was already taken or status changed - fetch current state
      const latestOrder = await Order.findById(req.params.id);
      if (latestOrder?.rider) {
        return res.status(400).json({ message: 'Order already assigned to another rider' });
      }
      // Check status based on order type
      if (latestOrder) {
        if (latestOrder.orderType === 'user-to-user') {
          if (!['pending', 'preparing'].includes(latestOrder.status)) {
            return res.status(400).json({ 
              message: `Order status changed. Current status: ${latestOrder.status}.` 
            });
          }
        } else {
          if (latestOrder.status !== 'preparing') {
            return res.status(400).json({ 
              message: `Order status changed. Current status: ${latestOrder.status}. Only orders that have been accepted by the restaurant/shop can be accepted by riders.` 
            });
          }
        }
      }
      return res.status(400).json({ message: 'Order is no longer available' });
    }

    // Convert to plain object for socket emission
    const orderData = order.toObject ? order.toObject() : order;

    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id}`).emit('order-accepted', orderData);
      io.to('admin').emit('order-updated', orderData);
      io.to(`rider-${req.user._id}`).emit('order-accepted', orderData);
      // Remove from available orders for other riders
      io.to('riders').emit('order-removed', { orderId: order._id });
      console.log(`[Rider Accept] ✅ Order ${order._id} accepted by rider ${req.user._id}`);
    }

    res.json({ order });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject order
router.post('/orders/:id/reject', riderAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order || order.rider?.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.rider = undefined;
    if (order.status === 'rider-assigned') {
      order.status = 'preparing';
    }
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id}`).emit('order-rejected', order);
    }

    res.json({ message: 'Order rejected', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rider's orders
router.get('/orders', riderAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { rider: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user', 'name phone email address')
      .populate('restaurant', 'name nameMyanmar address phone')
      .populate('shop', 'name nameMyanmar address phone')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update rider location
router.post('/location', riderAuth, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    // Update location in active orders
      await Order.updateMany(
      { 
        rider: req.user._id,
        status: { $in: ['picking-up', 'delivering'] }
      },
      { 
        $set: { 
          riderLocation: { lat, lng }
        }
      }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('rider-location', { riderId: req.user._id, lat, lng });
    }

    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit transaction ID to SEA EXPRESS (after pickup)
router.post('/orders/:id/payment', riderAuth, async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    if (!transactionId || transactionId.length !== 6 || !/^\d{6}$/.test(transactionId)) {
      return res.status(400).json({ 
        message: 'Please enter a valid 6-digit transaction ID' 
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if rider owns this order
    if (order.rider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow if order is picked up and proof is uploaded
    if (order.status !== 'picked-up' || !order.proofOfPickup) {
      return res.status(400).json({ 
        message: 'Please upload proof of pickup first before submitting transaction ID' 
      });
    }

    // Check if already submitted
    if (order.riderPaymentTransactionId) {
      return res.status(400).json({ 
        message: 'Transaction ID already submitted. Please wait for admin verification.' 
      });
    }

    order.riderPaymentTransactionId = transactionId;
    order.riderPaymentStatus = 'pending';
    await order.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const orderData = order.toObject ? order.toObject() : order;
      io.to('admin').emit('order-updated', orderData);
      io.to(`order-${order._id}`).emit('order-updated', orderData);
    }

    res.json({ 
      message: 'Transaction ID submitted successfully. Waiting for admin verification.',
      order 
    });
  } catch (error) {
    console.error('Error submitting transaction ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get rider income/stats
router.get('/stats', riderAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { 
      rider: req.user._id,
      status: 'delivered',
      paymentStatus: 'paid'
    };

    if (startDate || endDate) {
      query.deliveredAt = {};
      if (startDate) query.deliveredAt.$gte = new Date(startDate);
      if (endDate) query.deliveredAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query);
    // Rider gets 80% of delivery fee (for both restaurant/shop and user-to-user deliveries)
    const totalEarnings = orders.reduce((sum, order) => sum + (order.deliveryFee * 0.8), 0);
    const totalDeliveries = orders.length;

    // Calculate available balance (paid service fees that haven't been withdrawn)
    const paidOrders = await Order.find({
      rider: req.user._id,
      riderServiceFeeStatus: 'paid'
    });
    
    // Get all withdrawals (completed and pending)
    const allWithdrawals = await Withdrawal.find({
      rider: req.user._id,
      status: { $in: ['pending', 'approved', 'completed'] }
    });
    
    const completedWithdrawals = allWithdrawals.filter(w => ['approved', 'completed'].includes(w.status));
    
    // Calculate total withdrawn amount (only completed)
    const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    // Calculate total pending withdrawals
    const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'pending');
    const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    // Calculate total earned (from paid service fees)
    const totalEarned = paidOrders.reduce((sum, order) => sum + (order.riderServiceFee || 0), 0);
    
    // Available balance = total earned - total withdrawn - total pending
    const availableBalance = totalEarned - totalWithdrawn - totalPending;

    // Check last withdrawal date for 7-day cooldown
    const lastWithdrawal = await Withdrawal.findOne({
      rider: req.user._id,
      status: { $in: ['pending', 'approved', 'completed'] }
    }).sort({ createdAt: -1 });

    let canWithdraw = true;
    let daysUntilNextWithdrawal = 0;
    
    if (lastWithdrawal) {
      const lastWithdrawalDate = new Date(lastWithdrawal.createdAt);
      const daysSinceLastWithdrawal = Math.floor((Date.now() - lastWithdrawalDate.getTime()) / (1000 * 60 * 60 * 24));
      daysUntilNextWithdrawal = Math.max(0, 7 - daysSinceLastWithdrawal);
      canWithdraw = daysSinceLastWithdrawal >= 7;
    }

    res.json({
      totalEarnings,
      totalDeliveries,
      orders: orders.length,
      availableBalance: Math.max(0, availableBalance),
      totalEarned,
      totalWithdrawn,
      canWithdraw,
      daysUntilNextWithdrawal,
      lastWithdrawalDate: lastWithdrawal?.createdAt || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rider's notifications
router.get('/notifications', riderAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get notifications where user is in recipients, or all notifications for riders
    const notifications = await Notification.find({
      $or: [
        { recipients: userId },
        { recipientType: 'all' },
        { recipientType: 'rider' }
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
router.put('/notifications/:id/read', riderAuth, async (req, res) => {
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

// Get withdrawal history
router.get('/withdrawals', riderAuth, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ rider: req.user._id })
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ withdrawals });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create withdrawal request
router.post('/withdrawals', riderAuth, async (req, res) => {
  try {
    const { amount, accountName, accountNumber, bankName, phone } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }
    if (!accountName || !accountNumber || !bankName || !phone) {
      return res.status(400).json({ message: 'Please provide all account details' });
    }

    // Check 7-day cooldown
    const lastWithdrawal = await Withdrawal.findOne({
      rider: req.user._id,
      status: { $in: ['pending', 'approved', 'completed'] }
    }).sort({ createdAt: -1 });

    if (lastWithdrawal) {
      const lastWithdrawalDate = new Date(lastWithdrawal.createdAt);
      const daysSinceLastWithdrawal = Math.floor((Date.now() - lastWithdrawalDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastWithdrawal < 7) {
        const daysRemaining = 7 - daysSinceLastWithdrawal;
        return res.status(400).json({ 
          message: `You can only withdraw once every 7 days. Please wait ${daysRemaining} more day(s).`,
          daysRemaining
        });
      }
    }

    // Check if there's a pending withdrawal
    const pendingWithdrawal = await Withdrawal.findOne({
      rider: req.user._id,
      status: 'pending'
    });

    if (pendingWithdrawal) {
      return res.status(400).json({ message: 'You already have a pending withdrawal request' });
    }

    // Calculate available balance
    const paidOrders = await Order.find({
      rider: req.user._id,
      riderServiceFeeStatus: 'paid'
    });
    
    const allWithdrawals = await Withdrawal.find({
      rider: req.user._id,
      status: { $in: ['pending', 'approved', 'completed'] }
    });
    
    const completedWithdrawals = allWithdrawals.filter(w => ['approved', 'completed'].includes(w.status));
    const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'pending');
    const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    const totalEarned = paidOrders.reduce((sum, order) => sum + (order.riderServiceFee || 0), 0);
    const availableBalance = totalEarned - totalWithdrawn - totalPending;

    if (amount > availableBalance) {
      return res.status(400).json({ 
        message: `Insufficient balance. Available: ${availableBalance} Ks`,
        availableBalance
      });
    }

    // Get orders that will be included in this withdrawal
    // We'll include orders with paid service fees that haven't been withdrawn yet
    const ordersToInclude = paidOrders
      .filter(order => order.riderServiceFee > 0)
      .slice(0, Math.ceil(amount / 1000)); // Approximate order selection

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      rider: req.user._id,
      amount,
      accountName,
      accountNumber,
      bankName,
      phone,
      status: 'pending',
      orders: ordersToInclude.map(o => o._id)
    });

    await withdrawal.save();

    // Emit notification to admin
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('new-withdrawal', {
        withdrawal: await Withdrawal.findById(withdrawal._id).populate('rider', 'name phone email')
      });
    }

    res.status(201).json({ 
      message: 'Withdrawal request submitted successfully',
      withdrawal 
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

