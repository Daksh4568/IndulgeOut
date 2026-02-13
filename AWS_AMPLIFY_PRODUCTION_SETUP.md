# AWS Amplify Production Deployment Guide

## Overview
- **AWS Amplify**: Production deployment (indulgeout.in domain)
- **Vercel**: Testing/staging deployment (vercel domain)
- **Backend**: Vercel (for now, 2-3 days)

---

## Step 1: Git Branch Strategy

### Create a separate testing branch for Vercel

```bash
# Create and push a testing/staging branch
git checkout -b staging
git push origin staging
```

**Purpose**: Vercel will deploy from `staging` branch, AWS Amplify from `main` branch.

---

## Step 2: Configure Vercel to Deploy from Staging Branch

### Option A: Vercel Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `IndulgeOut-frontend` project
3. Go to **Settings** → **Environments** (in the left sidebar)
4. Click on the **Production** environment
5. Under **Branch Tracking**, change from `main` to `staging`
6. Click **Save**

### Option B: Via `vercel.json`
Update your `frontend/vercel.json`:
```json
{
  "git": {
    "deploymentEnabled": {
      "main": false,
      "staging": true
    }
  },
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

**Result**: Vercel will only auto-deploy when you push to `staging` branch.

---

## Step 3: Workflow for Making Changes

### For Testing Changes (Deploy to Vercel)
```bash
# Make changes on staging branch
git checkout staging
# Make your changes...
git add .
git commit -m "Test: your feature"
git push origin staging
# Vercel auto-deploys staging branch
```

### For Production Changes (Deploy to AWS Amplify)
```bash
# After testing on staging, merge to main
git checkout main
git merge staging
git push origin main
# AWS Amplify auto-deploys main branch
```

**Alternative**: You can also cherry-pick specific commits:
```bash
git checkout main
git cherry-pick <commit-hash>
git push origin main
```

---

## Step 4: AWS Amplify Setup

### 4.1 Connect Repository
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **New app** → **Host web app**
3. Select **GitHub** as provider
4. Authorize AWS Amplify to access your GitHub repos
5. Select repository: `IndulgeOut`
6. Select branch: `main`

### 4.2 Build Settings
Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

**Important**: Specify `frontend` as the root directory since your repo has both frontend and backend.

### 4.3 Environment Variables
Add these in AWS Amplify Console → **Environment variables**:

```
VITE_API_URL=https://your-backend.vercel.app/api
NODE_ENV=production
```

### 4.4 Advanced Settings
- **Node.js version**: 18 or 20 (check your package.json)
- **Build timeout**: 15 minutes (default is 5)
- **Enable auto-build**: Yes (for main branch only)

---

## Step 5: Domain Configuration (indulgeout.in)

### 5.1 Add Custom Domain in AWS Amplify
1. In AWS Amplify Console, go to **Domain management**
2. Click **Add domain**
3. Enter `indulgeout.in`
4. Amplify will provide DNS records (CNAME or A record)

### 5.2 Update DNS Records
In your domain registrar (GoDaddy/Namecheap/etc):

**For root domain (indulgeout.in)**:
```
Type: A
Name: @
Value: [AWS Amplify IP provided]
```

**For www subdomain**:
```
Type: CNAME
Name: www
Value: [amplify-domain].amplifyapp.com
```

### 5.3 SSL Certificate
- AWS Amplify automatically provisions SSL certificate
- Wait 15-30 minutes for DNS propagation
- Certificate status will show as "Issued"

---

## Step 6: Environment-Specific Configuration

### Update `frontend/src/config/api.js`

```javascript
// Detect environment
const getBaseURL = () => {
  // Production (AWS Amplify)
  if (window.location.hostname === 'indulgeout.in' || 
      window.location.hostname === 'www.indulgeout.in') {
    return 'https://your-backend.vercel.app/api';
  }
  
  // Staging (Vercel)
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://your-backend.vercel.app/api';
  }
  
  // Development
  return 'http://localhost:5000/api';
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});
```

---

## Step 7: Deployment Checklist

### Before First Production Deploy:

- [ ] Create `staging` branch
- [ ] Configure Vercel to deploy from `staging` branch
- [ ] Verify Vercel staging deployment works
- [ ] Push to `main` branch
- [ ] Connect AWS Amplify to `main` branch
- [ ] Configure build settings in Amplify
- [ ] Add environment variables in Amplify
- [ ] Wait for first build to complete
- [ ] Add custom domain in Amplify
- [ ] Update DNS records
- [ ] Wait for SSL certificate (15-30 mins)
- [ ] Test production deployment at indulgeout.in
- [ ] Verify all features work on production

### Testing Checklist:
- [ ] Homepage loads correctly
- [ ] Login/signup works
- [ ] Event registration works
- [ ] Payment integration works
- [ ] API calls succeed
- [ ] Images load properly
- [ ] Mobile responsive
- [ ] Dark mode works

---

## Step 8: Monitoring & Logs

### AWS Amplify Logs
- Build logs: Amplify Console → Your App → Build history
- Access logs: Enable in CloudWatch (optional)
- Performance: Amplify Console → Analytics

### Vercel Logs (Staging)
- Deployments: Vercel Dashboard → Your Project → Deployments
- Runtime logs: Deployment → View Function Logs

---

## Step 9: Rollback Strategy

### If Production Has Issues:

**Option 1: Quick Rollback in Amplify**
1. Go to AWS Amplify Console
2. Click on previous successful build
3. Click **Redeploy this version**

**Option 2: Revert Git Commit**
```bash
git revert <commit-hash>
git push origin main
# Amplify auto-deploys the reverted version
```

**Option 3: Disable Auto-Deploy**
1. In Amplify Console → App settings
2. Disable auto-deploy temporarily
3. Manually trigger specific build

---

## Step 10: Cost Estimation

### AWS Amplify Pricing (Approximate)
- **Build minutes**: $0.01 per build minute (~5-10 mins per build)
- **Hosting**: $0.15 per GB served
- **Data transfer**: First 15 GB free, then $0.15/GB

**Estimated monthly cost**: $5-20 depending on traffic

### Vercel Pricing (Staging)
- **Hobby plan**: Free (100 GB bandwidth)
- **Pro plan**: $20/month (if needed)

---

## Step 11: Future Migration (Backend to AWS)

When ready to move backend from Vercel to AWS:

### Option A: AWS Lambda + API Gateway
- More control, serverless
- Need to refactor backend slightly

### Option B: AWS Elastic Beanstalk
- Similar to Vercel, easier migration
- Just deploy Node.js app

### Option C: AWS ECS/Fargate
- Containerized deployment
- More scalable, complex setup

**For now**: Keep backend on Vercel, update frontend API URLs when migrating.

---

## Quick Reference Commands

```bash
# Work on staging (Vercel testing)
git checkout staging
git add .
git commit -m "feat: your changes"
git push origin staging

