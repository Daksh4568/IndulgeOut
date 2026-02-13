# Collaboration Workflow Testing Guide

## Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend running on `http://localhost:5173` (or your dev port)
- At least 3 test accounts created:
  - Admin account
  - Community Organizer account
  - Venue or Brand account

## Automated Test Script

Run the automated test script from the backend directory:

```bash
cd backend
node testCollaborationWorkflow.js
```

This will test the complete flow automatically.

## Manual Testing Checklist

### Step 1: Create Proposal
- [ ] Login as Community Organizer
- [ ] Navigate to collaborations section
- [ ] Click "Browse Venues" or "Browse Sponsors"
- [ ] Select a venue/brand
- [ ] Fill proposal form completely
- [ ] Submit proposal
- [ ] **VERIFY:** Status shows "Pending" (NOT "Awaiting Admin Review")
- [ ] **VERIFY:** Proposal appears in "Sent" tab
- [ ] **VERIFY:** Notification sent

### Step 2: Admin Reviews Proposal
- [ ] Login as Admin
- [ ] Go to Admin Dashboard
- [ ] Navigate to "Proposals" tab
- [ ] Find the submitted proposal
- [ ] Review details (form data, compliance flags)
- [ ] Click "Approve"
- [ ] Add admin notes
- [ ] Confirm approval
- [ ] **VERIFY:** Proposal moves to "Approved" list
- [ ] **VERIFY:** Notification sent to recipient

### Step 3: Recipient Receives Proposal
- [ ] Login as Venue/Brand (recipient)
- [ ] Go to Collaborations
- [ ] Navigate to "Received" tab
- [ ] **VERIFY:** Status shows "Awaiting Your Response" (NOT "Admin Approved")
- [ ] Click on the proposal
- [ ] Review details
- [ ] Click "Respond" button
- [ ] **VERIFY:** Counter form opens

### Step 4: Recipient Submits Counter
- [ ] Fill counter form:
  - [ ] Accept some fields
  - [ ] Modify some fields (add modified value + note)
  - [ ] Decline some fields (add note)
  - [ ] Fill house rules/deliverables
  - [ ] Add commercial counter-offer (if applicable)
  - [ ] Add general notes
- [ ] Click "Submit Response"
- [ ] **VERIFY:** Success message appears
- [ ] **VERIFY:** Redirected to collaborations page
- [ ] **VERIFY:** Status shows "Counter Pending" (NOT "Counter Under Admin Review")

### Step 5: Admin Reviews Counter
- [ ] Login as Admin
- [ ] Go to Admin Dashboard
- [ ] Navigate to "Counters" tab
- [ ] Find the submitted counter
- [ ] Review counter details:
  - [ ] Check accepted fields
  - [ ] Check modified values
  - [ ] Check declined fields
  - [ ] Check commercial counter
  - [ ] Check general notes
- [ ] Click "Approve Counter"
- [ ] Add admin notes
- [ ] Confirm approval
- [ ] **VERIFY:** Counter moves to "Approved" list
- [ ] **VERIFY:** Notification sent to original proposer

### Step 6: Proposer Reviews Counter
- [ ] Login as Community Organizer (original proposer)
- [ ] Go to Collaborations
- [ ] Navigate to "Sent" tab
- [ ] **VERIFY:** Status shows "Counter Received - Review Required"
- [ ] **VERIFY:** "Review Counter" button visible
- [ ] Click "Review Counter" button
- [ ] **VERIFY:** Counter details page opens
- [ ] Review all counter details:
  - [ ] See original proposal values
  - [ ] See counter modifications
  - [ ] See notes from recipient
  - [ ] See commercial counter (if any)
  - [ ] See house rules/deliverables

### Step 7: Proposer Accepts Counter
- [ ] Click "Accept Counter & Confirm" button
- [ ] Confirm acceptance in dialog
- [ ] **VERIFY:** Success message appears
- [ ] **VERIFY:** Redirected to collaborations page
- [ ] **VERIFY:** Status shows "✓ Confirmed"
- [ ] **VERIFY:** Notification sent to both parties

