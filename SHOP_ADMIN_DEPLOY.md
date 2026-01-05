# Shop Admin App - Deployment Guide

## Netlify Deployment

### Step 1: Create Netlify Site

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to your Git repository (GitHub, GitLab, or Bitbucket)

### Step 2: Configure Build Settings

In Netlify Dashboard → **Site settings** → **Build & deploy**:

- **Base directory**: `frontend/shop-admin`
- **Build command**: (Auto-detected from `netlify.toml`)
- **Publish directory**: `dist` (Auto-detected)

Or Netlify will automatically detect the `netlify.toml` file in `frontend/shop-admin/`

### Step 3: Set Environment Variables

Go to **Site settings** → **Environment variables** and add:

```
VITE_API_URL=https://your-backend-api.com/api
```

Replace `https://your-backend-api.com/api` with your actual backend API URL.

### Step 4: Deploy

- Netlify will automatically deploy on every push to your main branch
- Or click **"Trigger deploy"** → **"Deploy site"** for manual deployment

## Configuration Files

The shop-admin app has:
- ✅ `netlify.toml` - Build configuration
- ✅ `.npmrc` - npm configuration (legacy-peer-deps)
- ✅ All routes configured correctly (Dashboard, Products, Orders, Profile)

## Routes Available

- `/` - Dashboard
- `/products` - Products management
- `/orders` - Orders list
- `/orders/:id` - Order details
- `/profile` - Profile settings
- `/login` - Login page

## Build Process

1. Netlify clones your repository
2. Changes to `frontend/shop-admin/` directory
3. Runs `npm install --no-workspaces` (uses `.npmrc` for legacy-peer-deps)
4. Runs `npm run build` (creates `dist/` folder)
5. Publishes `dist/` folder

## Troubleshooting

### Build Fails
- Check that `.npmrc` file exists in `frontend/shop-admin/`
- Verify `legacy-peer-deps=true` is set
- Check build logs in Netlify Dashboard

### App Doesn't Load After Deployment
- Verify `VITE_API_URL` environment variable is set correctly
- Check browser console for errors
- Ensure backend API is accessible from the deployed domain

### Wrong Page Showing
- Clear browser cache
- Check that routes are correctly configured in `App.jsx`
- Verify no conflicting routes

## Custom Domain

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow DNS configuration instructions
4. Netlify will automatically provision SSL certificates

## Preview Deployments

Netlify automatically creates preview deployments for:
- Pull requests
- Branch commits (if branch deploys are enabled)

Access preview URLs from:
- Pull request comments
- Netlify Dashboard → **Deploys**

