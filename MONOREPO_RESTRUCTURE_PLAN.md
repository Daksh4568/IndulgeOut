# Monorepo Restructuring Plan for Mobile App
**Target Timeline:** 2-3 days before mobile development starts  
**Current Date:** February 14, 2026  
**Mobile Dev Start:** ~10-15 days from now

---

## Current Setup (Production)
- **Backend:** Vercel (auto-deploy from `main` branch)
- **Frontend:** AWS Amplify (auto-deploy from `main` branch)
- **Structure:** Single monorepo with `backend/` and `frontend/` folders

---

## Proposed Structure (Backend + Web + Mobile)

```
IndulgeOut/
├── backend/                    # Node.js/Express API (Vercel)
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── utils/
│   ├── package.json
│   └── vercel.json
│
├── web/                        # React Web App (AWS Amplify)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── amplify.yml
│
├── mobile/                     # React Native App (NEW)
│   ├── src/
│   │   ├── screens/           # EventsScreen, ProfileScreen, etc.
│   │   ├── components/        # Mobile-specific components
│   │   ├── navigation/        # React Navigation setup
│   │   └── api/               # API client (shared endpoints)
│   ├── android/
│   ├── ios/
│   ├── app.json
│   └── package.json
│
├── shared/                     # Shared code across web & mobile (NEW)
│   ├── types/                 # TypeScript interfaces
│   │   ├── user.ts
│   │   ├── event.ts
│   │   ├── collaboration.ts
│   │   └── notification.ts
│   ├── constants/
│   │   ├── categories.ts      # EVENT_CATEGORIES, VENUE_TYPES
│   │   ├── cities.ts          # Indian cities list
│   │   ├── api.ts             # API_BASE_URL, endpoints
│   │   └── validation.ts      # Regex patterns, validators
│   ├── utils/
│   │   ├── formatters.ts      # Date, currency formatting
│   │   ├── validators.ts      # Email, phone validation
│   │   └── helpers.ts         # Common functions
│   └── package.json
│
├── .github/
│   └── workflows/
│       ├── backend-deploy.yml      # Vercel deployment
│       ├── web-deploy.yml          # Amplify deployment
│       └── mobile-ci.yml           # Mobile build & test
│
├── package.json                # Root workspace config
└── turbo.json                  # Optional: Turborepo config
```

---

## Benefits of This Structure

### 1. **Shared Type Safety**
```typescript
// shared/types/event.ts
export interface Event {
  _id: string;
  title: string;
  date: Date;
  host: string;
  // ... used by backend, web, and mobile
}

// backend/routes/events.js - API returns this shape
// web/src/pages/EventDetails.tsx - expects this shape
// mobile/src/screens/EventDetailsScreen.tsx - expects this shape
```

### 2. **DRY Constants**
```typescript
// shared/constants/categories.ts
export const EVENT_CATEGORIES = [
  'music', 'sports', 'food', 'nightlife', 'arts', 'wellness'
];

// Used everywhere:
// - backend/models/Event.js (validation)
// - web/src/components/CategoryFilter.jsx
// - mobile/src/components/CategoryPicker.tsx
```

### 3. **Consistent Validation**
```typescript
// shared/utils/validators.ts
export const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// shared/utils/validators.ts
export const validatePhone = (phone: string) => {
  // Indian phone number validation
  return /^[6-9]\d{9}$/.test(phone);
};

// Used in:
// - backend/routes/auth.js (server-side validation)
// - web/src/components/SignupForm.jsx
// - mobile/src/screens/SignupScreen.tsx
```

### 4. **Atomic Feature Development**
```bash
# Single PR for adding "Push Notifications":
git checkout -b feature/push-notifications

# Changes across all platforms:
- backend/routes/notifications.js        # New API endpoint
- shared/types/notification.ts           # Notification interface
- web/src/services/notificationService.js
- mobile/src/services/notificationService.ts

git commit -m "feat: Add push notifications across all platforms"
```

---

## Step-by-Step Restructuring Process

### **Phase 1: Preparation (Before Mobile Dev)**

#### Step 1: Create Feature Branch
```bash
cd C:\Users\DA20592363\Desktop\Frontend\IndulgeOut
git checkout main
git pull origin main
git checkout -b refactor/monorepo-structure
```

#### Step 2: Rename Frontend → Web
```bash
git mv frontend web
```

