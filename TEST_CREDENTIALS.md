# Test Account Credentials

## Admin Account
- **Phone:** 9999999999
- **Email:** admin@indulgeout.com
- **Password:** admin123
- **Role:** admin
- **Access Level:** super_admin

### Login Methods:
1. **Email/Password Login (RECOMMENDED):**
   - Use `/api/auth/login` endpoint
   - Body: `{ email: "admin@indulgeout.com", password: "admin123" }`

2. **OTP Login:**
   - Use phone: 9999999999
   - OTP: Use the one sent to phone or configured test OTP

## Test B2B Users

### Community Organizer
- **Phone:** 9999999991
- **Email:** community@test.com
- **Password:** test123
- **Role:** host_partner
- **Type:** community_organizer

### Venue
- **Phone:** 9999999992
- **Email:** venue@test.com
- **Password:** test123
- **Role:** host_partner
- **Type:** venue

### Brand Sponsor
- **Phone:** 9999999993
- **Email:** brand@test.com
- **Password:** test123
- **Role:** host_partner
- **Type:** brand_sponsor

## Frontend Login
Navigate to: `http://localhost:3000/login`

**For email/password login:**
1. Select "Email" tab
2. Enter email (e.g., community@test.com)
3. Enter password (e.g., test123)

**For OTP login:**
1. Select "Phone" tab
2. Enter 10-digit phone number (e.g., 9999999991)
3. Request OTP
4. Enter received OTP

## Admin Dashboard
After login as admin, access: `http://localhost:3000/admin/dashboard`

## Testing
Run setup script first: `cd backend && node setupTestUsers.js`
Then run test: `cd backend && node testCollaborationWorkflow.js`
