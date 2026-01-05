const mongoose = require('mongoose');

const deliveryFeeSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    default: 'Yangon'
  },
  zone: {
    type: String,
    required: true,
    enum: ['ဗဟိုခရိုင်', 'အရှေ့ပိုင်း', 'အနောက်ပိုင်း', 'အဝေးပိုင်း']
  },
  zoneEnglish: {
    type: String,
    required: true,
    enum: ['central', 'east', 'west', 'remote']
  },
  townships: [String],
  fee: {
    type: Number,
    required: true,
    min: 2000
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DeliveryFee', deliveryFeeSchema);

