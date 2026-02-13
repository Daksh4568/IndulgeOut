# AWS Amplify Deployment Guide for IndulgeOut

## 🚀 Deployment Strategy

**Production:** AWS Amplify (indulgeout.com)  
**Testing:** Vercel (current deployment)  
**Backend:** Vercel (for next 2-3 days, then migrate to AWS)

---

## 📋 Step-by-Step AWS Amplify Setup

### 1. Prerequisites
- ✅ GitHub repository with your frontend code
- ✅ AWS Account with billing enabled
- ✅ Domain registered (indulgeout.com)

### 2. Initial AWS Amplify Setup

#### A. Create Amplify App
1. Go to AWS Console → AWS Amplify
2. Click **"New app"** → **"Host web app"**
3. Select **GitHub** as your repository provider
4. Authorize AWS Amplify to access your GitHub account
5. Select repository: `IndulgeOut`
6. Select branch: `main`

#### B. Configure Build Settings
1. App name: `IndulgeOut-Frontend-Production`
2. Environment name: `production`
3. Build settings will auto-detect Vite - verify it shows:
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
   ```
4. Advanced settings → Monorepo detection:
   - Root directory: `frontend`

### 3. Environment Variables Configuration

Click **"Advanced settings"** and add these environment variables:

```
VITE_API_URL=https://indulge-out-git-main-daksh-pratap-singhs-projects-a6093574.vercel.app
```

**Important:** Make sure to use `VITE_` prefix for all Vite environment variables.

### 4. Custom Domain Setup (indulgeout.com)

#### A. Add Custom Domain
1. In Amplify Console, go to **"Domain management"**
2. Click **"Add domain"**
3. Enter: `indulgeout.com`
4. AWS will automatically suggest adding `www.indulgeout.com` as well - keep it checked
5. Click **"Configure domain"**

#### B. Update DNS Records
AWS Amplify will provide you with DNS records. Update your domain registrar:

**Option 1: Using Route 53 (Recommended)**
- Transfer domain to Route 53 or use Route 53 as DNS
- AWS will automatically configure everything

**Option 2: External Domain Registrar (GoDaddy/Namecheap/etc.)**
Add these DNS records:

**For root domain (indulgeout.com):**
```
Type: CNAME (or ALIAS if supported)
Name: @
Value: [provided by AWS Amplify]
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: [provided by AWS Amplify]
```

#### C. SSL Certificate
- AWS Amplify automatically provisions SSL certificate via AWS Certificate Manager
- Takes 5-10 minutes to validate
- HTTPS will be enabled automatically

### 5. Branch Deployments & Testing Strategy

#### Production Branch (main)
- URL: `https://indulgeout.com`
- Auto-deploys on push to `main` branch
- Environment: `production`

#### Testing on Vercel
- Keep your existing Vercel deployment
- URL: `https://[your-vercel-url].vercel.app`
- Use for testing before merging to main

### 6. Build & Deploy Settings

#### Enable Auto-Deploy
1. Go to **"Build settings"**
2. Ensure **"Automatically build and deploy"** is enabled
3. Select branch: `main`

#### Performance Optimizations
Add to `amplify.yml` (already created):
- ✅ Asset caching (31536000 seconds = 1 year)
- ✅ Security headers
- ✅ SPA routing support

### 7. Monitoring & Logs

Access deployment logs:
1. Amplify Console → Your App
2. Click on specific deployment
3. View logs for each phase:
   - Provision
   - Build
   - Deploy
   - Verify

---

## 🔄 Deployment Workflow

### For Production Updates:
```bash
# Make changes in frontend folder
cd frontend

# Test locally
npm run dev

# Build and test production build
npm run build
npm run preview

# Commit and push to main
git add .
git commit -m "feat: your feature description"
git push origin main

# AWS Amplify will automatically deploy
```

