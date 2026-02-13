# Collaboration Flow - Summary

## Overview
B2B collaboration system enabling Communities, Venues, and Brands to propose and negotiate event partnerships through structured forms with counter-proposal workflows.

**Total Forms: 8**
- 4 Proposal Forms (Community→Venue, Community→Brand, Brand→Community, Venue→Community)
- 4 Counter Forms (corresponding responses)

**Hidden Admin Review Layer:**
All proposals and counters are reviewed by admin before delivery to ensure compliance and prevent inappropriate information sharing. B2B stakeholders are unaware of this review process.

---

## 4 Core Collaboration Types

### 1. Community → Venue
**Proposal (60-90s):**
- Event details (category, attendees, capacity, date/time + backup)
- Venue requirements (space, seating, bar/food, AV, production)
- Commercial model (revenue share/flat rental/cover charge)
- Past event photos + notes

**Counter Response:**
- Venue reviews each field: Accept ✅ / Modify 🔄 / Decline ❌
- Adds house rules (alcohol, sound limits, age restrictions, setup windows)
- Optional notes per field (max 120 chars)

---

### 2. Community → Brand
**Proposal (60-90s):**
- Event snapshot (category, attendees, format, audience, date/city)
- Brand deliverables (logo placement, on-ground branding, sampling, sponsored segments, digital shoutouts, lead capture)
- Commercial model (cash sponsorship/barter/stall cost/revenue share)
- Past photos + audience proof (sponsors, attendance, community size)

**Counter Response:**
- Brand reviews each deliverable: Accept ✅ / Modify 🔄 / Decline ❌
- Counters commercial terms if needed
- Optional notes per field

---

### 3. Brand → Community
**Proposal (60s):**
- Campaign objectives (awareness, trials, leads, sales, engagement)
- Target audience + preferred event formats
- What brand offers (cash, barter, co-marketing, content, speaking)
- What brand expects (logo, branding, segments, lead capture, exclusivity, content rights)
- City + timeline

**Counter Response:**
- Community reviews each field: Accept ✅ / Modify 🔄 / Decline ❌
- Accepts/modifies brand offerings and expectations
- Optional notes per field

---

### 4. Venue → Community
**Proposal (45-60s):**
- Venue snapshot (type, preferred formats, capacity range)
- What venue provides (space, AV, furniture, staff, F&B, marketing, storage, ticketing)
- Commercial terms (rental/cover charge/revenue share)

**Counter Response:**
- Community reviews venue type, formats, capacity: Accept ✅ / Modify 🔄 / Decline ❌
- Reviews each service offered
- Optional notes per field

---

## Universal UX Pattern

### Proposal Forms
- **Progressive disclosure** (second-level fields appear based on selections)
- **Multi-select options** for flexible requirements
- **Helper text** via info icons
- **Image uploads** (up to 10) for credibility
- **Free-text notes** for context
- **Completion time:** 45-90 seconds

### Counter/Response Forms
**Every field follows same pattern:**
- ✅ **Accept** → field locks, proceeds as proposed
- 🔄 **Modify** → inline selector/text field appears for counter-proposal
- ❌ **Decline** → field marked unavailable
- 💬 **Add note** (optional, max 120 chars)

---

## Commercial Models

### Revenue Share
- Percentage split (20% / 30% / 40% / Open to discussion)
- Applied to: ticket revenue, event revenue, activation-linked revenue

### Flat Rental
- Fixed amount (₹ ___)
- Total space rental cost

### Cover Charge per Attendee
- Per-person fee (₹ ___)
- Based on actual attendance

### Cash Sponsorship
- Fixed sponsorship amount (₹ ___)
- From brand to community

### Barter / In-Kind
- Products, prizes, vouchers, services
- Quantity and value specified

### Stall Cost
- Booth/sales space fee (₹ ___)
- For brand presence at events

---

## Key Features

### 1. Backup Options
- Communities can propose alternate date/time slots
- Venues can accept primary or backup options

### 2. Progressive Disclosure
- Secondary fields appear only when parent option selected
- Example: Select "AV support" → shows Mic, Speakers, Projector, Lighting checkboxes

### 3. Structured Alternatives
- Counters must use structured options (not pure free-text)
- Ensures clarity and faster decision-making

### 4. Credibility Elements
- **Past event photos** (up to 10 images)
- **Audience proof** (sponsors, attendance, community size, repeat rate)
- Helper text: "Requests with photos get faster responses"

### 5. Independent Field Actions
- Each sub-field is individually actionable
- Example: AV support → Mic ✔ Available, Speakers ✖ Not available

---

## Workflow States

### 1. Proposal Sent (User View)
- User submits proposal
- "Your request has been sent. You'll hear back here."
- **Hidden:** Proposal enters admin review queue

