# OTP Authentication Setup with Twilio

## Required Environment Variables

Add these to your `.env` file in the backend directory:

```env
# Twilio Configuration for OTP
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_SERVICE_SID=your_twilio_verify_service_sid (optional)
```

## Twilio Setup Steps

### 1. Create Free Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account ($15 credit)
3. Verify your phone number

### 2. Get Account Credentials
1. From Twilio Console Dashboard:
   - Copy **Account SID**
   - Copy **Auth Token**

### 3. Get a Phone Number
1. Go to Phone Numbers > Manage > Buy a number
2. Choose an Indian phone number (+91)
3. Copy the phone number (format: +911234567890)

### 4. Optional: Set up Verify Service (Recommended)
1. Go to Verify > Services
2. Create a new Verify Service
3. Copy the Service SID
4. This provides better delivery rates and built-in rate limiting

## Environment File Example

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/indulgeout

# JWT
JWT_SECRET=your_jwt_secret_key

# Email Service (existing)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Twilio OTP Service (new)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+911234567890
TWILIO_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Other environment variables...
```

## Testing Without Twilio (Development Mode)

If you don't set up Twilio credentials immediately, the OTP service will run in **mock mode**:
- OTP codes will be logged to console
- All OTP verifications will pass
- No SMS will be sent
- Perfect for development and testing

## Production Deployment

For production on Vercel:
1. Add all environment variables to Vercel dashboard
2. Environment Variables → Add each variable
3. Deploy your application

## API Endpoints Added

### OTP Registration
- `POST /api/otp/register/send` - Send OTP for new user registration
- `POST /api/otp/register/verify` - Verify OTP and complete registration

### OTP Login  
- `POST /api/otp/login/send` - Send OTP for existing user login
- `POST /api/otp/login/verify` - Verify OTP and login

### Utilities
- `POST /api/otp/resend` - Resend OTP for both registration and login

## Rate Limiting
- Max 5 OTP requests per hour per phone number
- Minimum 1 minute between consecutive requests
- OTP expires in 10 minutes
- Automatic retry limits to prevent abuse

## Security Features
- OTPs are hashed before storage in database
- Rate limiting prevents spam
- Temporary tokens expire in 15 minutes
- Phone number format validation
- Duplicate registration prevention

## Phone Number Format
- Accepts: 10-digit Indian mobile numbers (6xxxxxxxx, 7xxxxxxxx, 8xxxxxxxx, 9xxxxxxxx)
- Automatically adds +91 country code
- Validates format before processing

## Integration with Existing Auth
- Traditional email/password auth still works
- Users can have both password and phone verification
- JWT tokens include phone number for both auth methods
- Seamless integration with existing user system