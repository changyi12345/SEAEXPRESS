const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  nameMyanmar: {
    type: String,
    required: true
  },
  description: String,
  descriptionMyanmar: String,
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    default: null // Original price before discount
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  image: String,
  category: String,
  isAvailable: {
    type: Boolean,
    default: true
  }
});

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  nameMyanmar: {
    type: String,
    required: true
  },
  description: String,
  descriptionMyanmar: String,
  phone: {
    type: String,
    required: true
  },
  email: String,
  address: {
    street: String,
    city: String,
    township: String,
    zone: String
  },
  location: {
    lat: Number,
    lng: Number
  },
  profileImage: String,
  images: [String],
  menu: [menuItemSchema],
  openingHours: {
    open: String,
    close: String,
    days: [String] // ['Monday', 'Tuesday', ...]
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentAccounts: {
    kbzpay: {
      accountName: String,
      accountNumber: String,
      phone: String
    },
    wavemoney: {
      accountName: String,
      accountNumber: String,
      phone: String
    },
    bank: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      branch: String
    }
  },
  promotions: [{
    title: String,
    titleMyanmar: String,
    description: String,
    descriptionMyanmar: String,
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  closingDays: [{
    date: Date,
    reason: String,
    reasonMyanmar: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Restaurant', restaurantSchema);