### 2. Admin Review (Backend Only)
- Admin dashboard receives proposal
- Reviews all form content for compliance
- Checks for inappropriate information sharing
- Admin actions:
  - ✅ **Approve** → Delivers to recipient
  - ❌ **Reject** → Sends back to proposer with reason
  - 🚩 **Flag** → Marks for further review
- User sees: "Under review" (generic status)

### 3. Delivered to Recipient
- After admin approval, proposal reaches recipient
- Recipient notification sent
- Recipient reviews each section

### 4. Counter Submitted (User View)
- Recipient submits counter/response
- "Your response has been sent."
- **Hidden:** Counter enters admin review queue

### 5. Admin Review Counter (Backend Only)
- Admin reviews counter-proposal
- Same compliance checks
- Admin approves/rejects/flags
- User sees: "Processing response"

### 6. Counter Delivered
- After admin approval, counter reaches original proposer
- Original proposer notification sent

### 7. Final Confirmation
- Both parties reach agreement
- All terms accepted
- Collaboration confirmed

### 8. Declined
- Either party or admin can decline
- Optional note explaining reason

---

## Admin Dashboard & Review System

### Admin Dashboard Features

#### 1. Proposals Queue
**View All Proposals:**
- Community → Venue proposals
- Community → Brand proposals
- Brand → Community proposals
- Venue → Community proposals

**For Each Proposal, Admin Sees:**
- **Proposer Details:** Name, role, contact, profile
- **Recipient Details:** Name, role, contact, profile
- **Proposal Type:** Community→Venue, Brand→Community, etc.
- **Submission Timestamp**
- **Complete Form Content:**
  - All sections filled
  - All fields and values
  - Uploaded images (if any)
  - Notes and comments
- **Status:** Pending Review / Approved / Rejected / Flagged

#### 2. Counters Queue
**View All Counter Responses:**
- Venue → Community counters
- Brand → Community counters
- Community → Brand counters
- Community → Venue counters

**For Each Counter, Admin Sees:**
- **Original Proposal Reference:** Links to original proposal
- **Responder Details:** Name, role, contact
- **Response Type:** Counter / Full Decline
- **Complete Counter Content:**
  - Field-by-field responses (Accept/Modify/Decline)
  - Modified values
  - All notes added
  - Commercial counter-offers
- **Status:** Pending Review / Approved / Rejected / Flagged

#### 3. Review Actions

**Approve:**
- Passes proposal/counter to recipient
- Triggers notification
- Moves to "Approved" archive
- User sees: "Delivered" (after brief delay)

**Reject:**
- Blocks delivery
- Sends back to proposer/responder
- Requires admin reason (private note)
- User sees: "Your submission needs revision"
- User can resubmit after corrections

**Flag:**
- Marks for senior review
- Doesn't block delivery (optional)
- Adds warning tag
- Tracks for pattern analysis

#### 4. Compliance Monitoring

**What Admin Checks For:**
- Direct contact information exchange (phone, email, WhatsApp)
- Attempts to bypass platform
- Inappropriate content or language
- Unrealistic commercial terms (potential fraud)
- Duplicate/spam submissions
- Platform policy violations

**Red Flags:**
- "Contact me at [phone/email]"
- "Let's discuss offline"
- "Send details to my WhatsApp"
- Suspicious pricing patterns
- Fake/misleading images

#### 5. Dashboard Views

**Proposal Details Page:**
```
═══════════════════════════════════════
📋 PROPOSAL #12345
───────────────────────────────────────
## Summary: Complete Flow with Admin Layer

### 8 Total Forms
1. Community → Venue (Proposal)
2. Venue → Community (Counter)
3. Community → Brand (Proposal)
4. Brand → Community (Counter)
5. Brand → Community (Proposal)
6. Community → Brand (Counter)
7. Venue → Community (Proposal)
8. Community → Venue (Counter)

### End-to-End Flow Example

```
Step 1: Community proposes to Venue
   ↓ [Hidden: Admin reviews proposal]
   ↓ [Admin approves]
Step 2: Venue receives proposal
   ↓ Venue submits counter
   ↓ [Hidden: Admin reviews counter]
   ↓ [Admin approves]
Step 3: Community receives counter
   ↓ Community accepts terms
