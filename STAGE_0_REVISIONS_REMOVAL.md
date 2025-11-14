# Stage 0 Revisions Field Removal

## Problem
Stage 0 (Down Payment) was displaying "Revisions Used: 0/2" in both freelancer and client portals, which is confusing because down payments are payment gates with no work or revisions involved.

## Solution
Removed all revisions-related display fields from Stage 0 across the entire application.

## Changes Made

### 1. Freelancer Portal - ProjectDetail.tsx
**Location:** Stage card header
- **Before:** Showed "Revisions: 0/2" next to amount
- **After:** Hides revisions field for Stage 0, only shows amount

```typescript
{stage.stage_number !== 0 && (
  <div className="sm:mt-1">
    <p className="text-xs sm:text-sm font-semibold">
      Revisions: {stage.revisions_used}/{stage.revisions_included}
    </p>
  </div>
)}
```

### 2. Freelancer Portal - ProjectOverview.tsx
**Two locations updated:**

#### Completed Stages List
- **Before:** "Amount: $100 • Revisions: 0/2"
- **After:** "Amount: $100" (no revisions for Stage 0)

```typescript
Amount: ${stage.amount.toLocaleString()}{stage.stage_number !== 0 && ` • Revisions: ${stage.revisions_used || 0}/${stage.revisions_included || 2}`}
```

#### Active Stages Cards
- **Before:** Showed revisions separately for all stages
- **After:** Hides revisions field for Stage 0

```typescript
{stage.stage_number !== 0 && (
  <span>Revisions: {stage.revisions_used || 0} / {stage.revisions_included || 2}</span>
)}
```

### 3. Client Portal - StageCard.tsx
**Location:** Stage header amount section
- **Before:** Showed "Revisions: 0/2" below amount for all stages
- **After:** Hides revisions field for Stage 0

```typescript
{stage.stage_number !== 0 && (
  <div className="text-sm mt-1 font-semibold">
    Revisions: {stage.revisions_used}/{stage.revisions_included}
  </div>
)}
```

**Additionally:** Previously fixed expanded view to hide deliverables and revision history for Stage 0

## Stage 0 Display (After Fix)

### Collapsed View:
- ✅ Stage name: "Stage 0: Down Payment"
- ✅ Status badge: "Paid ✓" or "Awaiting Payment"
- ✅ Amount: $100
- ✅ Completed date (if paid)
- ❌ Revisions field: REMOVED

### Expanded View:
- ✅ Simple "Down payment completed" message
- ❌ Deliverables: HIDDEN
- ❌ Revisions: HIDDEN
- ❌ Revision History: HIDDEN

## Files Modified
1. `/src/pages/ProjectDetail.tsx` - Freelancer portal stage detail
2. `/src/pages/ProjectOverview.tsx` - Freelancer portal overview (2 locations)
3. `/src/components/StageCard.tsx` - Client portal stage cards

## Why This Matters
Stage 0 is purely a payment gate to unlock the project. It represents the initial down payment before any work begins. There are no deliverables, no revisions, and no work associated with it. Showing "Revisions: 0/2" was misleading and confusing.

Now Stage 0 displays only what's relevant:
- Payment status
- Payment amount
- Completion date

This creates a clearer distinction between the payment gate (Stage 0) and actual work stages (Stage 1, 2, 3...).
