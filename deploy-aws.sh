#!/bin/bash

# AWS Deployment Script for IndulgeOut

echo "🚀 Starting AWS Deployment Process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command_exists aws; then
    echo -e "${YELLOW}⚠️  AWS CLI not found. Installing...${NC}"
    # Instructions for AWS CLI installation
    echo "Please install AWS CLI from: https://aws.amazon.com/cli/"
    exit 1
fi

if ! command_exists serverless; then
    echo -e "${YELLOW}⚠️  Serverless Framework not found. Installing...${NC}"
    npm install -g serverless
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Deploy Backend
echo -e "${YELLOW}\n📦 Deploying Backend to AWS Lambda...${NC}"
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Deploy based on argument
STAGE=${1:-dev}
echo "Deploying to stage: $STAGE"

serverless deploy --stage $STAGE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    
    # Save API endpoint
    API_URL=$(serverless info --stage $STAGE | grep "endpoint" | awk '{print $2}')
    echo -e "${GREEN}API Endpoint: $API_URL${NC}"
    echo "$API_URL" > ../frontend/.env.production
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

# Deploy Frontend
echo -e "${YELLOW}\n📦 Deploying Frontend...${NC}"
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build frontend
echo "Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully!${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Deploy to S3 (if configured)
BUCKET_NAME="indulgeout-frontend-$STAGE"

echo "Checking if S3 bucket exists..."
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating S3 bucket..."
    aws s3 mb "s3://$BUCKET_NAME" --region us-east-1
    
    # Enable static website hosting
    aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document index.html
    
    # Make bucket public
    aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy "{
        \"Version\": \"2012-10-17\",
        \"Statement\": [{
            \"Effect\": \"Allow\",
            \"Principal\": \"*\",
            \"Action\": \"s3:GetObject\",
            \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
        }]
    }"
fi

# Upload to S3
echo "Uploading to S3..."
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    echo -e "${GREEN}Frontend URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}\n🎉 Deployment Complete!${NC}"
echo -e "${GREEN}Backend API: $API_URL${NC}"
echo -e "${GREEN}Frontend: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com${NC}"