Step 4: Collaboration confirmed
```

### Key Points
- **8 forms total:** 4 proposals + 4 counters
- **Admin reviews everything:** Both proposals and counters
- **Users are unaware:** No mention of admin review in UI
- **Admin sees all:** Proposer, recipient, full content, timestamps
- **Compliance focus:** Prevents direct contact info sharing, fraud, spam
- **Seamless UX:** Users experience direct peer-to-peer flow
- **Backend moderation:** Admin dashboard handles all reviews invisibly

---

*This flow enables transparent, efficient B2B partnerships between communities, venues, and brands - replacing email negotiations with structured, trackable proposals. A hidden admin review layer ensures platform safety and compliance without disrupting user experience
Proposer: [Community Name] (@username)
Recipient: [Venue Name] (@venuename)
Submitted: 2026-02-09 14:30 IST
Status: ⏳ Pending Review

───────────────────────────────────────
SECTION 1: EVENT & TIMING
───────────────────────────────────────
Event Category: Sip & Savor
Expected Attendees: 40–80
Capacity Required: 40–80
Date: 2026-03-15 | 18:00 - 21:00
Backup: 2026-03-16 | 17:00 - 20:00

───────────────────────────────────────
SECTION 2: VENUE REQUIREMENTS
───────────────────────────────────────
☑ Space only
☑ Seating / layout support
☑ Bar / food service
☑ Audio / visual support
   └─ Mic ☑
   └─ Speakers ☑
   └─ Projector ☐
   └─ Lighting ☑
☐ Production / event setup help

───────────────────────────────────────
SECTION 3: COMMERCIALS
───────────────────────────────────────
Model: Revenue Share
Venue Share: 30%
Notes: "Flexible on weekdays, expecting 50+ bar sales"

───────────────────────────────────────
SECTION 4: PROOF & CONTEXT
───────────────────────────────────────
Photos Uploaded: 5 images [View Gallery]
Note: "Regular community event, 4th edition"

───────────────────────────────────────
ADMIN ACTIONS
───────────────────────────────────────
[✅ Approve & Deliver]  [❌ Reject]  [🚩 Flag]

Private Admin Note:
[Text area for internal notes]
═══════════════════════════════════════
```

**Counter Details Page:**
```
═══════════════════════════════════════
📬 COUNTER RESPONSE #12346
───────────────────────────────────────
Original Proposal: #12345 (Community → Venue)
Responder: [Venue Name] (@venuename)
To: [Community Name] (@username)
Submitted: 2026-02-09 16:45 IST
Status: ⏳ Pending Review

───────────────────────────────────────
FIELD-BY-FIELD RESPONSE
───────────────────────────────────────

Seating/Capacity (40-80)
Action: ✅ ACCEPT
Note: —

Date & Time (Mar 15, 6-9 PM)
Action: 🔄 MODIFY → Backup option selected
Note: "Primary date unavailable"

AV Support
Action: ✅ ACCEPT
Sub-fields:
  Mic: ✔ Available
  Speakers: ✔ Available
  Lighting: ✔ Available

Commercial (Revenue Share 30%)
Action: 🔄 COUNTER
Counter Offer: Revenue Share 40%
Note: "Premium weekend pricing"

House Rules Added:
  Alcohol: ✅ Allowed
  Sound Limit: "85dB max after 10 PM"
  Age: "21+ only"
  Setup: "Access from 4 PM"

───────────────────────────────────────
ADMIN ACTIONS
───────────────────────────────────────
[✅ Approve & Deliver]  [❌ Reject]  [🚩 Flag]

Private Admin Note:
[Text area for internal notes]
═══════════════════════════════════════
```

#### 6. Analytics & Reporting

**Admin Dashboard Metrics:**
- Total proposals submitted (today/week/month)
- Total counters submitted
- Average review time
- Approval rate (%)
- Rejection rate (%)
- Flagged submissions
- Most common rejection reasons
- Collaboration success rate
- By type breakdown (Community→Venue, Brand→Community, etc.)

---

## Technical Implementation: Admin Flow

### Proposal Submission Flow

```
User submits proposal
       ↓
Frontend: POST /api/collaborations/propose
       ↓
Backend: 
  - Save to database (status: "pending_admin_review")
  - Create notification for admin dashboard
  - Return to user: "Your request has been sent"
       ↓
User sees: "Under Review" (generic status)
       ↓
Admin Dashboard:
  - Proposal appears in review queue
  - Admin reviews content
  - Admin clicks: Approve / Reject / Flag
       ↓
If APPROVED:
  - Update status: "approved_delivered"
  - Create notification for recipient
  - Recipient receives proposal
       ↓
If REJECTED:
  - Update status: "rejected"
  - Create notification for proposer
  - Proposer can revise and resubmit
       ↓
If FLAGGED:
  - Update status: "flagged"
  - Optionally still deliver
  - Track in compliance system
```

### Counter Submission Flow

```
Recipient submits counter
       ↓
Frontend: POST /api/collaborations/counter
       ↓
Backend:
  - Save to database (status: "counter_pending_review")
  - Create notification for admin dashboard
  - Return to user: "Your response has been sent"
       ↓
User sees: "Processing response"
       ↓
Admin Dashboard:
  - Counter appears in review queue
  - Admin reviews counter content
  - Admin clicks: Approve / Reject / Flag
       ↓
If APPROVED:
  - Update status: "counter_delivered"
  - Create notification for original proposer
  - Proposer receives counter
       ↓
If REJECTED:
  - Update status: "counter_rejected"
  - Create notification for responder
  - Responder can revise and resubmit
```