#### Step 3: Create Shared Package
```bash
mkdir shared
mkdir shared/types
mkdir shared/constants
mkdir shared/utils

# Initialize package
cd shared
npm init -y
```

**shared/package.json:**
```json
{
  "name": "@indulgeout/shared",
  "version": "1.0.0",
  "main": "index.js",
  "types": "index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

#### Step 4: Extract Common Types
Move shared interfaces to `shared/types/`:
- User types
- Event types
- Collaboration types
- Notification types

#### Step 5: Extract Constants
Move to `shared/constants/`:
- `EVENT_CATEGORIES`
- `VENUE_TYPES`
- `BRAND_CATEGORIES`
- `INDIAN_CITIES`
- API endpoints

#### Step 6: Setup Workspace
**Root package.json:**
```json
{
  "name": "indulgeout-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "backend",
    "web",
    "shared"
  ],
  "scripts": {
    "dev:backend": "cd backend && npm run dev",
    "dev:web": "cd web && npm run dev",
    "build:all": "npm run build --workspaces",
    "test:all": "npm run test --workspaces"
  },
  "devDependencies": {
    "turbo": "^1.10.0"
  }
}
```

#### Step 7: Update Import Paths
```javascript
// Before (web/src/utils/constants.js):
export const EVENT_CATEGORIES = [...];

// After (web/src/pages/Events.jsx):
import { EVENT_CATEGORIES } from '@indulgeout/shared/constants/categories';
```

#### Step 8: Update Deployment Configs

**backend/vercel.json** (no changes needed):
```json
{
  "version": 2,
  "builds": [{ "src": "index.js", "use": "@vercel/node" }]
}
```

**web/amplify.yml** (no changes needed):
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

#### Step 9: Test Everything
```bash
# Test backend
cd backend
npm install
npm run dev

# Test web
cd ../web
npm install
npm run dev

# Test shared imports work
```

#### Step 10: Commit & Merge
```bash
git add .
git commit -m "refactor: Restructure monorepo for mobile app support"
git push origin refactor/monorepo-structure

# Create PR on GitHub
# Review changes
# Merge to staging → test
# Merge to main → auto-deploys backend & web
```

---

### **Phase 2: Mobile App Setup (When Starting Development)**

#### Step 1: Initialize React Native
```bash
cd C:\Users\DA20592363\Desktop\Frontend\IndulgeOut
npx react-native init mobile --template react-native-template-typescript
```

#### Step 2: Install Shared Package
```bash
cd mobile
npm install ../shared
```

#### Step 3: Configure API Client
```typescript
// mobile/src/config/api.ts
import { API_BASE_URL } from '@indulgeout/shared/constants/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

#### Step 4: Setup Navigation
```bash
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
```

#### Step 5: Create Base Screens
- `src/screens/EventsScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/screens/CommunityScreen.tsx`
- etc.

#### Step 6: Update Root Workspace
```json
// package.json
"workspaces": [
  "backend",
  "web",
  "mobile",
  "shared"
]
```

---

## Git Workflow Strategy

### **Branch Structure**
```
main          → Production (protected, auto-deploys)
  ↑
staging       → Pre-production testing
  ↑
feature/*     → Development branches
hotfix/*      → Emergency fixes
```

### **Branch Naming Convention**
```bash
feature/notification-system     # New feature
fix/kyc-validation-bug         # Bug fix
refactor/api-client            # Code refactoring
chore/update-dependencies      # Maintenance
```

### **Commit Message Format**
```bash
# Format: type(scope): description

feat(backend): Add push notification API
feat(web): Add notification dropdown
feat(mobile): Add notification screen
feat(shared): Add notification types

fix(backend): Fix KYC validation logic
fix(web): Fix profile form submission

refactor(shared): Extract common validators
chore(deps): Update React to v18.3
```

### **Working Process**
```bash
# 1. Always start from main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Make changes (backend, web, and/or mobile)
# Work from ROOT directory, not subdirectories!
cd C:\Users\DA20592363\Desktop\Frontend\IndulgeOut

# 4. Stage specific folders
git add backend/
git add web/
git add shared/
# OR stage everything:
git add .

# 5. Commit with clear message
git commit -m "feat: Add push notification system"

# 6. Push feature branch
git push origin feature/your-feature

# 7. Create PR on GitHub: feature → staging

# 8. After testing on staging, merge: staging → main
# This triggers auto-deployment
```

