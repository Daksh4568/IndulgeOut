# IndulgeOut - Interest-Based Social Discovery Platform

IndulgeOut is a modern web application that helps people connect offline around shared interests including food, music, sports, art, and experiences. Built with React.js, Node.js, MongoDB, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **Dual User System**: Separate registration for regular users and community members (event hosts)
- **Interest-Based Matching**: Users select interests during signup to discover relevant events
- **Event Management**: Community members can create, manage, and host events
- **Smart Event Discovery**: Users see events based on their selected interests
- **Email Notifications**: Automated emails for registrations and confirmations
- **Real-time Updates**: Live participant counts and event status

### User Types
1. **Regular Users**
   - Browse and register for events
   - Interest-based event recommendations
   - Personal dashboard with registered events

2. **Community Members**
   - All user features plus:
   - Create and manage events
   - Set participant limits and pricing
   - Receive notifications when users register

## 📁 Project Structure

```
IndulgeOut/
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # App entry point
│   ├── package.json
│   └── tailwind.config.js
├── backend/                 # Node.js API server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── server.js           # Server entry point
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IndulgeOut
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Copy environment variables
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/indulgeout
   JWT_SECRET=your_jwt_secret_key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   CLIENT_URL=http://localhost:3000
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on http://localhost:5000

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Application runs on http://localhost:3000

## 📧 Email Configuration

The application uses Nodemailer for sending emails. For Gmail:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use the App Password in the `EMAIL_PASS` environment variable

## 🎯 Key Features Implementation

### User Registration Flow
1. User selects role (User or Community Member)
2. Users select interests during signup
3. Email confirmation sent
4. Interest-based event recommendations displayed

### Event Creation Flow (Community Members)
1. Fill event details form
2. Set categories, participant limits, location
3. Event published to relevant users
4. Registration notifications via email

### Event Registration Flow
1. Users browse events by interests
2. Register for events with one click
3. Confirmation email sent to user
4. Notification email sent to event host

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Events
- `GET /api/events` - Get all events (with filters)
- `POST /api/events` - Create event (community members only)
- `GET /api/events/:id` - Get single event
- `POST /api/events/:id/register` - Register for event
- `GET /api/events/recommended/for-me` - Get recommended events

### Users
- `PUT /api/users/interests` - Update user interests
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile


#### Code-Level Optimizations:
✅ **Lazy Loading**: Videos only load when component is visible
✅ **Intersection Observer**: Pauses videos when not in viewport
✅ **Preload Strategy**: Metadata preloading for faster start
✅ **Memory Management**: Proper cleanup and reference handling
✅ **Progressive Enhancement**: Graceful fallbacks for slow connections

### **Phase 1: Month 1 (1,000 DAU) - ₹3,500/month**

| Service | Monthly Cost (₹) | Basic Configuration |
|---------|-------------------|---------------------|
| **AWS Lambda** | ₹800 | Standard x86, 512MB memory, basic setup |
| **API Gateway** | ₹600 | Basic setup, no caching initially |
| **DynamoDB On-Demand** | ₹400 | 5GB storage, 300K reads, 50K writes |
| **S3 Storage** | ₹300 | 20GB basic file storage |
| **CloudWatch** | ₹400 | Standard monitoring |
| **Route 53** | ₹200 | Basic DNS |
| **AWS WAF** | ₹300 | Basic security rules |
| **SES (Email)** | ₹200 | Email notifications |
| **Direct S3 Delivery** | ₹300 | Files served directly from S3 (no CDN) |

### **Phase 2: Months 2-3 (2,000 DAU) - ₹6,800/month**

| Service | Monthly Cost (₹) | Scaling Factor |
|---------|-------------------|----------------|
| **AWS Lambda** | ₹1,200 | 2M requests, standard config |
| **API Gateway** | ₹800 | 2M API calls, basic caching enabled |
| **DynamoDB On-Demand** | ₹800 | 10GB storage, 600K reads, 100K writes |
| **S3 Storage** | ₹400 | 40GB storage |
| **CloudFront CDN** | ₹1,200 | Add CDN for global users |
| **ElastiCache** | ₹800 | t3.micro - add caching for performance |
| **CloudWatch** | ₹600 | Enhanced monitoring |
| **Route 53** | ₹200 | DNS management |
| **AWS WAF** | ₹400 | Security rules |
| **SES (Email)** | ₹200 | Email notifications |
| **S3 Data Transfer** | ₹200 | Direct delivery until CDN setup |
    
### **Phase 3: Months 4-7 (5,000 DAU) - ₹12,500/month**

| Service | Monthly Cost (₹) | Scaling Requirements |
|---------|-------------------|----------------------|
| **AWS Lambda** | ₹3,500 | 5M requests, standard memory |
| **API Gateway** | ₹2,000 | 5M API calls |
| **DynamoDB On-Demand** | ₹2,000 | 25GB storage, 1.5M reads, 300K writes |
| **S3 Storage** | ₹600 | 100GB storage |
| **CloudFront CDN** | ₹2,500 | Global distribution |
| **ElastiCache** | ₹1,500 | t3.medium |
| **CloudWatch** | ₹800 | Detailed monitoring |
| **AWS WAF** | ₹500 | Enhanced security |
| **SES (Email)** | ₹300 | Higher email volume |

### **Phase 4: Months 8-10 (7,000 DAU) - ₹17,500/month**

| Service | Monthly Cost (₹) | Growing Infrastructure |
|---------|-------------------|------------------------|
| **AWS Lambda** | ₹5,000 | 7M requests, some optimization |
| **API Gateway** | ₹2,800 | Higher traffic volume |
| **DynamoDB On-Demand** | ₹3,000 | 40GB storage, 2.5M reads, 500K writes |
| **S3 Storage** | ₹800 | 150GB storage |
| **CloudFront CDN** | ₹3,500 | Global content distribution |
| **ElastiCache** | ₹2,000 | t3.large |
| **CloudWatch** | ₹1,000 | Advanced monitoring |
| **AWS WAF** | ₹600 | Security scaling |
| **SES (Email)** | ₹400 | Email notifications |
| **Route 53** | ₹200 | DNS management |

### **Phase 5: Months 11-12 (10,000 DAU) - ₹25,000/month**

| Service | Monthly Cost (₹) | Full Scale Operations |
|---------|-------------------|----------------------|
| **AWS Lambda** | ₹7,500 | 10M requests, standard config |
| **API Gateway** | ₹4,000 | High volume traffic |
| **DynamoDB On-Demand** | ₹4,500 | 60GB storage, 4M reads, 800K writes |
| **S3 Storage** | ₹1,000 | 200GB storage |
| **CloudFront CDN** | ₹5,000 | Global distribution |
| **ElastiCache** | ₹2,500 | r6g.large |
| **CloudWatch** | ₹1,200 | Comprehensive monitoring |
| **AWS WAF** | ₹800 | Advanced security |
| **SES (Email)** | ₹500 | High email volume |
| **Route 53** | ₹200 | DNS management |
| **SNS (Push Notifications)** | ₹300 | Mobile push notifications |

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
# Agentic AI Feature Brief
**Feature Name:** AI-Powered Collaboration Compliance Monitor  
**Version:** 2.0 | **Date:** February 6, 2026  
**Status:** Development Phase - Mandatory Admin Approval

---

## 🎯 Quick Summary

**What Changed:** ALL collaboration proposals and counters (8 workflow types) now require mandatory admin approval before reaching recipients.

**Key Points:**
- ✅ AI scans every submission and assigns risk scores
- ✅ All requests go to admin dashboard (clean or flagged)
- ✅ Admin approves/rejects/sanitizes before delivery
- ✅ Supports all 8 collaboration workflows
- ✅ Real-time notifications for admins
- ⏱️ Target: <15 min review turnaround
- 👥 Scales: 1-4 admins based on volume

---

## 📋 Feature Summary

An intelligent AI agent that automatically monitors ALL collaboration proposals and counter-offers between B2B partners (Communities, Venues, Brands) with mandatory admin approval workflow. The system scans messages for contact information, assigns risk scores, and routes all submissions through admin review before reaching recipients.

**Goal:** Maintain platform integrity by preventing users from exchanging direct contact details that bypass IndulgeOut's collaboration system through a mandatory admin approval process.

---

## 🎯 Problem Statement

### Current Risk
Users can currently exchange:
- Phone numbers → Direct WhatsApp conversations
- Email addresses → Gmail discussions  
- Social media handles → Instagram/Facebook DMs
- Meeting links → Zoom calls outside platform
- Payment handles → Direct UPI transfers

**Impact:** Revenue loss, no transaction tracking, safety concerns, compliance issues.

---

## 🔄 System Flow Architecture

### Mandatory Admin Approval Workflow

```
USER SUBMITS (Any of 8 form types)
        ↓
   [AI Content Scan] (<2s)
        ↓
   Assign Risk Score (0-100)
        ↓
   ┌─────────────────────┐
   │  ADMIN DASHBOARD    │
   │  (ALL Requests)     │
   └─────────────────────┘
            ↓
      Admin Reviews
            ↓
     ┌──────┴──────┐
     ↓             ↓             ↓
  Approve       Reject      Sanitize
     ↓             ↓             ↓
 Notify        Notify        Clean &