### Step 8: View Final Terms
- [ ] As either party, find the confirmed collaboration
- [ ] **VERIFY:** Status badge shows "✓ Confirmed"
- [ ] **VERIFY:** "View Final Terms" button visible
- [ ] Click "View Final Terms"
- [ ] **VERIFY:** Final terms page opens
- [ ] **VERIFY:** See merged final terms (original + counter modifications)
- [ ] **VERIFY:** See both parties' information
- [ ] **VERIFY:** See commercial terms
- [ ] **VERIFY:** See confirmation date
- [ ] Click "Export PDF" (optional - may not be implemented yet)

### Step 9: Test Decline Flow
- [ ] Create a new proposal
- [ ] Admin approves it
- [ ] Recipient submits counter
- [ ] Admin approves counter
- [ ] Proposer clicks "Decline Counter"
- [ ] Enter decline reason
- [ ] Confirm decline
- [ ] **VERIFY:** Status changes to "Declined"
- [ ] **VERIFY:** Notification sent to recipient

### Step 10: Test Admin Rejection
- [ ] Create a new proposal
- [ ] Admin clicks "Reject"
- [ ] Add rejection notes
- [ ] Confirm rejection
- [ ] **VERIFY:** Proposer sees "Not Approved" status (NOT "Admin Rejected")
- [ ] **VERIFY:** Proposer sees rejection reason (without "Admin:" prefix)
- [ ] **VERIFY:** Notification sent to proposer

## Key Points to Verify

### User Should NEVER See These Terms:
- ❌ "Admin Review"
- ❌ "Admin Approved"
- ❌ "Admin Rejected"
- ❌ "Awaiting Admin Review"
- ❌ "Admin:" prefix

### User Should See These Terms Instead:
- ✅ "Pending"
- ✅ "Processing"
- ✅ "Delivered"
- ✅ "Awaiting Your Response"
- ✅ "Counter Pending"
- ✅ "Counter Received"
- ✅ "Not Approved" (instead of "Admin Rejected")

### Status Badge Colors:
- **Blue**: Pending/In Progress
- **Purple**: Delivered/Awaiting Response
- **Yellow**: Counter Pending
- **Orange**: Counter Received
- **Green**: Confirmed
- **Red**: Declined/Not Approved

### Notifications to Verify:
1. Proposer → Admin: New proposal submitted
2. Admin → Recipient: Proposal approved and delivered
3. Recipient → Admin: Counter submitted
4. Admin → Proposer: Counter approved and delivered
5. Proposer → Recipient: Counter accepted, collaboration confirmed
6. Proposer → Recipient: Counter declined

## Common Issues to Check

### Frontend Issues:
- [ ] Status badges show correct colors
- [ ] Buttons appear at correct states
- [ ] Navigation works correctly
- [ ] Forms validate properly
- [ ] Loading states show correctly
- [ ] Error messages are user-friendly

### Backend Issues:
- [ ] Status transitions work correctly
- [ ] Notifications are created
- [ ] Data is saved correctly
- [ ] API returns correct status codes
- [ ] Validation works properly

### Integration Issues:
- [ ] Frontend correctly interprets backend status
- [ ] Counter data structure matches between frontend/backend
- [ ] Notifications trigger correctly
- [ ] Status changes trigger UI updates

## Test Data Cleanup

After testing, you may want to clean up test data:

```javascript
// In MongoDB shell or using a script
db.collaborations.deleteMany({ 'proposerId.name': /Test/ });
db.users.deleteMany({ name: /Test/ });
db.notifications.deleteMany({ 'userId.name': /Test/ });
```

## Performance Notes

Expected response times:
- Proposal submission: < 2 seconds
- Counter submission: < 2 seconds
- Admin approval: < 1 second
- Loading collaborations: < 1 second

If any operation takes longer, investigate:
- Database queries (add indexes if needed)
- Network latency
- Frontend rendering performance
