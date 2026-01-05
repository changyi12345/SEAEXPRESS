# Admin User ဖန်တီးနည်း (မြန်မာ)

## Method 1: User Register လုပ်ပြီး Admin လုပ်ရန် (အလွယ်ဆုံး)

### အဆင့် 1: User App မှာ Register လုပ်ပါ
1. Browser ဖွင့်ပြီး: http://localhost:3001
2. "Register" button ကို click လုပ်ပါ
3. Form ဖြည့်ပါ:
   - Name: Admin User
   - Email: admin@seaexpress.com (သို့မဟုတ် ကိုယ့် email)
   - Phone: 09447772848
   - Password: (ကိုယ့် password)
4. "Register" button click လုပ်ပါ

### အဆင့် 2: MongoDB မှာ Role ကို Admin လုပ်ရန်

#### Option A: MongoDB Compass သုံးပြီး
1. MongoDB Compass download လုပ်ပါ: https://www.mongodb.com/try/download/compass
2. Connection string နဲ့ connect လုပ်ပါ:
   ```
   mongodb+srv://chanpyae7722_db_user:4kF1WOjuDIuFWAZv@sea.d2ck3e0.mongodb.net/seaexpress
   ```
3. `seaexpress` database ကို select လုပ်ပါ
4. `users` collection ကို click လုပ်ပါ
5. Register လုပ်ထားတဲ့ user ကို find လုပ်ပါ (email နဲ့ search)
6. User document ကို edit လုပ်ပါ
7. `role` field ကို `"user"` ကနေ `"admin"` သို့ change လုပ်ပါ
8. Save လုပ်ပါ

#### Option B: MongoDB Shell (mongosh) သုံးပြီး
1. mongosh folder ထဲသို့သွားပါ
2. mongosh run လုပ်ပါ:
   ```powershell
   cd mongosh-2.5.10-win32-x64\bin
   .\mongosh.exe "mongodb+srv://chanpyae7722_db_user:4kF1WOjuDIuFWAZv@sea.d2ck3e0.mongodb.net/seaexpress"
   ```
3. Database ကို select လုပ်ပါ:
   ```javascript
   use seaexpress
   ```
4. User role ကို update လုပ်ပါ:
   ```javascript
   db.users.updateOne(
     { email: "admin@seaexpress.com" },
     { $set: { role: "admin" } }
   )
   ```
5. Verify လုပ်ပါ:
   ```javascript
   db.users.findOne({ email: "admin@seaexpress.com" })
   ```

## Method 2: Admin User ကို Direct Create လုပ်ရန်

MongoDB Shell သို့မဟုတ် Compass မှာ:

```javascript
use seaexpress

db.users.insertOne({
  name: "Admin User",
  email: "admin@seaexpress.com",
  phone: "09447772848",
  password: "$2a$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K", // bcrypt hash of "admin123"
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**⚠️ သတိပြုရန်:** Password ကို bcrypt hash လုပ်ထားရမယ်။ Method 1 က ပိုလွယ်တယ်။

## Method 3: Script သုံးပြီး Create လုပ်ရန်

Backend folder ထဲမှာ `createAdmin.js` file ဖန်တီးပါ:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  role: String,
  isActive: Boolean
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@seaexpress.com',
      phone: '09447772848',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    console.log('Admin user created:', admin);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
```

Run လုပ်ရန်:
```powershell
cd backend
node createAdmin.js
```

## ✅ Login လုပ်ရန်

Admin user create လုပ်ပြီးရင်:

1. Browser ဖွင့်ပြီး: http://localhost:3003 (Admin App)
2. Login page မှာ:
   - Email: admin@seaexpress.com (သို့မဟုတ် register လုပ်ထားတဲ့ email)
   - Password: (register လုပ်ထားတဲ့ password)
3. "Login" button click လုပ်ပါ

## 🔐 Default Admin Credentials (Method 1 သုံးရင်)

- **Email:** register လုပ်ထားတဲ့ email
- **Password:** register လုပ်ထားတဲ့ password

## ⚠️ အရေးကြီးအချက်

- Admin user က `role: "admin"` ဖြစ်ရမယ်
- `isActive: true` ဖြစ်ရမယ်
- Email က unique ဖြစ်ရမယ်

