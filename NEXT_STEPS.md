# ဆက်လုပ်ရမည့် အဆင့်များ (Next Steps)

## ✅ လုပ်ပြီးသား
- ✅ Dependencies install လုပ်ပြီး
- ✅ .env file ဖန်တီးပြီး
- ✅ mongosh (MongoDB Shell) download လုပ်ပြီး

## 🔧 အဆင့် 1: MongoDB Server Install လုပ်ရန်

### Option A: MongoDB Community Server (Local)
1. Browser ဖွင့်ပြီး: https://www.mongodb.com/try/download/community
2. Windows x64 version select လုပ်ပါ
3. Download လုပ်ပါ (MSI installer)
4. Installer run လုပ်ပြီး install လုပ်ပါ
5. "Install MongoDB as a Service" option ကို select လုပ်ပါ
6. Install ပြီးရင် MongoDB service auto start ဖြစ်မယ်

### Option B: MongoDB Atlas (Cloud - အခမဲ့) - လွယ်ကူသော
1. Browser ဖွင့်ပြီး: https://www.mongodb.com/cloud/atlas/register
2. Free account ဖန်တီးပါ
3. Free cluster create လုပ်ပါ (M0 - Free tier)
4. Database Access မှာ user ဖန်တီးပါ
5. Network Access မှာ IP address allow လုပ်ပါ (0.0.0.0/0 = all)
6. Connect button နှိပ်ပြီး "Connect your application" select လုပ်ပါ
7. Connection string ကို copy လုပ်ပါ
8. `backend/.env` file ထဲမှာ `MONGODB_URI` ကို update လုပ်ပါ

**Example:**
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/seaexpress?retryWrites=true&w=majority
```

## 🚀 အဆင့် 2: Backend Server Start လုပ်ရန်

MongoDB install/connect ပြီးရင်:

```powershell
cd backend
npm run dev
```

Backend server က port 5000 မှာ run နေရမယ်။
Console မှာ "MongoDB Connected" message ပေါ်ရမယ်။

## 🌐 အဆင့် 3: Frontend Apps Start လုပ်ရန်

Terminal 3 ခု ထပ်ဖွင့်ပြီး:

### Terminal 1 - User App
```powershell
cd frontend/user
npm run dev
```
Browser: http://localhost:3001

### Terminal 2 - Rider App
```powershell
cd frontend/rider
npm run dev
```
Browser: http://localhost:3002

### Terminal 3 - Admin App
```powershell
cd frontend/admin
npm run dev
```
Browser: http://localhost:3003

## ⚡ Quick Start (MongoDB Atlas သုံးရင်)

1. MongoDB Atlas account ဖန်တီးပါ (5 minutes)
2. Free cluster create လုပ်ပါ
3. Connection string ကို `.env` file ထဲမှာ update လုပ်ပါ
4. Backend start လုပ်ပါ: `cd backend && npm run dev`
5. Frontend apps start လုပ်ပါ

## 📝 Test လုပ်ရန်

Backend start ပြီးရင် browser မှာ:
- http://localhost:5000/api/restaurants (test endpoint)

Frontend apps start ပြီးရင်:
- http://localhost:3001 (User App)
- http://localhost:3002 (Rider App)
- http://localhost:3003 (Admin App)

## ⚠️ အရေးကြီးအချက်

- MongoDB server ကို backend start မီ စတင်ထားရမယ်
- MongoDB Atlas သုံးရင် internet connection လိုမယ်
- Local MongoDB သုံးရင် service running ဖြစ်နေရမယ်

