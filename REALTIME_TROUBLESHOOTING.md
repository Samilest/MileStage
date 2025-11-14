# Real-Time Updates Troubleshooting Guide

## Problem: Changes don't appear without refresh

### Step 1: Check if Realtime is Enabled
Open browser console (F12) and look for setup messages:
- `🟢 [Dashboard] Setting up realtime subscriptions`
- `🔴 [ProjectDetail] Setting up realtime subscriptions`
- `🔵 [ClientPortal] Setting up realtime subscriptions`
- `🟡 [NoteBox] Setting up realtime subscriptions`

**If you don't see these messages:**
- Check that the page has loaded completely
- Verify you're on the correct page (Dashboard, Project Detail, or Client Portal)
- Check browser console for errors

### Step 2: Verify Channel Status
Look for channel status messages:
```
🟢 [Dashboard] Channel status: subscribed
```

**Possible status values:**
- `subscribed` = ✅ Connected and working
- `channel_error` = ❌ Connection failed
- `timed_out` = ⏱️ Connection timeout

**If status is not "subscribed":**
- Check your internet connection
- Verify Supabase URL and keys in `.env` file
- Check Supabase project status

### Step 3: Test Event Reception
1. Keep browser console open (F12)
2. Make a change (add deliverable, send note, update stage)
3. Look for event messages:
   ```
   🔴 REALTIME EVENT - Deliverable: {eventType: "INSERT", new: {...}}
   ```

**If you see events but UI doesn't update:**
- The subscription is working but state update may have an issue
- Check the component is using the state correctly
- Verify React re-renders are not being blocked

**If you don't see events:**
- Database change may have failed
- Subscription filter may be incorrect
- Table may not have realtime enabled

### Step 4: Verify Database Realtime Publications
Run this SQL query in Supabase:
```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

**Expected tables:**
- deliverables
- extensions
- projects
- revisions
- stage_notes
- stage_payments
- stages
- user_profiles

**If tables are missing:**
They need to be added to the realtime publication. Run the migration:
`20251019_enable_realtime_for_all_tables.sql`

## Common Issues

### Issue: Duplicate messages appearing
**Cause:** Optimistic updates + realtime subscription both adding the same item
**Solution:** FIXED - Messages now rely solely on realtime subscription. When sending a message:
1. Clear input immediately (better UX)
2. Insert to database
3. Wait for realtime to add to state (prevents duplicates)
4. On error, restore the message text

**Code pattern used:**
```javascript
const handleSend = async () => {
  const messageToSend = message.trim();
  setMessage(''); // Clear immediately

  try {
    await supabase.from('stage_notes').insert({...});
    // Realtime will add the note to state automatically
  } catch (error) {
    setMessage(messageToSend); // Restore on error
  }
};
```

### Issue: "Live Updates Active" indicator not showing
**Cause:** Channels haven't connected yet
**Solution:** Wait 2-3 seconds after page load. If still not showing, check console for errors.

### Issue: Events show in console but UI doesn't update
**Cause:** State update logic may have a bug
**Solution:**
1. Check that `setStages()`, `setDeliverables()`, etc. are being called
2. Verify React component is not using stale state
3. Check that the data fetching function is being called

### Issue: "Reconnecting..." message appears constantly
**Cause:** WebSocket connection failing
**Solution:**
1. Check internet connection
2. Verify firewall isn't blocking WebSocket connections
3. Check Supabase project status
4. Verify `.env` variables are correct

### Issue: Events only work on one page
**Cause:** Each page has its own channel subscription
**Solution:** This is normal! Each page independently subscribes when loaded.

### Issue: Duplicate events appearing
**Cause:** Multiple subscriptions to the same table
**Solution:**
1. Check that subscriptions are properly cleaned up in useEffect return
2. Verify channel names are unique per page
3. Check for duplicate `useEffect` hooks

## Testing Real-Time Updates

### Test 1: Note Box
1. Open project detail page in two browser windows
2. Send a note in one window
3. Verify note appears in both windows without refresh

**Expected console output:**
```
🟡 [NoteBox] Setting up realtime subscriptions for stage: abc-123
🟡 REALTIME EVENT - New Note: {eventType: "INSERT", new: {...}}
🟡 Adding new note to state
```

### Test 2: Deliverables
1. Open project detail page in two browser windows
2. Add a deliverable in one window
3. Verify deliverable appears in both windows without refresh

**Expected console output:**
```
🔴 REALTIME EVENT - Deliverable: {eventType: "INSERT", new: {...}}
```

### Test 3: Stage Status
1. Open project detail (freelancer) and client portal in two windows
2. Change stage status in project detail
3. Verify status updates in client portal without refresh

**Expected console output (Project Detail):**
```
🔴 REALTIME EVENT - Stage: {eventType: "UPDATE", new: {...}}
```

**Expected console output (Client Portal):**
```
🔵 REALTIME EVENT - Stage: {eventType: "UPDATE", new: {...}}
```

## Still Having Issues?

1. **Clear browser cache and reload**
2. **Check Supabase project dashboard** for any service issues
3. **Verify environment variables** in `.env` file
4. **Check network tab** in browser dev tools for WebSocket connections
5. **Review console logs** for any error messages

## Support Information

If real-time updates are still not working after following this guide:
1. Export browser console logs
2. Note which specific feature isn't working
3. Include screenshots of the issue
4. Share the console output showing the colored circle logs