### **Pre-Push Checklist**
Before every push:
```powershell
# Check current branch
git branch --show-current

# Check what will be pushed
git status
git diff origin/main

# Verify you're in root directory
pwd  # Should be: C:\Users\DA20592363\Desktop\Frontend\IndulgeOut

# Check last commits
git log --oneline -5
```

---

## Deployment Strategy

### **Current (Backend + Web)**
| Platform | Service | Branch | Auto-Deploy |
|----------|---------|--------|-------------|
| Backend  | Vercel  | main   | ✅ Yes      |
| Web      | AWS Amplify | main | ✅ Yes    |

### **After Mobile Added**
| Platform | Service | Branch | Deploy Method |
|----------|---------|--------|---------------|
| Backend  | Vercel  | main   | ✅ Auto (Git push) |
| Web      | AWS Amplify | main | ✅ Auto (Git push) |
| Mobile (Android) | Manual/CI | main | Manual build or CI/CD |
| Mobile (iOS) | Manual/TestFlight | main | Manual build |

### **Independent Deployment Triggers**
Setup GitHub Actions to deploy only what changed:

**.github/workflows/backend-deploy.yml:**
```yaml
name: Deploy Backend
on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'shared/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**.github/workflows/web-deploy.yml:**
```yaml
name: Deploy Web
on:
  push:
    branches: [main]
    paths:
      - 'web/**'
      - 'shared/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Amplify Build
        # Amplify auto-deploys via Git connection
```

**.github/workflows/mobile-ci.yml:**
```yaml
name: Mobile CI
on:
  push:
    branches: [main, staging]
    paths:
      - 'mobile/**'
      - 'shared/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: cd mobile && npm ci
      - name: Run tests
        run: cd mobile && npm test
      - name: Build APK (optional)
        run: cd mobile/android && ./gradlew assembleRelease
```

---

## Example Shared Code Structure

### **shared/types/user.ts**
```typescript
export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'user' | 'host_partner';
  hostPartnerType?: 'community_organizer' | 'venue' | 'brand_sponsor';
  profilePicture?: string;
  communityProfile?: CommunityProfile;
  venueProfile?: VenueProfile;
  brandProfile?: BrandProfile;
  payoutDetails?: PayoutDetails;
  createdAt: Date;
}

export interface PayoutDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  billingAddress: string;
  upiId?: string;
  gstNumber?: string;
  idProofDocument?: string;
}
```

### **shared/constants/categories.ts**
```typescript
export const EVENT_CATEGORIES = [
  'music',
  'sports',
  'food',
  'nightlife',
  'arts',
  'wellness'
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];

export const VENUE_TYPES = [
  'restaurant',
  'club',
  'outdoor_space',
  'banquet_hall',
  'hotel',
  'rooftop'
] as const;

export const BRAND_CATEGORIES = [
  'food_beverage',
  'fashion',
  'technology',
  'automotive',
  'lifestyle',
  'healthcare'
] as const;
```

### **shared/constants/api.ts**
```typescript
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://indulgeout-backend.vercel.app'
  : 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  SIGNUP: '/api/auth/signup',
  OTP_SEND: '/api/otp/send',
  OTP_VERIFY: '/api/otp/verify',
  
  // Events
  EVENTS_LIST: '/api/events',
  EVENT_REGISTER: (id: string) => `/api/events/${id}/register`,
  
  // Communities
  COMMUNITIES_BROWSE: '/api/communities/browse',
  
  // Notifications
  NOTIFICATIONS_LIST: '/api/notifications',
  NOTIFICATIONS_MARK_READ: (id: string) => `/api/notifications/${id}/read`,
} as const;
```

### **shared/utils/validators.ts**
```typescript
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validateIndianPhone = (phone: string): boolean => {
  // Indian mobile: starts with 6-9, 10 digits total
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
};

export const validateIFSC = (ifsc: string): boolean => {
  // IFSC format: 4 letters + 0 + 6 alphanumeric
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());
};

export const validateGST = (gst: string): boolean => {
  // GST format: 15 characters
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
};
```

### **shared/utils/formatters.ts**
```typescript
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatEventDate = (date: Date | string): string => {
  const d = new Date(date);
  return {
    day: d.getDate(),
    month: d.toLocaleString('en-IN', { month: 'short' }),
    year: d.getFullYear(),
    time: d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })
  };
};
```

---

## Testing Strategy

### **Shared Package Tests**
```bash
# shared/validators.test.ts
import { validateEmail, validateIndianPhone } from './utils/validators';