# Promote to production (AWS Amplify)
git checkout main
git merge staging
git push origin main

# Or cherry-pick specific commits
git checkout main
git cherry-pick <commit-hash>
git push origin main

# Emergency rollback
git revert HEAD
git push origin main
```

---

## Troubleshooting

### Issue: Vercel still deploying from main
**Solution**: 
1. Check Vercel project settings
2. Ensure production branch is set to `staging`
3. Disable auto-deploy for main branch

### Issue: AWS Amplify build fails
**Solution**:
1. Check build logs in Amplify Console
2. Verify `frontend` directory structure
3. Check Node.js version compatibility
4. Ensure environment variables are set

### Issue: Domain not resolving
**Solution**:
1. Check DNS propagation: https://dnschecker.org
2. Verify DNS records match Amplify instructions
3. Wait 24-48 hours for full propagation
4. Check SSL certificate status in Amplify

### Issue: API calls failing
**Solution**:
1. Check CORS settings in backend
2. Verify `VITE_API_URL` environment variable
3. Check browser console for errors
4. Ensure backend allows production domain

---

## Support Resources

- **AWS Amplify Docs**: https://docs.amplify.aws/
- **Vercel Docs**: https://vercel.com/docs
- **Your backend URL**: Update in environment variables
- **DNS Checker**: https://dnschecker.org

---

## Summary

1. ✅ Create `staging` branch for Vercel testing
2. ✅ Configure Vercel to deploy only from `staging`
3. ✅ Keep `main` branch for AWS Amplify production
4. ✅ Set up AWS Amplify with custom domain
5. ✅ Test on staging before promoting to production
6. ✅ Monitor both deployments independently

**Result**: Clean separation between testing (Vercel) and production (AWS Amplify), both auto-deploying from their respective branches!
