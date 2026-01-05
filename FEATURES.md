# SEA EXPRESS - New Features (မြန်မာ)

## ✅ လုပ်ပြီးသား Features

### 1. User-to-User Delivery (ပစ္စည်းပို့ဆောင်မှု)
- User က pickup location (ယူရမည့်နေရာ) နဲ့ delivery location (ပို့ပေးရမည့်နေရာ) ထည့်ပြီး order create လုပ်နိုင်တယ်
- Delivery fee က pickup zone နဲ့ delivery zone ရဲ့ max fee ကို ယူတယ်
- User App: `/delivery` page မှာ order create လုပ်နိုင်တယ်

### 2. Two-Stop Delivery System (Rider)
- Rider က အရင်ဆုံး pickup location ကို ယူရမယ်
- ပြီးရင် delivery location ကို ပို့ရမယ်
- Status flow:
  - `picking-up` → `picked-up` → `delivering` → `delivered`
- Rider App မှာ pickup location နဲ့ delivery location နှစ်ခုလုံး ပြပေးတယ်
- Phone call buttons နှစ်ခုလုံးမှာ ရှိတယ်

### 3. Admin Approval System
- Restaurant/Shop တွေ create လုပ်ရင် `isApproved: false` ဖြစ်တယ်
- Admin က approve လုပ်မှသာ user တွေ မြင်ရမယ်
- Admin App မှာ:
  - Approval status column ပြပေးတယ်
  - "Approve" button နဲ့ approve လုပ်နိုင်တယ်
  - Approved restaurants/shops ကိုသာ user app မှာ ပြပေးတယ်

### 4. Delivery Fee Calculation
- User-to-user delivery: pickup zone fee နဲ့ delivery zone fee ရဲ့ max ကို ယူတယ်
- Rider က delivery fee ရဲ့ 80% ကို ရမယ်
- Two-stop delivery အတွက် fee တစ်ခါထဲ ပေါ်ပေးတယ်

## 📱 App Updates

### User App (http://localhost:3001)
- ✅ New "Delivery" page (`/delivery`)
- ✅ Pickup address form
- ✅ Delivery address form
- ✅ Delivery fee calculation
- ✅ Order detail page မှာ pickup/delivery addresses ပြပေးတယ်
- ✅ Navbar မှာ "Delivery" link

### Rider App (http://localhost:3002)
- ✅ Order detail page မှာ pickup location နဲ့ delivery location နှစ်ခုလုံး ပြပေးတယ်
- ✅ Two-stop delivery status flow
- ✅ "Picked Up" status button
- ✅ Phone call buttons (pickup နဲ့ delivery)

### Admin App (http://localhost:3003)
- ✅ Restaurant/Shop approval system
- ✅ Approval status column
- ✅ "Approve" button
- ✅ Orders page မှာ order type (Delivery/Restaurant/Shop) ပြပေးတယ်

## 🔄 Order Status Flow

### Restaurant/Shop Orders:
1. `pending` → `preparing` → `rider-assigned` → `picking-up` → `delivering` → `delivered` → `completed`

### User-to-User Delivery:
1. `pending` → `picking-up` → `picked-up` → `delivering` → `delivered` → `completed`

## 💰 Delivery Fee Structure

- **User-to-User Delivery:**
  - Pickup zone fee နဲ့ delivery zone fee ရဲ့ max ကို ယူတယ်
  - Example: Pickup (3,000 Ks) + Delivery (3,500 Ks) = 3,500 Ks (max)
  
- **Rider Earnings:**
  - Delivery fee ရဲ့ 80%
  - Example: 3,500 Ks × 0.8 = 2,800 Ks

## 🎯 Usage

### User-to-User Delivery Order:
1. User App → "Delivery" menu
2. Pickup address ထည့်ပါ (sender name, address, phone, zone)
3. Delivery address ထည့်ပါ (recipient name, address, phone, zone)
4. Payment method select လုပ်ပါ
5. "Create Delivery Order" click လုပ်ပါ

### Admin Approval:
1. Admin App → Restaurants/Shops
2. Pending restaurants/shops ကို ကြည့်ပါ
3. "Approve" button click လုပ်ပါ
4. Approved ဖြစ်ရင် user app မှာ ပေါ်လာမယ်

### Rider Two-Stop Delivery:
1. Available orders မှာ order accept လုပ်ပါ
2. Pickup location ကို ယူရမယ်
3. "Mark as Picked Up" click လုပ်ပါ
4. Delivery location ကို ပို့ရမယ်
5. "Mark as Delivered" click လုပ်ပါ

## 📝 Database Changes

### Order Model:
- `orderType`: 'restaurant' | 'shop' | 'user-to-user'
- `pickupAddress`: { street, city, township, zone, phone, name, notes }
- `deliveryAddress`: { street, city, township, zone, phone, name, notes }
- Status: 'picked-up' added

### Restaurant/Shop Models:
- `isApproved`: Boolean (default: false)
- `approvedBy`: ObjectId (admin user)
- `approvedAt`: Date

## ✅ Testing Checklist

- [ ] User-to-user delivery order create လုပ်ကြည့်ပါ
- [ ] Admin approval system test လုပ်ကြည့်ပါ
- [ ] Rider two-stop delivery test လုပ်ကြည့်ပါ
- [ ] Delivery fee calculation မှန်မမှန် စစ်ကြည့်ပါ
- [ ] Order status transitions test လုပ်ကြည့်ပါ