### For Testing on Vercel:
```bash
# Create a testing branch
git checkout -b testing/your-feature

# Make changes and commit
git add .
git commit -m "test: your feature"
git push origin testing/your-feature

# Vercel will automatically create a preview deployment
# Test the preview URL
# If good, merge to main for production deploy
```

---

## 🔧 Advanced Configuration

### Custom Redirects & Rewrites
Already configured in `amplify.yml`:
- All routes redirect to `/index.html` (SPA support)
- Handles React Router routes properly

### Environment-Specific Builds

**Create `.env.production` for AWS Amplify:**
```env
VITE_API_URL=https://indulge-out-git-main-daksh-pratap-singhs-projects-a6093574.vercel.app
```

**Keep `.env.development` for local dev:**
```env
VITE_API_URL=http://localhost:5000
```

**Vercel Testing Environment:**
```env
VITE_API_URL=https://indulge-out-git-main-daksh-pratap-singhs-projects-a6093574.vercel.app
```

### Backend Migration (After 2-3 Days)
When you migrate backend to AWS:

1. Update environment variable in Amplify:
   ```
   VITE_API_URL=https://api.indulgeout.com
   ```
2. Redeploy (or it will auto-deploy on next commit)
3. Update Vercel testing environment similarly

---

## 📊 Deployment Comparison

| Feature | AWS Amplify (Production) | Vercel (Testing) |
|---------|-------------------------|------------------|
| URL | indulgeout.com | vercel-url.vercel.app |
| Auto Deploy | ✅ On main branch | ✅ On all branches |
| Custom Domain | ✅ indulgeout.com | ❌ Vercel subdomain |
| SSL | ✅ Auto (ACM) | ✅ Auto |
| Build Time | ~2-3 min | ~1-2 min |
| CDN | ✅ CloudFront | ✅ Vercel Edge |
| Branch Previews | ✅ Optional | ✅ Automatic |
| Cost | Pay as you go | Free (Hobby) |

---

## 🚨 Troubleshooting

### Build Fails
1. Check build logs in Amplify Console
2. Verify `amplify.yml` is in root of frontend folder
3. Ensure `package.json` scripts are correct
4. Check environment variables are set

### Domain Not Working
1. Wait 24-48 hours for DNS propagation
2. Verify DNS records in your registrar
3. Check SSL certificate status in Amplify
4. Try accessing via `https://` explicitly

### API Calls Failing
1. Verify `VITE_API_URL` environment variable
2. Check CORS settings on backend
3. Ensure backend is accessible from AWS CloudFront IPs

### Routing Issues (404 on refresh)
1. Verify `amplify.yml` has SPA rewrite rules
2. Check that all routes redirect to `/index.html`

---

## 🎯 Next Steps After Deployment

1. **Monitor First Deployment:**
   - Check build logs
   - Test all routes
   - Verify API connectivity
   - Test authentication flow

2. **Performance Testing:**
   - Run Lighthouse audit
   - Check Core Web Vitals
   - Test mobile responsiveness

3. **SEO Setup:**
   - Add meta tags
   - Configure sitemap
   - Add robots.txt

4. **Analytics:**
   - Set up AWS CloudWatch
   - Add Google Analytics
   - Monitor error rates

---

## 📞 Support Resources

- **AWS Amplify Docs:** https://docs.amplify.aws/
- **Vite + Amplify Guide:** https://docs.amplify.aws/start/q/integration/vite
- **Domain Setup:** https://docs.amplify.aws/guides/hosting/custom-domains/

---

## ✅ Checklist Before Going Live

- [ ] GitHub repository connected to Amplify
- [ ] Build settings configured correctly
- [ ] Environment variables added
- [ ] Domain DNS records updated
- [ ] SSL certificate active
- [ ] Test all routes work
- [ ] API calls functioning
- [ ] Authentication working
- [ ] Mobile responsive verified
- [ ] Performance optimized
- [ ] Error monitoring setup
