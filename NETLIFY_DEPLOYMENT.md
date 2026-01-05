# Netlify Deployment Guide

## Overview

Each frontend app has its own `netlify.toml` configuration file for independent deployment.

## Apps Available for Deployment

1. **User App** - `frontend/user/`
2. **Admin App** - `frontend/admin/`
3. **Rider App** - `frontend/rider/`
4. **Restaurant Admin App** - `frontend/restaurant-admin/`
5. **Shop Admin App** - `frontend/shop-admin/`

## Deployment Setup

### Option 1: Separate Netlify Sites (Recommended)

Each app can be deployed as a separate Netlify site:

1. **Create a new site in Netlify Dashboard**
2. **Connect to your Git repository**
3. **Configure build settings:**
   - **Base directory**: Set to the app directory (e.g., `frontend/admin`)
   - **Build command**: Will be auto-detected from `netlify.toml`
   - **Publish directory**: `dist` (auto-detected)

### Option 2: Monorepo with Multiple Sites

You can deploy multiple apps from the same repository:

1. In Netlify Dashboard, go to **Site settings** → **Build & deploy**
2. Set **Base directory** to the specific app directory
3. Netlify will automatically use the `netlify.toml` in that directory

## Configuration Files

Each app has:
- `netlify.toml` - Build and deployment configuration
- `.npmrc` - npm configuration for legacy peer deps

## Environment Variables

Set these in Netlify Dashboard → **Site settings** → **Environment variables**:

### Required:
- `VITE_API_URL` - Backend API URL (e.g., `https://your-backend-api.com/api`)

### Optional:
- `NODE_ENV` - Set to `production` for production builds

## Build Configuration

Each `netlify.toml` includes:
- **Base directory**: Points to the app directory
- **Build command**: `npm install --no-workspaces && npm run build`
- **Publish directory**: `dist`
- **Secrets scanning**: Configured to ignore false positives
- **SPA redirects**: All routes redirect to `index.html`

## Deployment Steps

### For Each App:

1. **Create Netlify Site:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to your Git repository

2. **Configure Build Settings:**
   - **Base directory**: `frontend/[app-name]`
   - Netlify will auto-detect `netlify.toml`

3. **Set Environment Variables:**
   - `VITE_API_URL` = Your backend API URL

4. **Deploy:**
   - Netlify will automatically deploy on every push to your main branch
   - Or trigger a manual deploy

## Example URLs After Deployment

- User App: `https://seaexpress-user.netlify.app`
- Admin App: `https://seaexpress-admin.netlify.app`
- Rider App: `https://seaexpress-rider.netlify.app`
- Restaurant Admin: `https://seaexpress-restaurant-admin.netlify.app`
- Shop Admin: `https://seaexpress-shop-admin.netlify.app`

## Troubleshooting

### Build Fails with Dependency Errors
- Check that `.npmrc` file exists in the app directory
- Verify `legacy-peer-deps=true` is set

### Build Fails with "Directory not found"
- Verify **Base directory** is set correctly in Netlify settings
- Check that `netlify.toml` exists in the app directory

### Secrets Scanning Errors
- The configuration already ignores common false positives
- If you see errors, check `SECRETS_SCAN_OMIT_PATHS` in `netlify.toml`

### Build Succeeds but App Doesn't Load
- Check that `VITE_API_URL` environment variable is set
- Verify the backend API is accessible
- Check browser console for errors

## Custom Domain Setup

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Follow the DNS configuration instructions
4. Netlify will automatically provision SSL certificates

## Continuous Deployment

By default, Netlify will:
- Deploy on every push to the main branch
- Run build with the configuration in `netlify.toml`
- Deploy previews for pull requests

You can configure branch deployments in **Site settings** → **Build & deploy** → **Branch deploys**.

