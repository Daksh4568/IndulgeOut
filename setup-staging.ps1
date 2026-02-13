# Setup Staging Branch for Vercel Testing
# This script creates a staging branch and configures your workflow

Write-Host "🚀 Setting up deployment branches..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not a git repository!" -ForegroundColor Red
    Write-Host "Please run this script from your project root." -ForegroundColor Yellow
    exit 1
}

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Green

# Create staging branch from main
Write-Host ""
Write-Host "Creating staging branch..." -ForegroundColor Cyan
git checkout main
git pull origin main

# Check if staging already exists
$stagingExists = git branch --list staging
if ($stagingExists) {
    Write-Host "⚠️  Staging branch already exists" -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to recreate it? (y/n)"
    if ($confirm -eq 'y') {
        git branch -D staging
        git checkout -b staging
    } else {
        git checkout staging
    }
} else {
    git checkout -b staging
}

# Push staging branch
Write-Host ""
Write-Host "Pushing staging branch to origin..." -ForegroundColor Cyan
git push -u origin staging

Write-Host ""
Write-Host "✅ Staging branch created and pushed!" -ForegroundColor Green
Write-Host ""

# Display next steps
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure Vercel:" -ForegroundColor Yellow
Write-Host "   • Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   • Select your project" -ForegroundColor White
Write-Host "   • Settings → Git" -ForegroundColor White
Write-Host "   • Change 'Production Branch' from 'main' to 'staging'" -ForegroundColor White
Write-Host "   • Save changes" -ForegroundColor White
Write-Host ""

Write-Host "2. Configure AWS Amplify:" -ForegroundColor Yellow
Write-Host "   • Go to: https://console.aws.amazon.com/amplify/" -ForegroundColor White
Write-Host "   • Create new app → Host web app" -ForegroundColor White
Write-Host "   • Connect GitHub → Select repository" -ForegroundColor White
Write-Host "   • Choose 'main' branch" -ForegroundColor White
Write-Host "   • Build settings will be auto-detected from amplify.yml" -ForegroundColor White
Write-Host ""

Write-Host "3. Workflow:" -ForegroundColor Yellow
Write-Host "   Testing (Vercel):" -ForegroundColor White
Write-Host "   • git checkout staging" -ForegroundColor Gray
Write-Host "   • Make changes" -ForegroundColor Gray
Write-Host "   • git add . && git commit -m 'Test: changes'" -ForegroundColor Gray
Write-Host "   • git push origin staging" -ForegroundColor Gray
Write-Host "   → Vercel auto-deploys" -ForegroundColor Green
Write-Host ""
Write-Host "   Production (AWS Amplify):" -ForegroundColor White
Write-Host "   • git checkout main" -ForegroundColor Gray
Write-Host "   • git merge staging" -ForegroundColor Gray
Write-Host "   • git push origin main" -ForegroundColor Gray
Write-Host "   → AWS Amplify auto-deploys" -ForegroundColor Green
Write-Host ""

Write-Host "📚 For detailed instructions, see: DEPLOYMENT_STRATEGY.md" -ForegroundColor Cyan
Write-Host ""

# Return to original branch
if ($currentBranch -ne "staging") {
    $returnBranch = Read-Host "Return to $currentBranch? (y/n)"
    if ($returnBranch -eq 'y') {
        git checkout $currentBranch
    }
}

Write-Host "✨ Setup complete!" -ForegroundColor Green
