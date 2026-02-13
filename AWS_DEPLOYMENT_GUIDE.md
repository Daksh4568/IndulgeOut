# AWS Deployment Guide for IndulgeOut

## Backend: AWS Lambda + Serverless Framework

### Step 1: Install Serverless Framework

```bash
npm install -g serverless
npm install --save-dev serverless-offline serverless-dotenv-plugin
npm install --save serverless-http
```

### Step 2: Configure AWS Credentials

```bash
# Install AWS CLI: https://aws.amazon.com/cli/
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
```

### Step 3: Update package.json Scripts

Add these scripts to your backend package.json:

```json
"scripts": {
  "start": "node index.js",
  "dev": "serverless offline",
  "deploy": "serverless deploy",
  "deploy:prod": "serverless deploy --stage prod",
  "logs": "serverless logs -f api -t",
  "remove": "serverless remove"
}
```

### Step 4: Set Up Environment Variables

Create a `.env` file for local development (already done).

For AWS Lambda, set environment variables in:
1. AWS Systems Manager Parameter Store (recommended for production)
2. Or directly in serverless.yml (less secure)

```bash
# Store secrets in AWS Systems Manager
aws ssm put-parameter --name /indulgeout/prod/MONGODB_URI --value "your-mongodb-uri" --type SecureString
aws ssm put-parameter --name /indulgeout/prod/JWT_SECRET --value "your-jwt-secret" --type SecureString
```

### Step 5: Deploy Backend

```bash
# Deploy to dev stage
npm run deploy

# Deploy to production
npm run deploy:prod
```

Your API will be available at: `https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/dev`

---

## Frontend: AWS Deployment Options

### Option 1: S3 + CloudFront (Recommended - Static Hosting)

**Pros:**
- Cost-effective (~$1-5/month)
- Fast global CDN
- Simple setup
- HTTPS included

**Setup Steps:**

1. **Build your frontend:**
```bash
cd frontend
npm run build
```

2. **Install AWS CLI tools:**
```bash
npm install -g aws-cli
```

3. **Create S3 bucket and deploy:**
```bash
# Create bucket
aws s3 mb s3://indulgeout-frontend --region us-east-1

# Enable static website hosting
aws s3 website s3://indulgeout-frontend --index-document index.html --error-document index.html

# Upload build files
aws s3 sync dist/ s3://indulgeout-frontend --delete

# Make bucket public
aws s3api put-bucket-policy --bucket indulgeout-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::indulgeout-frontend/*"
  }]
}'
```

4. **Set up CloudFront (CDN):**
- Go to AWS CloudFront console
- Create distribution
- Origin: your S3 bucket
- Enable HTTPS
- Add custom domain (optional)

### Option 2: AWS Amplify (Easiest)

**Pros:**
- CI/CD built-in
- Automatic deployments from Git
- HTTPS and custom domains
- Preview environments

**Setup:**

1. **Install Amplify CLI:**
```bash
npm install -g @aws-amplify/cli
amplify configure
```

2. **Initialize Amplify in your frontend folder:**
```bash
cd frontend
amplify init
# Choose defaults or customize
```

3. **Add hosting:**
```bash
amplify add hosting
# Select: Hosting with Amplify Console
```

4. **Deploy:**
```bash
amplify publish
```

5. **Or use Amplify Console (GUI):**
- Go to AWS Amplify Console
- Connect your GitHub/GitLab repo
- It will auto-detect Vite
- Every push to main branch will auto-deploy

### Option 3: AWS EC2 with Nginx (Full Control)

**Use if you need:**
- Server-side rendering
- More control over environment

**Not recommended for your use case** since you have a static React app.

---

## Update Frontend API Configuration

Update your frontend API configuration to use the new Lambda endpoint:

```javascript
// frontend/src/config/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod'
    : 'http://localhost:5000');
```

Add to your frontend `.env.production`:
```
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

---

## Cost Estimates

### Backend (Lambda + API Gateway)
- **Free tier:** 1M requests/month
- **After free tier:** ~$0.20 per 1M requests
- **Estimated cost:** $5-20/month for moderate traffic

### Frontend (S3 + CloudFront)
- **S3 storage:** ~$0.023/GB
- **CloudFront:** ~$0.085/GB transfer
- **Estimated cost:** $1-5/month

### Total: ~$6-25/month (much cheaper than Vercel Pro)

---

## Migration Checklist

- [ ] Install Serverless Framework
- [ ] Create serverless.yml configuration
- [ ] Update index.js for Lambda handler
- [ ] Test locally with `serverless offline`
- [ ] Deploy backend to AWS Lambda
- [ ] Test backend API endpoints
- [ ] Update frontend API URL
- [ ] Build frontend for production
- [ ] Deploy frontend to S3 + CloudFront or Amplify
- [ ] Update CORS settings in backend
- [ ] Set up custom domain (optional)
- [ ] Configure SSL certificates
- [ ] Set up monitoring (CloudWatch)
- [ ] Test entire flow

---

## Deployment Commands Reference

### Backend
```bash
# Local development
npm run dev

# Deploy to dev
serverless deploy

# Deploy to production
serverless deploy --stage prod

# View logs
serverless logs -f api -t

# Remove deployment
serverless remove
```

### Frontend (S3)
```bash
# Build
npm run build

# Deploy
aws s3 sync dist/ s3://indulgeout-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Frontend (Amplify)
```bash
amplify publish
```

---

## Recommended: Amplify for Frontend

For your use case, I recommend **AWS Amplify** for the frontend because:
1. ✅ Automatic CI/CD from Git
2. ✅ Preview branches for testing
3. ✅ HTTPS included
4. ✅ Custom domain support
5. ✅ Environment variables management
6. ✅ Easy rollbacks
7. ✅ Similar developer experience to Vercel

It's the closest AWS equivalent to Vercel's frontend hosting.
