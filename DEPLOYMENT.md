# IndulgeOut Deployment Guide

## 🚀 Deploying to Vercel

### Prerequisites
- GitHub repository with your code
- Vercel account (free)
- MongoDB Atlas database (free tier available)

### Backend Deployment

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select the `backend` folder as root directory

3. **Configure Environment Variables**
   Go to Project Settings > Environment Variables and add:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/indulgeout
   JWT_SECRET=your_super_secret_jwt_key_here
   NODE_ENV=production
   PORT=5000
   ```

4. **Deploy**
   - Vercel will automatically deploy
   - Note your backend URL (e.g., `https://your-backend.vercel.app`)

### Frontend Deployment

1. **Create New Project**
   - Click "New Project" again
   - Import the same repository
   - Select the `frontend` folder as root directory

2. **Configure Environment Variables**
   Go to Project Settings > Environment Variables and add:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```

3. **Deploy**
   - Vercel will build and deploy your React app
   - Your frontend will be available at `https://your-frontend.vercel.app`

### Important Notes

- Both frontend and backend are deployed as separate projects
- The backend runs as serverless functions
- MongoDB should be hosted on MongoDB Atlas (cloud)
- Environment variables are set in Vercel dashboard, not in code

### Vercel Configuration Files

The following files have been created for you:

**Backend (vercel.json):**
```json
{
  "version": 2,
  "name": "indulgeout-backend",
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Frontend (vercel.json):**
```json
{
  "version": 2,
  "name": "indulgeout-frontend", 
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Testing Deployment

1. Visit your frontend URL
2. Try registering a new account
3. Test creating and viewing events
4. Verify all API calls work correctly

### Troubleshooting

- Check Vercel function logs for backend errors
- Ensure MongoDB Atlas allows connections from 0.0.0.0/0
- Verify environment variables are set correctly
- Check CORS settings if you get cross-origin errors