# Message Notifications Implementation Summary

## Overview
Added red dot notifications for new client messages in the freelancer dashboard and project views. Now freelancers receive visual alerts when clients send messages in the notes section.

## Database Changes

### Migration: `20251020012400_add_message_tracking_for_freelancers.sql`
- Added `viewed_by_freelancer_at` column to `stage_notes` table
- Created index for faster queries on unread messages
- Tracks when freelancer has viewed client messages

## Frontend Changes

### 1. Dashboard (`src/pages/Dashboard.tsx`)
**Query Updates:**
- Added `stage_notes` to project query to fetch message data
- Includes `author_type` and `viewed_by_freelancer_at` fields

**Notification Logic:**
- Updated `hasUnreadActions` calculation to include unread client messages
- Red dot appears on project cards when client sends unread messages

**Realtime Updates:**
- Added subscription to `stage_notes` table
- Dashboard refreshes when new messages arrive

### 2. Project Overview (`src/pages/ProjectOverview.tsx`)
**Query Updates:**
- Added `stage_notes` to stage query

**New Functions:**
- `hasUnreadActions()` - Updated to check for unread messages
- `getUnreadMessageCount()` - Counts unread messages per stage

**UI Updates:**
- Stage cards show "NEEDS ATTENTION" badge when unread messages exist
- Displays detailed notification message: "2 new messages from client"
- Combines multiple notifications: "Payment marked • 2 new messages"

### 3. Project Detail (`src/pages/ProjectDetail.tsx`)
**Viewing Logic:**
- `markStagesAsViewed()` now marks client messages as viewed
- Automatically marks all unread client messages when freelancer opens stage
- Updates `viewed_by_freelancer_at` timestamp

### 4. Note Box Component (`src/components/NoteBox.tsx`)
**New Function:**
- `markClientMessagesAsViewed()` - Marks messages as viewed when freelancer opens notes

**Auto-marking:**
- Automatically called when freelancer (authorType === 'freelancer') opens the component
- Only marks client messages, not freelancer's own messages

## Notification Flow

### When Client Sends Message:
1. Client sends message in notes section
2. Message inserted with `viewed_by_freelancer_at = null`
3. Realtime subscription triggers
4. Dashboard and project views update immediately
5. Red dot appears on project card
6. Stage card shows "NEEDS ATTENTION" badge
7. Notification shows message count

### When Freelancer Views Messages:
1. Freelancer opens project detail page
2. `markStagesAsViewed()` marks all client messages as viewed
3. OR freelancer opens notes section
4. `markClientMessagesAsViewed()` marks messages as viewed
5. Red dot disappears
6. Stage badge returns to normal state

## Visual Indicators

### Dashboard - Project Card:
```
┌──────────────────────────┐
│ Coffee Shop Logo 2       │
│ 🔴 🟡 Active             │ ← Red dot appears
│ Samuel Pi                │
│                          │
│ ███████░░░░░  50%        │
│ $1,500      $2,500       │
└──────────────────────────┘
```

### Project Overview - Stage Card:
```
┌────────────────────────────────────┐
│ Stage 1: Discovery & Research      │
│ 🔴 NEEDS ATTENTION    Unpaid       │ ← Red badge
│ Amount: $500 • Revisions: 1/2      │
│                                    │
│ ⚠️ 2 new messages from client     │ ← Clear message
└────────────────────────────────────┘
```

### Combined Notifications:
```
⚠️ Payment marked • Revision requested • 2 new messages
```

## Technical Details

### Database Schema:
```sql
-- stage_notes table
viewed_by_freelancer_at: timestamptz (nullable)

-- Index for performance
idx_stage_notes_viewed_by_freelancer
  ON stage_notes(stage_id, author_type, viewed_by_freelancer_at)
  WHERE author_type = 'client'
```

### Query Pattern:
```typescript
// Check for unread messages
const hasUnreadMessages = stage.stage_notes?.some((note) =>
  note.author_type === 'client' && !note.viewed_by_freelancer_at
) || false;

// Count unread messages
const unreadCount = stage.stage_notes?.filter((note) =>
  note.author_type === 'client' && !note.viewed_by_freelancer_at
).length || 0;
```

### Mark as Viewed:
```typescript
await supabase
  .from('stage_notes')
  .update({ viewed_by_freelancer_at: new Date().toISOString() })
  .eq('stage_id', stageId)
  .eq('author_type', 'client')
  .is('viewed_by_freelancer_at', null);
```

## Benefits

1. **Real-time Awareness**: Freelancers immediately know when clients message them
2. **Clear Communication**: Shows exactly what needs attention
3. **Prioritization**: Helps freelancers focus on projects with client activity
4. **Professional**: Ensures timely responses to client messages
5. **Reduces Delays**: No more missed messages or delayed responses

## Integration with Existing Notifications

Message notifications work alongside existing notifications:
- Payment marked (already implemented)
- Revision requested (already implemented)
- Stage approved (already implemented)
- **New messages from client** (newly added)

All notifications use the same red dot system and "NEEDS ATTENTION" badge for consistency.
