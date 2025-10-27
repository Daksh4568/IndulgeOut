# Vercel Deployment Fix Instructions

## 🚨 Issue Identified
The backend deployment is failing because:
1. Double slash in API URLs (`//api/auth/login`)
2. Incorrect serverless function configuration
3. CORS preflight request issues

## ✅ Fixes Applied

### Backend Changes:
1. **Fixed server.js** - Removed duplicate MongoDB connection
2. **Added Vercel export** - `export default app;`
3. **Created index.js** - Proper entry point for Vercel
4. **Updated vercel.json** - Better routing configuration

### Frontend Changes:
1. **Created .env file** with your backend URL
2. **API configuration** uses environment variables properly

## 🚀 Redeploy Instructions

### Step 1: Commit Changes
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### Step 2: Redeploy Backend
1. Go to your Vercel dashboard
2. Find your backend project
3. Click "Redeploy" or trigger a new deployment
4. Test the health endpoint: `https://your-backend.vercel.app/api/health`

### Step 3: Update Frontend Environment Variable
1. Go to your frontend project in Vercel
2. Go to Settings > Environment Variables
3. Set: `VITE_API_URL = https://your-actual-backend-url.vercel.app`
4. Redeploy frontend

### Step 4: Test
Visit your frontend URL and try:
- User registration
- User login
- Event creation

## 🔧 Environment Variables Needed

### Backend (Vercel Dashboard):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/indulgeout
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
NODE_ENV=production
```

### Frontend (Vercel Dashboard):
```
VITE_API_URL=https://your-backend-deployment-url.vercel.app
```

## 🐛 Troubleshooting

### If still getting 404:
1. Check Vercel function logs
2. Ensure MongoDB Atlas allows connections from `0.0.0.0/0`
3. Verify environment variables are set correctly

### If CORS errors persist:
1. Check that backend is actually running
2. Test API endpoints directly in browser
3. Ensure no trailing slashes in API_BASE_URL

### Quick Test URLs:
- Backend health: `https://your-backend.vercel.app/api/health`
- Should return: `{"message": "IndulgeOut API is running!"}`

## 📝 Notes
- Backend uses serverless functions (no persistent server)
- Each API call is a separate function invocation
- Cold starts may cause initial delays
- MongoDB connection is established per request