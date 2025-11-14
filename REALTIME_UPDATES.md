# Real-Time Updates System

This application uses Supabase Realtime to automatically synchronize data across all connected clients without requiring manual page refreshes.

## Status: FULLY ENABLED

All tables have realtime replication enabled. Changes to any data will be broadcast instantly to all connected clients.

## How It Works

The application subscribes to database changes using Supabase's PostgreSQL replication feature. When any user makes a change (adds a deliverable, updates a stage, submits payment, etc.), all connected clients receive the update instantly.

## What Updates in Real-Time

### Dashboard Page
- New projects added
- Project status changes
- Stage completions
- Project statistics updates

### Project Detail Page (Freelancer View)
- Deliverables added/deleted
- Stage status changes
- Revision requests from clients
- Payment submissions from clients
- Extension purchases
- Stage notes/messages
- Payment verifications

### Client Portal
- Work delivery notifications
- Stage status changes
- New deliverables uploaded
- Freelancer messages/notes
- Payment status updates
- Extension status changes
- Project information updates

## Connection Status Indicator

A live status indicator appears in the bottom-right corner of each page:

- **Green "Live Updates Active"**: Connected and receiving real-time updates
- **Yellow "Reconnecting..."**: Connection lost, attempting to reconnect

## Technical Implementation

### Subscription Channels
Each page creates a unique channel to avoid conflicts:
- Dashboard: `dashboard-{userId}`
- Project Detail: `project-detail-{projectId}`
- Client Portal: `client-portal-{shareCode}`

### Subscribed Tables
- `projects` - Project information changes
- `stages` - Stage status and data updates
- `deliverables` - File uploads and deletions
- `revisions` - Revision requests and completions
- `extensions` - Extension purchases and verifications
- `stage_payments` - Payment submissions and verifications
- `stage_notes` - Messages between freelancer and client

### Event Types Monitored
- `INSERT` - New records added
- `UPDATE` - Existing records modified
- `DELETE` - Records removed

## Benefits

1. **No Manual Refresh**: Changes appear automatically without clicking refresh
2. **Real-Time Collaboration**: Both freelancer and client see updates instantly
3. **Better UX**: Immediate feedback when actions are taken
4. **Reduced Confusion**: Always viewing the most current data
5. **Faster Communication**: Messages and notes appear immediately

## Browser Requirements

Real-time updates work in all modern browsers. The feature uses WebSocket connections and will automatically reconnect if the connection is lost.

## Debugging

The system logs detailed real-time events to the browser console:

### Dashboard (Green circles)
```
🟢 [Dashboard] Setting up realtime subscriptions for user: {userId}
🟢 REALTIME EVENT - Project: {eventType, new, old}
🟢 REALTIME EVENT - Stage: {eventType, new, old}
🟢 [Dashboard] Channel status: {status}
```

### Project Detail (Red circles)
```
🔴 [ProjectDetail] Setting up realtime subscriptions for project: {projectId}
🔴 REALTIME EVENT - Deliverable: {eventType, new, old}
🔴 REALTIME EVENT - Stage: {eventType, new, old}
🔴 REALTIME EVENT - Revision: {eventType, new, old}
🔴 REALTIME EVENT - Extension: {eventType, new, old}
🔴 REALTIME EVENT - Payment: {eventType, new, old}
🔴 REALTIME EVENT - Note: {eventType, new, old}
```

### Client Portal (Blue circles)
```
🔵 [ClientPortal] Setting up realtime subscriptions for project: {projectId}
🔵 REALTIME EVENT - Stage: {eventType, new, old}
🔵 REALTIME EVENT - Deliverable: {eventType, new, old}
🔵 REALTIME EVENT - Revision: {eventType, new, old}
🔵 REALTIME EVENT - Extension: {eventType, new, old}
🔵 REALTIME EVENT - Payment: {eventType, new, old}
🔵 REALTIME EVENT - Project: {eventType, new, old}
```

### Note Box (Yellow circles)
```
🟡 [NoteBox] Setting up realtime subscriptions for stage: {stageId}
🟡 REALTIME EVENT - New Note: {eventType, new}
🟡 Adding new note to state
```

### Testing Real-Time

To test if real-time is working:
1. Open browser console (F12)
2. Look for setup messages (colored circles)
3. Make a change (add deliverable, send note, etc.)
4. Watch for REALTIME EVENT messages
5. Verify UI updates without refresh

## Performance

Real-time subscriptions are lightweight and do not impact page performance. Channels are automatically cleaned up when users navigate away from pages.
