# Deployment Strategy

## Overview
- **Production (AWS Amplify)**: `main` branch → indulgeout.com
- **Testing (Vercel)**: `staging` branch → vercel-test-url.vercel.app
- **Backend**: Vercel (both environments use same backend for now)

---

## Setup Instructions

### 1. Disable Vercel Auto-Deploy from Main Branch

**Option A: Update Vercel Settings (Recommended)**
1. Go to Vercel Dashboard → Your Project
2. Settings → Git
3. Under "Production Branch", change from `main` to `staging`
4. Save changes

**Option B: vercel.json Configuration (Already Added)**
- Added `git.deploymentEnabled.main: false` to vercel.json
- This prevents automatic deploys from main branch

---

### 2. Create Staging Branch for Vercel Testing

```powershell
# Create and push staging branch
git checkout -b staging
git push -u origin staging
```

**Configure Vercel to use staging branch:**
1. Vercel Dashboard → Project Settings → Git
2. Set "Production Branch" to `staging`
3. Enable auto-deploy for `staging` branch only

---

### 3. Workflow

#### **For Testing Changes (Vercel):**
```powershell
# Work on feature
git checkout staging
git pull origin staging

# Make changes
# ... edit files ...

# Commit and push to staging
git add .
git commit -m "Test: your changes"
git push origin staging

# Vercel will auto-deploy to test URL
```

#### **For Production Deployment (AWS Amplify):**
```powershell
# After testing on Vercel, merge to main
git checkout main
git pull origin main
git merge staging
git push origin main

# AWS Amplify will auto-deploy to production
```

---

### 4. Environment Variables

**Vercel (Testing):**
- `VITE_API_BASE_URL` = Your Vercel backend URL
- `VITE_ENVIRONMENT` = `staging`

**AWS Amplify (Production):**
- `VITE_API_BASE_URL` = Your production backend URL
- `VITE_ENVIRONMENT` = `production`
- `VITE_CASHFREE_MODE` = `production`

---

### 5. AWS Amplify Setup

1. **Connect Repository:**
   - Go to AWS Amplify Console
   - Choose "Host web app"
   - Connect your GitHub repository
   - Select `main` branch

2. **Build Settings:**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Environment Variables:**
   - Add all `VITE_*` variables in Amplify Console
   - Environment variables → Manage variables

4. **Domain Setup:**
   - Custom domains → Add domain
   - Add `indulgeout.com`
   - Follow DNS configuration steps
   - Add SSL certificate (Amplify provides free SSL)

---

### 6. Branch Protection (Optional but Recommended)

Protect the `main` branch on GitHub:
1. Repository Settings → Branches
2. Add branch protection rule for `main`
3. Enable:
   - Require pull request reviews
   - Require status checks to pass
   - Include administrators

This ensures all changes go through staging first.

---

### 7. Monitoring & Rollback

**Vercel (Staging):**
- Check deployments: https://vercel.com/dashboard
- Instant rollback available in dashboard

**AWS Amplify (Production):**
- Check deployments: AWS Amplify Console
- Rollback: Amplify Console → App → Deployments → Redeploy previous version

---

### 8. Emergency Hotfix Workflow

If you need to fix production urgently:

```powershell
# Create hotfix from main
git checkout main
git checkout -b hotfix/urgent-fix

# Make fix
# ... edit files ...

# Commit and merge
git add .
git commit -m "Hotfix: description"
git checkout main
git merge hotfix/urgent-fix
git push origin main

# Then sync staging
git checkout staging
git merge main
git push origin staging
```

---

## Quick Reference

| Environment | Branch | Platform | URL | Auto-Deploy |
|------------|--------|----------|-----|-------------|
| Testing | `staging` | Vercel | vercel-url.vercel.app | ✅ Yes |
| Production | `main` | AWS Amplify | indulgeout.com | ✅ Yes |
| Backend | N/A | Vercel | api-url.vercel.app | Manual |

---

## Current Status

- ✅ vercel.json updated to disable main branch auto-deploy
- ✅ amplify.yml created for AWS Amplify configuration
- ⏳ Need to create `staging` branch
- ⏳ Need to configure Vercel to use `staging` branch
- ⏳ Need to set up AWS Amplify with `main` branch
- ⏳ Need to configure custom domain on AWS Amplify

---

## Notes

- **Backend remains on Vercel** for both environments (for now)
- When ready to move backend, update `VITE_API_BASE_URL` in both environments
- Always test on Vercel staging before pushing to production
- Monitor AWS Amplify costs (free tier: 1000 build minutes/month)
- Consider setting up CloudWatch alarms for monitoring
