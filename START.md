# SEA EXPRESS - Quick Start Guide (မြန်မာ)

## ✅ အဆင့် 1: Dependencies Install လုပ်ပြီးပါပြီ

## 🔧 အဆင့် 2: MongoDB စတင်ရန်

MongoDB install လုပ်ထားရင် terminal အသစ်တစ်ခုဖွင့်ပြီး:

```powershell
mongod
```

သို့မဟုတ် MongoDB service ကို Windows Services မှ start လုပ်ပါ။

## 🚀 အဆင့် 3: Backend Server စတင်ရန်

Terminal အသစ်တစ်ခုဖွင့်ပြီး:

```powershell
cd backend
npm run dev
```

Backend server က port 5000 မှာ run နေရမယ်။

## 🌐 အဆင့် 4: Frontend Apps များ စတင်ရန်

### Terminal 1 - User App (Port 3001)
```powershell
cd frontend/user
npm run dev
```
Browser မှာ: http://localhost:3001

### Terminal 2 - Rider App (Port 3002)
```powershell
cd frontend/rider
npm run dev
```
Browser မှာ: http://localhost:3002

### Terminal 3 - Admin App (Port 3003)
```powershell
cd frontend/admin
npm run dev
```
Browser မှာ: http://localhost:3003

## 👤 Admin User ဖန်တီးရန်

1. User App (http://localhost:3001) မှာ register လုပ်ပါ
2. MongoDB Compass သို့မဟုတ် MongoDB shell သုံးပြီး:
   ```javascript
   use seaexpress
   db.users.updateOne(
     { email: "your_email@example.com" },
     { $set: { role: "admin" } }
   )
   ```

## 📝 Delivery Fees ထည့်ရန်

MongoDB shell သို့မဟုတ် Compass မှာ:

```javascript
use seaexpress
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

## ✅ စစ်ဆေးရန်

1. Backend: http://localhost:5000/api/restaurants (test endpoint)
2. User App: http://localhost:3001
3. Rider App: http://localhost:3002  
4. Admin App: http://localhost:3003

## ⚠️ အရေးကြီးအချက်များ

- MongoDB ကို စတင်ထားရမယ်
- Backend server ကို frontend apps မတိုင်မီ စတင်ထားရမယ်
- `.env` file က backend folder ထဲမှာ ရှိရမယ်