### Database Schema (Key Fields)

**Collaborations Table:**
- `id`, `type` (community_to_venue, brand_to_community, etc.)
- `proposer_id`, `proposer_type`, `recipient_id`, `recipient_type`
- `status` (pending_admin_review, approved_delivered, rejected, flagged, counter_pending_review, counter_delivered, confirmed, declined)
- `form_data` (JSON: all sections and fields)
- `admin_review_notes` (private)
- `admin_reviewed_by`, `admin_reviewed_at`
- `rejection_reason` (if rejected)
- `compliance_flags` (array)
- `created_at`, `updated_at`

**Collaboration_Counters Table:**
- `id`, `collaboration_id` (references original proposal)
- `responder_id`, `responder_type`
- `counter_data` (JSON: all field responses)
- `status` (pending_admin_review, approved, rejected, flagged)
- `admin_review_notes` (private)
- `admin_reviewed_by`, `admin_reviewed_at`
- `created_at`, `updated_at`

---

## User Experience (Hidden Admin Layer)

### What Users See:

**After Proposing:**
- ✅ "Your request has been sent"
- Status: "Under Review"
- Estimated response time: "2-3 business days"

**Reality Behind the Scenes:**
- Proposal in admin queue
- Admin reviews within 2-24 hours
- If approved, delivered to recipient
- If rejected, proposer notified to revise

**After Receiving Counter:**
- "Response received from [Name]"
- Counter details visible
- Can accept/negotiate further

**Users Never Know:**
- Admin reviewed their submission
- How long admin review took
- What admin checked for
- If submission was flagged

### Admin-to-User Communication

**If Rejected (Generic Messages):**
- "Your submission couldn't be processed. Please review our guidelines and try again."
- "Some information in your request violates our terms. Please revise and resubmit."
- Never mentions "admin review" explicitly

**Generic Status Labels:**
- "Processing" (actually: admin reviewing)
- "Delivered" (actually: admin approved & delivered)
- "Needs revision" (actually: admin rejected)

---

## Design Principles

### Speed
- Forms completable in 45-90 seconds
- Minimal required fields
- Smart defaults

### Clarity
- Each section purpose clearly stated
- Helper text for complex fields
- Visual hierarchy (primary/secondary actions)

### Flexibility
- Multiple commercial models
- Modify option on every field
- Optional notes for nuance

### Trust
- Photo uploads for credibility
- Structured responses (not essay-style)
- Transparent terms

---

## Implementation Notes

### Form Structure
1. **Section headers** - Clear purpose statement
2. **Required vs Optional** - Marked clearly
3. **Field types:**
   - Dropdowns (categories, cities)
   - Multi-select (requirements, formats)
   - Range chips (attendees, capacity, percentages)
   - Date/time pickers
   - Text fields (notes, custom values)
   - Image uploads

### Response Patterns
- **Radio buttons** for Accept/Modify/Decline
- **Inline expansion** when Modify selected
- **Lock icon** when field accepted
- **Strike-through** when declined
- **Note icon** when note added

### Notifications
- Real-time updates on proposal status
- In-app notifications for:
  - Proposal received
  - Counter submitted
  - Field modifications
  - Final confirmation/decline

---

## Business Logic

### Validation Rules
- At least one commercial model must be selected
- Date/time must be future dates
- Capacity ranges must be realistic
- Image uploads max 10 files

### Counter Rules
- Can't modify accepted fields (must decline first)
- Must provide note when declining critical fields
- Commercial counter must select one alternative model

### Confirmation Requirements
- Both parties must accept final terms
- All critical fields must be non-declined
- Commercial terms must be agreed upon

---

## User Roles & Permissions

### Community Organizer
- Can propose to: Venues, Brands
- Can respond to: Brand proposals, Venue proposals

### Venue
- Can propose to: Communities
- Can respond to: Community proposals

### Brand
- Can propose to: Communities
- Can respond to: Community proposals

---

## Success Metrics
- **Form completion rate** (target: >85%)
- **Response time** (target: <48 hours)
- **Acceptance rate** (proposals → confirmed collaborations)
- **Counter rounds** (fewer = better; target: <3 rounds)
- **Time to confirmation** (proposal → final agreement)

---

## Key Differentiators
1. **Structured counters** (not email threads)
2. **Field-level granularity** (accept some, modify others)
3. **Progressive disclosure** (complexity on demand)
4. **Visual proof** (photo uploads)
5. **Commercial flexibility** (6 models supported)
6. **Speed-optimized** (45-90 second forms)
7. **Mobile-first** (works on any device)

---

*This flow enables transparent, efficient B2B partnerships between communities, venues, and brands - replacing email negotiations with structured, trackable proposals.*
