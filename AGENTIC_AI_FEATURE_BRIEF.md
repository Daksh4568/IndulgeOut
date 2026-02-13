# Agentic AI Feature Brief
**Feature Name:** AI-Powered Collaboration Compliance Monitor  
**Version:** 1.0 | **Date:** February 13, 2026  

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

## 📤 Output & Actions

### Scenario 1: Clean Proposal (No Violations - 70% of cases)
```javascript
Response: {
  status: "pending_admin_approval",
  message: "Proposal submitted successfully. Our team will review and forward it shortly.",
  aiRiskScore: 5, // Low risk
  estimatedReviewTime: "10-15 minutes"
}

// Backend stores:
{
  status: "pending_review",
  aiScan: {
    isClean: true,
    violations: [],
    riskScore: 5
  }
}
```

### Scenario 2: Flagged Proposal (Violations Detected - 30% of cases)
```javascript
Response: {
  status: "pending_admin_approval",
  message: "Proposal submitted successfully. Our team will review and forward it shortly.",
  aiRiskScore: 85, // High risk (not shown to user)
  estimatedReviewTime: "15-20 minutes"
}

// Backend stores:
{
  status: "pending_review",
  aiScan: {
    isClean: false,
    violations: [
      { type: "phone", confidence: 95% },
      { type: "social", confidence: 88% }
    ],
    riskScore: 85
  }
}
```

### Scenario 3: Admin Review & Decision

**Admin Dashboard Shows:**
```javascript
ProposalCard: {
  id: "prop789",
  type: "Community → Venue",
  submittedBy: "Mumbai Social Club",
  recipient: "Rooftop Lounge",
  submittedAt: "2 minutes ago",
  aiRiskScore: 85,
  violations: ["phone", "social"],
  status: "pending_review"
}
```

**Admin Actions:**
```javascript
AdminDecisions: {
  approve: "Send as-is to recipient → Recipient sees proposal",
  reject: "Block proposal → Sender notified with reason",
  sanitize: "Remove violations & send → Recipient sees clean version"
}
```

**After Admin Approval:**
```javascript
// Recipient receives:
{
  status: "new_proposal",
  message: "You have a new collaboration request",
  proposalDetails: {...} // Full proposal content
}
```

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

## 📅 Implementation Timeline

- **Week 1:** Backend service + AI detection patterns + risk scoring
- **Week 2:** Database schema (8 workflow types) + API routes + notification system
- **Week 3:** Admin dashboard UI + review queue + approval actions
- **Week 4:** Integration with all 8 collaboration forms
- **Week 5:** Testing + refinement + notification flow validation
- **Week 6:** Soft launch (10% traffic) with manual admin monitoring
- **Week 7:** Full rollout + performance optimization

**Estimated Effort:** 4-5 weeks (1 backend dev + 1 frontend dev + 0.5 admin/tester)

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

---

## ✅ Definition of Done

- [ ] 90%+ AI detection accuracy on test dataset
- [ ] <2 second AI scan time (P95)
- [ ] All 8 collaboration workflows supported
- [ ] Admin dashboard fully functional with review queue
- [ ] Notification system working (admin/sender/recipient)
- [ ] Approve/Reject/Sanitize actions implemented
- [ ] Email and in-app notifications sent correctly
- [ ] Risk scoring algorithm validated
- [ ] Violation highlighting accurate
- [ ] <15 min average admin review time achieved
- [ ] Complete audit trail implemented
- [ ] Documentation complete
- [ ] Tested with 100+ real proposals across all 8 types
- [ ] Security audit passed
- [ ] Stakeholder sign-off

---

**Document Owner:** Product Team  
**Technical Lead:** Backend Team  
**Review Date:** February 14, 2026  
**Last Updated:** February 8, 2026  
**Version:** 2.0 - Mandatory Admin Approval Flow  
**Status:** ✅ Updated - All submissions require admin approval
