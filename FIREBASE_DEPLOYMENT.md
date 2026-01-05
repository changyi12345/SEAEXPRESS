# Firebase Deployment Guide

## Setup Complete ✅

Firebase has been installed and configured in all frontend apps:
- ✅ User App (`frontend/user`)
- ✅ Admin App (`frontend/admin`)
- ✅ Rider App (`frontend/rider`)
- ✅ Restaurant Admin App (`frontend/restaurant-admin`)
- ✅ Shop Admin App (`frontend/shop-admin`)

## Firebase Configuration

All apps use the same Firebase project:
- **Project ID**: `ecommerce-c02c2`
- **Site**: `seaexpress`

## Deployment Steps

### 1. Build the App

First, build the app you want to deploy:

```bash
# For User App
cd frontend/user
npm run build

# For Admin App
cd frontend/admin
npm run build

# For Rider App
cd frontend/rider
npm run build

# For Restaurant Admin App
cd frontend/restaurant-admin
npm run build

# For Shop Admin App
cd frontend/shop-admin
npm run build
```

### 2. Update firebase.json

Before deploying, update `firebase.json` to point to the correct build directory:

**For User App:**
```json
{
  "hosting": {
    "public": "frontend/user/dist",
    ...
  }
}
```

**For Admin App:**
```json
{
  "hosting": {
    "public": "frontend/admin/dist",
    ...
  }
}
```

**For Rider App:**
```json
{
  "hosting": {
    "public": "frontend/rider/dist",
    ...
  }
}
```

**For Restaurant Admin App:**
```json
{
  "hosting": {
    "public": "frontend/restaurant-admin/dist",
    ...
  }
}
```

**For Shop Admin App:**
```json
{
  "hosting": {
    "public": "frontend/shop-admin/dist",
    ...
  }
}
```

### 3. Deploy to Firebase Hosting

```bash
# Make sure you're in the root directory
cd C:\Users\Lenovo\Desktop\SEAEXPRESS

# Deploy
firebase deploy --only hosting:seaexpress
```

### 4. Multiple Sites (Optional)

If you want to deploy multiple apps to different Firebase sites, you can configure multiple hosting targets in `firebase.json`:

```json
{
  "hosting": [
    {
      "target": "user",
      "public": "frontend/user/dist",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "admin",
      "public": "frontend/admin/dist",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "rider",
      "public": "frontend/rider/dist",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

Then deploy to specific targets:
```bash
firebase deploy --only hosting:user
firebase deploy --only hosting:admin
firebase deploy --only hosting:rider
```

## Firebase Services Available

The Firebase SDK is initialized in all apps. You can now use:

- **Analytics**: Already initialized
- **Authentication**: `import { getAuth } from "firebase/auth"`
- **Firestore**: `import { getFirestore } from "firebase/firestore"`
- **Storage**: `import { getStorage } from "firebase/storage"`
- **Functions**: `import { getFunctions } from "firebase/functions"`

## Example: Using Firebase Auth

```javascript
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "./config/firebase";

const auth = getAuth(app);
// Use auth methods...
```

## Troubleshooting

### Error: Directory 'public' does not exist
- Make sure you've built the app first (`npm run build`)
- Check that `firebase.json` points to the correct `dist` directory
- The directory should be relative to the project root

### Error: Site not found
- Make sure your Firebase project has the hosting site configured
- Check `.firebaserc` for the correct project ID
- Run `firebase use --add` to add/select a project

## Next Steps

1. Build your app: `cd frontend/user && npm run build`
2. Update `firebase.json` to point to the correct dist directory
3. Deploy: `firebase deploy --only hosting:seaexpress`

Your app will be available at: `https://seaexpress.web.app` (or your custom domain)

