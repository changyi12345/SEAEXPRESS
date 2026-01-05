const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  role: { type: String, enum: ['user', 'rider', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  address: {
    street: String,
    city: String,
    township: String,
    zone: String
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@seaexpress.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Email: admin@seaexpress.com');
      console.log('   To reset password, update the user in MongoDB');
      process.exit(0);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@seaexpress.com',
      phone: '09447772848',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@seaexpress.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');
    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Admin user already exists!');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

createAdmin();

