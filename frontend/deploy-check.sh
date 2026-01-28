#!/bin/bash

# AWS Amplify Pre-Deployment Checklist Script
# Run this before deploying to AWS Amplify

echo "🚀 AWS Amplify Pre-Deployment Checklist"
echo "========================================"
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from frontend directory"
    exit 1
fi

echo "✅ Running in frontend directory"
echo ""

# Check for required files
echo "📋 Checking required files..."
FILES=("amplify.yml" "_redirects" ".env.production" "package.json" "vite.config.js")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ Missing: $file"
        exit 1
    fi
done
echo ""

# Check environment variables
echo "🔐 Checking environment variables..."
if grep -q "VITE_API_URL" .env.production; then
    echo "  ✅ VITE_API_URL configured"
else
    echo "  ❌ VITE_API_URL not found in .env.production"
    exit 1
fi
echo ""

# Test build
echo "🔨 Testing production build..."
npm run build
if [ $? -eq 0 ]; then
    echo "  ✅ Build successful"
else
    echo "  ❌ Build failed"
    exit 1
fi
echo ""

# Check dist folder
if [ -d "dist" ]; then
    echo "  ✅ dist folder created"
    echo "  📦 Build size: $(du -sh dist | cut -f1)"
else
    echo "  ❌ dist folder not found"
    exit 1
fi
echo ""

echo "✨ All checks passed!"
echo ""
echo "📋 Next Steps:"
echo "1. Commit and push your changes to GitHub"
echo "2. Go to AWS Amplify Console"
echo "3. Connect your GitHub repository"
echo "4. AWS Amplify will use amplify.yml for build configuration"
echo "5. Add environment variables in Amplify Console"
echo "6. Deploy!"
echo ""
echo "Need help? Check AWS_AMPLIFY_DEPLOYMENT.md for detailed instructions"