describe('Validators', () => {
  test('validateEmail', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });

  test('validateIndianPhone', () => {
    expect(validateIndianPhone('9876543210')).toBe(true);
    expect(validateIndianPhone('1234567890')).toBe(false);
  });
});
```

### **Integration Tests**
```bash
# Test that all platforms use same validators
# Backend uses shared validators ✓
# Web uses shared validators ✓
# Mobile uses shared validators ✓
```

---

## Migration Checklist

### **Before Starting (This Week)**
- [x] Document current deployment setup
- [x] Plan monorepo structure
- [ ] Review with team
- [ ] Schedule migration time (low-traffic period)

### **During Migration (2-3 Days Before Mobile Dev)**
- [ ] Create `refactor/monorepo-structure` branch
- [ ] Rename `frontend/` → `web/`
- [ ] Create `shared/` package
- [ ] Extract common types to `shared/types/`
- [ ] Extract constants to `shared/constants/`
- [ ] Extract utilities to `shared/utils/`
- [ ] Update import paths in web/
- [ ] Update import paths in backend/
- [ ] Setup workspace configuration
- [ ] Test backend locally
- [ ] Test web locally
- [ ] Run all tests
- [ ] Create PR & review
- [ ] Merge to staging
- [ ] Test on staging environment
- [ ] Merge to main (triggers auto-deploy)
- [ ] Monitor production

### **When Starting Mobile (10-15 Days)**
- [ ] Initialize React Native project
- [ ] Link shared package
- [ ] Setup navigation
- [ ] Create base screens
- [ ] Integrate API client
- [ ] Test on Android emulator
- [ ] Test on iOS simulator
- [ ] Setup CI/CD for mobile

---

## Troubleshooting

### **Issue: Import paths not resolving**
```bash
# Solution: Configure module resolution
# web/vite.config.js
resolve: {
  alias: {
    '@indulgeout/shared': path.resolve(__dirname, '../shared')
  }
}
```

### **Issue: Vercel deployment fails after restructure**
```bash
# Solution: Update vercel.json root directory
{
  "buildCommand": "cd backend && npm install && npm run build",
  "rootDirectory": "backend"
}
```

### **Issue: Amplify build fails**
```bash
# Solution: Update build settings on AWS Amplify console
# Root directory: web
# Build command: npm run build
```

---

## Resources

### **Documentation**
- [npm Workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces)
- [Turborepo Guide](https://turbo.build/repo/docs)
- [React Native Setup](https://reactnative.dev/docs/environment-setup)
- [Vercel Monorepo](https://vercel.com/docs/concepts/monorepos)

### **Example Monorepos**
- Vercel's monorepo structure
- Facebook's React Native + Web setup
- Airbnb's JavaScript monorepo

---

## Timeline

| Date | Task | Status |
|------|------|--------|
| Feb 14, 2026 | Document created | ✅ Done |
| Feb 17-19, 2026 | Production website ready | 🔄 In Progress |
| Feb 20-21, 2026 | Monorepo restructure | ⏳ Planned |
| Feb 27, 2026 | Mobile development starts | ⏳ Planned |

---

## Questions to Consider Before Restructure

1. **Do we need TypeScript now?**
   - Pro: Better type safety across platforms
   - Con: Migration effort
   - **Recommendation:** Add TypeScript to `shared/` only, migrate web/mobile gradually

2. **Should we use Turborepo?**
   - Pro: Faster builds, better caching
   - Con: Additional complexity
   - **Recommendation:** Start simple, add if needed

3. **How to handle environment variables?**
   - Backend: `.env` (Vercel secrets)
   - Web: `.env` (Amplify env vars)
   - Mobile: `.env` (react-native-config)
   - Shared: `shared/config/env.ts` (type-safe wrappers)

4. **Mobile deployment strategy?**
   - Android: Google Play Console
   - iOS: TestFlight → App Store
   - OTA updates: CodePush or EAS Update

---

## Next Steps

1. **This Week:** Focus on production readiness ✅
2. **In 2-3 Days:** Review this document with team
3. **Before Mobile Start:** Execute Phase 1 (Restructure)
4. **When Mobile Starts:** Execute Phase 2 (Mobile Setup)

---

**Last Updated:** February 14, 2026  
**Status:** Planning Phase  
**Owner:** Daksh Pratap Singh
