const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  itemType: {
    type: String,
    enum: ['restaurant', 'shop'],
    required: true
  },
  name: String,
  nameMyanmar: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: String
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    sparse: true // Allow null/undefined but enforce uniqueness when present
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderType: {
    type: String,
    enum: ['restaurant', 'shop', 'user-to-user'],
    default: 'restaurant'
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  items: [orderItemSchema],
  // User-to-user delivery: pickup location
  pickupAddress: {
    street: String,
    city: String,
    township: String,
    zone: String,
    phone: String,
    name: String, // Sender name
    notes: String // Pickup instructions
  },
  // Delivery location
  deliveryAddress: {
    street: String,
    city: String,
    township: String,
    zone: String,
    phone: String,
    name: String, // Recipient name
    notes: String // Delivery instructions
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 2000
  },
  subtotal: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'kbzpay', 'wavemoney', 'bank'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: null
  },
  // Restaurant/Shop payment to rider (delivery fee)
  restaurantShopPaymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  // Rider payment to SEA EXPRESS (after pickup)
  riderPaymentTransactionId: {
    type: String,
    default: null
  },
  riderPaymentStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending'
  },
  // Rider service fee (paid by SEA EXPRESS after delivery confirmation)
  riderServiceFee: {
    type: Number,
    default: 0
  },
  riderServiceFeeStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: [
      'pending',           // အော်ဒါလက်ခံသည်
      'preparing',         // စားသောက်ဆိုင်က ပြင်ဆင်နေ
      'rider-assigned',    // Rider assigned
      'picking-up',        // Rider လာရောက်ယူနေ (pickup location)
      'picked-up',         // Pickup လုပ်ပြီးပြီ
      'delivering',        // ပို့ဆောင်နေ (delivery location)
      'delivered',         // ပို့ဆောင်ပြီးပြီ
      'completed',         // ပြီးစီးပြီ
      'cancelled'          // ပယ်ဖျက်ထားသည်
    ],
    default: 'pending'
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  riderLocation: {
    lat: Number,
    lng: Number
  },
  estimatedDeliveryTime: Date,
  deliveredAt: Date,
  proofOfPickup: {
    type: String, // Image URL
    default: null
  },
  proofOfDelivery: {
    type: String, // Image URL
    default: null
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: String,
  notes: String
}, {
  timestamps: true
});

// Generate order number before saving (fallback if not set in route)
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    try {
      const count = await mongoose.model('Order').countDocuments();
      this.orderNumber = `SE${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      // Fallback if count fails
      this.orderNumber = `SE${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

