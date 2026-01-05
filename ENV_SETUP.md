# Environment Variables Setup Guide

## Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/seaexpress
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/seaexpress?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
```

## Frontend Environment Variables (Optional)

Frontend apps can use `.env` files in each app directory (e.g., `frontend/user/.env`):

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

**Note:** For production, set `VITE_API_URL` to your production backend URL.

## Netlify Environment Variables

For Netlify deployment, set these environment variables in Netlify Dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add the following variables:

### Required for Build:
- `JWT_SECRET` - Your JWT secret key (keep this secret!)
- `MONGODB_URI` - Your MongoDB connection string (keep this secret!)
- `NODE_ENV` - Set to `production` for production builds
- `PORT` - Backend port (default: 5000)

### Optional:
- `VITE_API_URL` - Backend API URL for frontend apps

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` files to Git
- Never expose `JWT_SECRET` or `MONGODB_URI` in code or documentation
- Use Netlify's environment variables for production secrets
- The `.env` file is already in `.gitignore`

## Local Development Setup

1. Copy the example values above
2. Create `backend/.env` file
3. Replace placeholder values with your actual values
4. For MongoDB Atlas, get your connection string from the Atlas dashboard
5. Generate a strong JWT_SECRET (you can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

## Production Setup

For production deployment:
1. Set environment variables in your hosting platform (Netlify, Vercel, etc.)
2. Use strong, unique values for `JWT_SECRET`
3. Use production MongoDB URI
4. Set `NODE_ENV=production`

