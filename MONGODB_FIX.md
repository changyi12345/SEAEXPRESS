# MongoDB Connection Error Fix (မြန်မာ)

## ❌ Error ကို ဖြေရှင်းရန်

Error: `bad auth : authentication failed` ဆိုတာ MongoDB Atlas connection string မှာ username/password မှားနေတာပါ။

## ✅ ဖြေရှင်းနည်း

### 1. MongoDB Atlas မှာ Connection String ကို ပြန်ယူရန်

1. MongoDB Atlas website သို့သွားပါ: https://cloud.mongodb.com
2. Your cluster ကို click လုပ်ပါ
3. "Connect" button ကို click လုပ်ပါ
4. "Connect your application" ကို select လုပ်ပါ
5. Connection string ကို copy လုပ်ပါ

**Example connection string:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/seaexpress?retryWrites=true&w=majority
```

### 2. Username & Password ကို Update လုပ်ရန်

Connection string ထဲမှာ:
- `<username>` - MongoDB Atlas မှာ ဖန်တီးထားတဲ့ database user username
- `<password>` - Database user password

**⚠️ အရေးကြီး:** Password ထဲမှာ special characters (ဥပမာ: `@`, `#`, `%`) ရှိရင် URL encoding လုပ်ရမယ်:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`

### 3. Database User ဖန်တီးရန် (အကယ်၍ မရှိသေးရင်)

1. MongoDB Atlas → Database Access
2. "Add New Database User" click လုပ်ပါ
3. Username & Password ထည့်ပါ
4. Database User Privileges: "Atlas admin" သို့မဟုတ် "Read and write to any database"
5. "Add User" click လုပ်ပါ

### 4. IP Address Whitelist လုပ်ရန်

1. MongoDB Atlas → Network Access
2. "Add IP Address" click လုပ်ပါ
3. "Allow Access from Anywhere" (0.0.0.0/0) select လုပ်ပါ
4. "Confirm" click လုပ်ပါ

### 5. .env File Update လုပ်ရန်

`backend/.env` file ကို ဖွင့်ပြီး:

```env
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/seaexpress?retryWrites=true&w=majority
JWT_SECRET=seaexpress_super_secret_jwt_key_2024_change_in_production
NODE_ENV=development
```

**YOUR_USERNAME** နဲ့ **YOUR_PASSWORD** ကို MongoDB Atlas မှာ ဖန်တီးထားတဲ့ database user credentials နဲ့ replace လုပ်ပါ။

### 6. Backend Server Restart လုပ်ရန်

`.env` file update လုပ်ပြီးရင်:
- Terminal မှာ `Ctrl+C` နှိပ်ပြီး server ကို stop လုပ်ပါ
- `npm run dev` ကို ပြန် run လုပ်ပါ

## 🔍 Connection String Format

```
mongodb+srv://[username]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority
```

## ✅ Test လုပ်ရန်

Backend server start လုပ်ပြီးရင် console မှာ:
```
MongoDB Connected
```
ဆိုတာ ပေါ်ရမယ်။

## 🆘 အကယ်၍ ဆက်ပြီး Error ဖြစ်နေရင်

1. MongoDB Atlas cluster က running ဖြစ်နေရမယ်
2. Database user password ကို reset လုပ်ကြည့်ပါ
3. Connection string ကို MongoDB Compass မှာ test လုပ်ကြည့်ပါ

