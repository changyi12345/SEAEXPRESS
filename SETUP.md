# SEA EXPRESS - Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB installed and running
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/user
npm install

cd ../rider
npm install

cd ../admin
npm install
```

### 2. Backend Setup

1. Navigate to `backend` directory
2. Create a `.env` file (copy from `.env.example`):
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/seaexpress
   JWT_SECRET=your_super_secret_jwt_key_here_change_this
   NODE_ENV=development
   ```
3. Make sure MongoDB is running
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup

#### User App (Port 3001)
```bash
cd frontend/user
npm run dev
```
Access at: http://localhost:3001

#### Rider App (Port 3002)
```bash
cd frontend/rider
npm run dev
```
Access at: http://localhost:3002

#### Admin App (Port 3003)
```bash
cd frontend/admin
npm run dev
```
Access at: http://localhost:3003

### 4. Create Initial Admin User

You can create an admin user by making a POST request to the API or using MongoDB directly:

```javascript
// Using MongoDB shell or MongoDB Compass
db.users.insertOne({
  name: "Admin User",
  email: "admin@seaexpress.com",
  phone: "09447772848",
  password: "$2a$10$...", // Hashed password (use bcrypt)
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use a tool like Postman to register a user, then manually update the role to 'admin' in MongoDB.

### 5. Seed Initial Data (Optional)

You can create initial delivery fee data:

```javascript
// MongoDB shell
db.deliveryfees.insertMany([
  {
    city: "Yangon",
    zone: "ဗဟိုခရိုင်",
    zoneEnglish: "central",
    townships: ["လမ်းမများ", "ဗဟိုခရိုင်"],
    fee: 2500,
    isActive: true
  },
  {
    city: "Yangon",
    zone: "အရှေ့ပိုင်း",
    zoneEnglish: "east",
    townships: ["အရှေ့ပိုင်းမြို့နယ်များ"],
    fee: 3000,
    isActive: true
  },
  {
    city: "Yangon",
    zone: "အနောက်ပိုင်း",
    zoneEnglish: "west",
    townships: ["အနောက်ပိုင်းမြို့နယ်များ"],
    fee: 3500,
    isActive: true
  },
  {
    city: "Yangon",
    zone: "အဝေးပိုင်း",
    zoneEnglish: "remote",
    townships: ["မြို့ပြအဝေးပိုင်း"],
    fee: 4000,
    isActive: true
  }
])
```

## Running All Services

You can run all services simultaneously using the root scripts:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - User App
npm run dev:user

# Terminal 3 - Rider App
npm run dev:rider

# Terminal 4 - Admin App
npm run dev:admin
```

## Environment Variables

### Backend (.env)
- `PORT`: Backend server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment (development/production)

### Frontend (optional .env files)
- `VITE_API_URL`: Backend API URL (default: http://localhost:5000/api)

## Features Implemented

✅ User registration and authentication
✅ Restaurant and shop browsing
✅ Shopping cart functionality
✅ Order placement with delivery fee calculation
✅ Multiple payment methods (COD, KBZ Pay, Wave Money, Bank Transfer)
✅ Order status tracking
✅ Rating and review system
✅ Rider order acceptance and management
✅ GPS location tracking for riders
✅ Admin dashboard with statistics
✅ Restaurant/Shop management
✅ Rider management
✅ Order management
✅ Delivery fee management by zones
✅ Real-time updates using Socket.io

## Next Steps

1. Set up MongoDB database
2. Configure environment variables
3. Create admin user
4. Add restaurants and shops
5. Register riders
6. Start accepting orders!

## Support

For issues or questions, contact:
- Phone: 09447772848
- Email: hello@reallygreatsite.com

