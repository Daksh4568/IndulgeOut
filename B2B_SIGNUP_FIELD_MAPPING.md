# B2B Signup Field Mapping & Validation

## API Route
All B2B signup forms use: `POST /api/auth/register`

---

## 1. Venue Signup (VenueSignup.jsx)

### Frontend Form Fields:
- `venueName` ✅
- `venueType` ✅ (dropdown: cafe, bar, studio, club, outdoor, restaurant, coworking, other)
- `contactPersonName` ✅
- `phoneNumber` ✅
- `email` ✅
- `city` ✅ (dropdown)
- `locality` ✅
- `capacityRange` ✅ (dropdown: 0-20, 20-40, 40-80, 80-150, 150-300, 300+)
- `instagramLink` (optional) ✅
- `photos` (file upload, max 3) ✅

### Backend Saves To:
```javascript
User {
  name: contactPersonName,
  email: email,
  phoneNumber: phoneNumber,
  role: 'host_partner',
  hostPartnerType: 'venue',
  venueProfile: {
    venueName: String,
    venueType: String (enum),
    capacityRange: String (enum),
    city: String,
    locality: String,
    contactPerson: {
      name: contactPersonName,
      phone: phoneNumber,
      email: email
    },
    instagram: instagramLink,
    photos: [cloudinaryUrls]
  }
}
```

---

## 2. Host/Community Organizer Signup (HostSignup.jsx)

### Frontend Form Fields:
- `communityName` ✅
- `category` ✅ (dropdown with enum: 'Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games')
- `contactPersonName` ✅
- `phoneNumber` ✅
- `workEmail` ✅
- `city` ✅ (dropdown)
- `instagramLink` (optional) ✅
- `photos` (file upload, max 3) ✅

### Backend Saves To:
```javascript
User {
  name: contactPersonName,
  email: workEmail,
  phoneNumber: phoneNumber,
  role: 'host_partner',
  hostPartnerType: 'community_organizer',
  communityProfile: {
    communityName: String,
    category: [String] (enum array),
    city: String,
    contactPerson: {
      name: contactPersonName,
      email: workEmail,
      phone: phoneNumber
    },
    instagram: instagramLink,
    pastEventPhotos: [cloudinaryUrls]
  }
}
```

---

## 3. Brand Signup (BrandSignup.jsx)

### Frontend Form Fields:
- `brandName` ✅
- `brandCategory` ✅ (dropdown with enum: food_beverage, wellness_fitness, lifestyle, tech, entertainment, fashion, education, other)
- `contactPersonName` ✅
- `phoneNumber` ✅
- `workEmail` ✅
- `city` ✅ (dropdown)
- `instagramLink` (optional) ✅
- `photos` (file upload, max 3) ✅

### Backend Saves To:
```javascript
User {
  name: contactPersonName,
  email: workEmail,
  phoneNumber: phoneNumber,
  role: 'host_partner',
  hostPartnerType: 'brand_sponsor',
  brandProfile: {
    brandName: String,
    brandCategory: String (enum),
    targetCity: [String],
    contactPerson: {
      name: contactPersonName,
      workEmail: workEmail,
      phone: phoneNumber
    },
    instagram: instagramLink,
    brandAssets: [cloudinaryUrls]
  }
}
```

---

## Schema Enum Values

### Category Enum (for Community Organizers):
```javascript
['Social Mixers', 'Wellness, Fitness & Sports', 'Art, Music & Dance', 'Immersive', 'Food & Beverage', 'Games']
```

### Venue Type Enum:
```javascript
['cafe', 'bar', 'studio', 'club', 'outdoor', 'restaurant', 'coworking', 'other']
```

### Capacity Range Enum:
```javascript
['0-20', '20-40', '40-80', '80-150', '150-300', '300+']
```

### Brand Category Enum:
```javascript
['food_beverage', 'wellness_fitness', 'lifestyle', 'tech', 'entertainment', 'fashion', 'education', 'other']
```

---

## Key Features

✅ All forms use `/api/auth/register` route  
✅ All contact person info saved at both User root level AND in nested profile.contactPerson  
✅ All photos uploaded to Cloudinary before saving  
✅ JWT tokens generated and returned  
✅ All enum validations in place  
✅ Phone number validation (10-digit Indian numbers)  
✅ Email format validation  
✅ Rate limiting: 3 registrations per 15 minutes per IP  

---

## Profile Retrieval

After registration, profile data can be fetched from:
- `GET /api/auth/profile` (with Bearer token)

Returns:
```javascript
{
  user: {
    id, name, email, role, hostPartnerType,
    communityProfile/venueProfile/brandProfile // based on hostPartnerType
  }
}
```

All fields are now properly structured and will be available when fetching the user's profile data.
