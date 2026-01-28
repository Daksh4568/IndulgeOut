# AWS Amplify Pre-Deployment Checklist Script (PowerShell)
# Run this before deploying to AWS Amplify

Write-Host "🚀 AWS Amplify Pre-Deployment Checklist" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the frontend directory
if (-Not (Test-Path "package.json")) {
    Write-Host "❌ Error: Must run from frontend directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Running in frontend directory" -ForegroundColor Green
Write-Host ""

# Check for required files
Write-Host "📋 Checking required files..." -ForegroundColor Yellow
$files = @("amplify.yml", "_redirects", ".env.production", "package.json", "vite.config.js")
$allFilesExist = $true

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Missing: $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-Not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ Some required files are missing!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check environment variables
Write-Host "🔐 Checking environment variables..." -ForegroundColor Yellow
if (Select-String -Path ".env.production" -Pattern "VITE_API_URL" -Quiet) {
    Write-Host "  ✅ VITE_API_URL configured" -ForegroundColor Green
} else {
    Write-Host "  ❌ VITE_API_URL not found in .env.production" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test build
Write-Host "🔨 Testing production build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "  ❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check dist folder
if (Test-Path "dist") {
    Write-Host "  ✅ dist folder created" -ForegroundColor Green
    $size = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  📦 Build size: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "  ❌ dist folder not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "✨ All checks passed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Commit and push your changes to GitHub" -ForegroundColor White
Write-Host "2. Go to AWS Amplify Console" -ForegroundColor White
Write-Host "3. Connect your GitHub repository" -ForegroundColor White
Write-Host "4. AWS Amplify will use amplify.yml for build configuration" -ForegroundColor White
Write-Host "5. Add environment variables in Amplify Console:" -ForegroundColor White
Write-Host "   VITE_API_URL=https://indulge-out-git-main-daksh-pratap-singhs-projects-a6093574.vercel.app" -ForegroundColor Cyan
Write-Host "6. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "Need help? Check AWS_AMPLIFY_DEPLOYMENT.md for detailed instructions" -ForegroundColor Yellow
