# Monorepo Quick Guide - Mobile App Addition

**Timeline:** Before mobile dev starts (~10-15 days from now)  
**Goal:** Prepare repo structure for backend + web + mobile

---

## Current Setup ✅
```
IndulgeOut/
├── backend/         → Vercel (auto-deploy from main)
└── frontend/        → AWS Amplify (auto-deploy from main)
```

---

## Proposed Structure 🎯
```
IndulgeOut/
├── backend/         → Node.js API (Vercel)
├── web/             → React Web (Amplify) - renamed from 'frontend'
├── mobile/          → React Native (NEW)
└── shared/          → Common types, constants, validators (NEW)
```

**Why?**
- Share types/constants across web & mobile
- Update backend + web + mobile in single commit
- Reduce code duplication (validators, formatters)

---

## Quick Migration Steps

### Before Mobile Dev Starts:
```bash
# 1. Create branch
git checkout -b refactor/monorepo-structure

# 2. Rename frontend
git mv frontend web

# 3. Create shared folder
mkdir shared
mkdir shared/{types,constants,utils}

# 4. Move common code to shared/
# - Event/User/Collaboration types
# - Categories, cities constants  
# - Email/phone validators

# 5. Update imports in web/ and backend/

# 6. Test locally, then merge
git commit -m "refactor: Prepare monorepo for mobile"
git push origin refactor/monorepo-structure
# PR → staging → main
```

### When Starting Mobile:
```bash
# 1. Initialize React Native
npx react-native init mobile --template react-native-template-typescript

# 2. Install shared package
cd mobile && npm install ../shared

# 3. Use shared code
import { EVENT_CATEGORIES } from '@indulgeout/shared/constants';
```

---

## Git Workflow (Prevent Conflicts!)

### ✅ DO:
```bash
# Work from ROOT directory
cd C:\Users\DA20592363\Desktop\Frontend\IndulgeOut

# Check branch BEFORE committing
git branch --show-current

# Use feature branches
git checkout -b feature/notification-system
git add .
git commit -m "feat: Add notifications"
git push origin feature/notification-system
```

### ❌ DON'T:
```bash
# Don't work from subdirectories
cd backend  # ❌
git commit  # ❌

# Don't commit directly to main/staging
git checkout main
git commit  # ❌
```

---

## Deployment Strategy

| Platform | Service | Auto-Deploy | Trigger |
|----------|---------|-------------|---------|
| Backend  | Vercel  | ✅ Yes | Push to main |
| Web      | Amplify | ✅ Yes | Push to main |
| Mobile   | Manual  | ⏳ Later | Build APK/IPA |

**Note:** Vercel & Amplify will continue auto-deploying from main - no changes needed!

---

## Shared Code Examples

### shared/types/user.ts
```typescript
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'host_partner';
  // ... used by backend, web, mobile
}
```

### shared/constants/categories.ts
```typescript
export const EVENT_CATEGORIES = [
  'music', 'sports', 'food', 'nightlife', 'arts', 'wellness'
];
```

### shared/utils/validators.ts
```typescript
export const validateEmail = (email: string) => 
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePhone = (phone: string) =>
  /^[6-9]\d{9}$/.test(phone);
```

---

## Benefits Summary

✅ **One source of truth** - Types defined once, used everywhere  
✅ **Atomic commits** - Update API + web + mobile together  
✅ **DRY code** - Validators, formatters shared  
✅ **Type safety** - Catch API contract mismatches early  
✅ **Independent deploys** - Backend/web/mobile deploy separately  

---

## Checklist

### Week 1 (Now - Production Focus)
- [ ] Get website production-ready
- [ ] Review this document

### Week 2 (Before Mobile)
- [ ] Execute restructure (2-3 days before mobile dev)
- [ ] Test everything still works
- [ ] Deploy to production

### Week 3+ (Mobile Dev)
- [ ] Init React Native project
- [ ] Link shared package
- [ ] Build mobile app using shared types/constants

---

## Questions?

**Q: Will this break current deployments?**  
A: No! Vercel & Amplify will continue working. Just update root directory settings if needed.

**Q: Can we skip restructuring?**  
A: Yes, but you'll duplicate code between web & mobile, causing maintenance issues.

**Q: When should we do this?**  
A: 2-3 days before starting mobile development (optimal timing).

---

**See [MONOREPO_RESTRUCTURE_PLAN.md](MONOREPO_RESTRUCTURE_PLAN.md) for detailed guide.**

**Status:** Planning  
**Owner:** Daksh Pratap Singh  
**Date:** Feb 14, 2026