Recipient      Sender        Send
     ↓             
Recipient Sees
  Proposal
     ↓
Submits Counter
     ↓
Back to Admin Dashboard
```

### 8 Collaboration Workflows (All Go Through Admin)

**Community-Initiated:**
1. Community → Venue (Proposal) → Admin → Venue
2. Venue → Community (Counter) → Admin → Community

3. Community → Brand (Proposal) → Admin → Brand
4. Brand → Community (Counter) → Admin → Community

**Brand-Initiated:**
5. Brand → Community (Proposal) → Admin → Community
6. Community → Brand (Counter) → Admin → Brand

**Venue-Initiated:**
7. Venue → Community (Proposal) → Admin → Community
8. Community → Venue (Counter) → Admin → Venue

**Key Principle:** Every proposal AND counter passes through admin approval before reaching the recipient.

---

## ✨ What We're Building

### Core Functionality

**1. Real-Time Content Scanning**
- Scans all collaboration proposals and counter-offers (8 form types)
- Detects contact information patterns
- Assigns risk scores (0-100%)
- Provides AI insights for admin review

**2. Mandatory Admin Approval System**
- 🔒 All proposals → Admin dashboard (regardless of AI scan result)
- 🔒 All counter-offers → Admin dashboard for re-approval
- 🚨 High-risk content → Highlighted with violations
- ✅ Clean content → Marked as low-risk, still requires approval
- ⚡ Admin approves/rejects → Then reaches recipient

**3. Admin Review Dashboard**
- Centralized queue for ALL collaboration requests
- 8 workflow types supported:
  * Community → Venue (Proposal)
  * Venue → Community (Counter)
  * Community → Brand (Proposal)
  * Brand → Community (Counter)
  * Brand → Community (Proposal)
  * Community → Brand (Counter)
  * Venue → Community (Proposal)
  * Community → Venue (Counter)
- AI risk scores and violation highlights
- 3-action workflow: Approve / Reject / Sanitize
- Notification system for all new submissions
- Audit trail for compliance

---

## 📥 Input Details

### What Gets Scanned

**All 8 Collaboration Form Types:**
1. Community → Venue (Proposal)
2. Venue → Community (Counter)
3. Community → Brand (Proposal)
4. Brand → Community (Counter)
5. Brand → Community (Proposal)
6. Community → Brand (Counter)
7. Venue → Community (Proposal)
8. Community → Venue (Counter)

**Example: Community → Venue Proposal**
```javascript
{
  proposalType: "community-venue",
  sender: {
    id: "community123",
    type: "community",
    name: "Mumbai Social Club"
  },
  recipient: {
    id: "venue456",
    type: "venue",
    name: "Rooftop Lounge"
  },
  content: {
    eventDetails: "Pool party for 50 people",
    date: "March 15, 2026",
    budget: "₹50,000",
    message: "Let's discuss details" // ← THIS GETS SCANNED
  }
}
```

**Counter-Offer Submission:**
```javascript
{
  proposalId: "prop789",
  counterContent: {
    adjustedBudget: "₹60,000",
    additionalTerms: "50% advance required",
    message: "Counter proposal details" // ← THIS GETS SCANNED
  }
}
```

---

## 🔍 Detection Patterns

| Type | Examples | Severity |
|------|----------|----------|
| **Phone Numbers** | 9876543210, +91-9876543210 | HIGH |
| **Email Addresses** | contact@example.com | MEDIUM |
| **Social Handles** | @myinsta, instagram.com/user | HIGH |
| **Meeting Links** | zoom.us/j/123, meet.google.com | HIGH |
| **Payment Info** | username@paytm, GPay: 9876543210 | HIGH |
| **URLs** | Direct website links | MEDIUM |

---


## 🎨 User Experience Flow

**For Senders (All Proposals & Counters):**
1. Submit proposal/counter form → Instant "Submitting..." feedback
2. AI scan (invisible, <2s) → Progress indicator
3. **Always:** "Submitted! Our team will review and forward your request shortly ✅"
4. Wait for admin approval notification
5. **If approved:** "Your proposal has been forwarded to [Recipient]"
6. **If rejected:** "Your request couldn't be processed. Reason: [Admin note]"

**For Recipients:**
- Only receive admin-approved proposals/counters
- No knowledge of rejected or sanitized content
- Notification: "New collaboration request from [Sender]"
- Can submit counter-offer → Goes to admin dashboard again
- Seamless experience with quality-controlled requests

**For Admins:**
- Real-time notification: "5 new collaboration requests pending"
- Dashboard shows all 8 workflow types
- Each card displays:
  * Sender & Recipient info
  * Request type (Proposal/Counter)
  * AI risk score (color-coded: green/yellow/red)
  * Highlighted violations (if any)
  * Time submitted
- Review interface with:
  * Full proposal/counter content
  * AI scan results and violation highlights
  * Quick actions: Approve / Reject / Sanitize
  * Optional admin notes
- Track review time and approval rate
- Audit log for all decisions

**Notification Flow:**
- **New Proposal** → Admin notified
- **Admin Approves** → Recipient notified
- **Counter Submitted** → Admin notified again
- **Admin Approves Counter** → Original sender notified
- **Admin Rejects** → Sender notified with reason

---

## 🎯 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| AI Scan Speed | <2 seconds | 95th percentile |
| Admin Review Time | <15 min avg | Submission to decision |
| Approval Rate | 70-80% | Approved vs rejected |
| AI Accuracy | >90% | High-risk flagging precision |
| Platform Retention | +25% | Users completing on-platform |
| Review Queue Time | <30 min | Max wait before approval |
| False Positive Rate | <10% | Clean content flagged high-risk |
| Counter-Offer Turnaround | <20 min | Counter approval time |

---

## 🚀 MVP Scope (Phase 1)

**Included:**
- ✅ Pattern-based AI detection (regex)
- ✅ Mandatory admin approval for all 8 workflow types
- ✅ Real-time proposal/counter scanning
- ✅ Admin review dashboard with risk scoring
- ✅ Email/in-app notifications (sender/recipient/admin)
- ✅ Violation highlighting in admin interface
- ✅ Approve/Reject/Sanitize workflow
- ✅ Complete audit logging
- ✅ Admin notification system

**Excluded (Future):**
- ❌ Machine learning model
- ❌ Image OCR scanning
- ❌ Multi-language support
- ❌ Auto-sanitization
- ❌ User reputation scoring
- ❌ Auto-approval for trusted users

---

## 📊 Technical Requirements

**Backend:**
- New service: `agenticAI.js` (pattern matching engine)
- New model: `CollaborationProposal` (8 workflow types + scan results)
- New routes: 
  * `/collaborations/propose` (all 8 form types)
  * `/admin/review-queue` (pending approvals)
  * `/admin/review/:proposalId` (approve/reject/sanitize)
- Notification service integration:
  * Admin notifications (new submissions)
  * Sender notifications (approval/rejection)
  * Recipient notifications (approved proposals)
- Status workflow: `submitted → ai_scanned → pending_review → approved/rejected → delivered`

**Frontend:**
- Admin dashboard section: "Collaboration Review Queue"
- Review modal with:
  * AI risk score display
  * Violation highlights
  * Full proposal content
  * Quick action buttons
- User feedback messages for all states
- Real-time notification bell/badge
- 8 proposal/counter form integrations

**Performance:**
- Scan 1000 proposals/minute capacity
- Process all 8 workflow types
- 99.9% uptime requirement
- <500ms API response time
- <2s AI scan completion
- Real-time admin notifications

---

## 🔐 Privacy & Compliance

- All scans occur server-side (not client-visible)
- Violation data encrypted at rest
- 90-day retention for flagged content
- GDPR-compliant audit trails
- User consent in Terms of Service

---

**Critical Path Items:**
- Admin notification system (must be real-time)
- Handling all 8 workflow types uniformly
- Fast admin review interface (<15 min turnaround)
- Robust status tracking (submitted → approved → delivered)

---

## ⚖️ Admin Workload & Scalability

### Expected Volume
- **Launch Phase (Month 1):** ~20-30 submissions/day
- **Growth Phase (Month 3):** ~100-150 submissions/day
- **Mature Phase (Month 6+):** ~300-500 submissions/day

### Admin Capacity Planning
| Phase | Daily Volume | Admins Needed | Avg Review Time | Coverage |
|-------|--------------|---------------|-----------------|----------|
| Launch | 20-30 | 1 admin | 5 min/request | 2-3 hrs/day |
| Growth | 100-150 | 2 admins | 3 min/request | 5-6 hrs/day |
| Mature | 300-500 | 3-4 admins | 2 min/request | 8-10 hrs/day |

### Efficiency Strategies
1. **AI Risk Prioritization:** Review high-risk (red) before low-risk (green)
2. **Bulk Actions:** Approve multiple clean proposals simultaneously
3. **Shortcuts:** Keyboard shortcuts for faster decisions
4. **Auto-Approval (Future):** Trusted users bypass manual review after history
5. **Shift Coverage:** Admins in different time zones for 16-hour coverage

### Scalability Failsafes
- If queue > 50 items → Alert senior admin
- If wait time > 30 min → Automatic escalation
- If AI flags <5% risk → Fast-track approval option
- Weekend/holiday coverage planning
