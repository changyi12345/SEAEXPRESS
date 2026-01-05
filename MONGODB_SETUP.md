# MongoDB Setup Guide (မြန်မာ)

## MongoDB Server Install လုပ်ရန်

### Option 1: MongoDB Community Server Download
1. https://www.mongodb.com/try/download/community သို့သွားပါ
2. Windows x64 version download လုပ်ပါ
3. Installer run လုပ်ပြီး install လုပ်ပါ
4. "Install MongoDB as a Service" option ကို select လုပ်ပါ

### Option 2: MongoDB Atlas (Cloud - အခမဲ့)
Cloud version သုံးချင်ရင်:
1. https://www.mongodb.com/cloud/atlas/register သို့သွားပါ
2. Free tier account ဖန်တီးပါ
3. Cluster create လုပ်ပါ
4. Connection string ကို `.env` file ထဲမှာ update လုပ်ပါ

## MongoDB Server Start လုပ်ရန်

### Windows Service အနေနဲ့ (Auto Start)
MongoDB install လုပ်ထားရင် service က auto start ဖြစ်နေရမယ်။

### Manual Start
```powershell
# MongoDB bin folder path သို့သွားပါ (usually C:\Program Files\MongoDB\Server\7.0\bin)
cd "C:\Program Files\MongoDB\Server\7.0\bin"
.\mongod.exe
```

## MongoDB Connection Test လုပ်ရန်

mongosh (MongoDB Shell) သုံးပြီး test လုပ်ပါ:

```powershell
# mongosh folder ထဲသို့သွားပါ
cd mongosh-2.5.10-win32-x64\bin
.\mongosh.exe
```

MongoDB connect ဖြစ်ရင်:
```javascript
show dbs
```

## MongoDB Compass (GUI Tool) - Optional
Visual interface လိုချင်ရင်:
1. https://www.mongodb.com/try/download/compass download လုပ်ပါ
2. Install လုပ်ပါ
3. Connect to: `mongodb://localhost:27017`

