# Silent Background Sync Architecture

## Design Philosophy: Completely Passive

Qanet uses a **silent, background-only sync system**. Users never see sync status, errors, or UI - it all happens invisibly.

---

## Core Principles

1. **Silent Success** - No messages when sync works
2. **Silent Failure** - No errors shown to users (data is safe locally)
3. **No UI** - No sync buttons, progress indicators, or status messages
4. **Automatic** - Syncs on app open and network reconnection
5. **Passive** - Users never need to think about sync

---

## How It Works

### App Launch

```
App Opens
   ↓
Initialize device identity (silent)
   ↓
Initialize local SQLite (silent)
   ↓
Check network status
   ↓
   ├─ Online? → Initialize anonymous auth (silent)
   │            → Trigger background sync (silent)
   │
   └─ Offline? → Skip (will retry when online)
   ↓
App Ready (user sees main screen immediately)
```

### User Creates Prayer Log

```
User taps "Save"
   ↓
Save to SQLite immediately ← USER SEES SUCCESS
   ↓
Queue for background sync (silent)
   ↓
   ├─ Online? → Sync in background (silent)
   │            ├─ Success? → Mark as synced (silent)
   │            └─ Failure? → Retry later (silent)
   │
   └─ Offline? → Will sync when online (silent)
```

### Network Reconnection

```
Device goes online
   ↓
Trigger background sync (silent)
   ↓
   ├─ Anonymous auth not ready? → Initialize (silent)
   │
   └─ Anonymous auth ready? → Sync queued data (silent)
```

---

## What Users See

### When Creating Prayer Logs

**Offline:**
- ✅ "Prayer log saved" (always works)
- 🔕 No sync messages

**Online:**
- ✅ "Prayer log saved" (always works)
- 🔕 No sync messages (happens in background)

### When Sync Fails

**No error messages!**
- Data is safe locally
- Will retry automatically
- User never knows

### When Fully Offline

- Small "Offline - Your data is saved locally" banner
- No sync status, no pending count
- Just a gentle reassurance

---

## Technical Implementation

### Silent Sync Engine

```typescript
async triggerSync(): Promise<void> {
  if (this.isSyncing || !networkManager.isOnline()) {
    return; // Silent skip
  }

  try {
    this.isSyncing = true;
    await this.performSync();
    // Silent success - no logs, no messages
  } catch (error: any) {
    // Silent failure - data is safe locally
    // Will retry on next trigger
  } finally {
    this.isSyncing = false;
  }
}
```

### Automatic Triggers

Sync happens automatically on:

1. **App initialization** (if online)
2. **Network reconnection** (online event)
3. **After creating/updating prayer log** (if online)

### No User Actions Required

- ❌ No "Sync Now" button
- ❌ No "Retry" prompts
- ❌ No error alerts
- ✅ Everything automatic

---

## Components

### SyncButton.tsx
```typescript
// Always returns null - sync is passive only
return null;
```

**Purpose:** Exists for future debugging, but never renders.

### OfflineIndicator.tsx
```typescript
// Only shows when truly offline
if (isOnline) {
  return null; // Hide when online - no sync status
}

// Show simple offline message
return <Text>Offline - Your data is saved locally</Text>;
```

**Purpose:** Gentle reassurance when offline, nothing else.

---

## Error Handling

### Network Errors
- **User sees:** Nothing
- **What happens:** Silent retry on next sync trigger
- **Data safety:** 100% safe in local SQLite

### Auth Errors
- **User sees:** Nothing
- **What happens:** Silent skip (app works offline)
- **Data safety:** 100% safe locally

### Supabase Errors
- **User sees:** Nothing
- **What happens:** Retry with exponential backoff
- **Data safety:** 100% safe locally

---

## Data Flow

```
User Action (Save Prayer Log)
   ↓
[LOCAL] Save to SQLite ← INSTANT SUCCESS
   ↓
[QUEUE] Add to sync_operations table
   ↓
[BACKGROUND] Trigger sync if online
   ↓
[CLOUD] Upload to Supabase (silent)
   ↓
   ├─ Success? → Mark as synced in SQLite
   └─ Failure? → Stays in queue, retry later
```

**Key:** User only sees the first step (local save). Everything else is invisible.

---

## Retry Logic

### Automatic Retry Triggers

1. **Network comes back online**
2. **App reopens**
3. **After any local data change**

### Retry Strategy

- Max 3 attempts per sync operation
- Exponential backoff (1s, 2s, 4s)
- After 3 failures: Keep in queue, retry on next trigger
- No user-facing errors

---

## When Sync UI SHOULD Show

**Never!** (for this app)

Exceptions only for:
- Debug builds (developer console)
- Testing environments

---

## Benefits

### For Users
- ✅ Zero cognitive load
- ✅ App always feels instant
- ✅ No error fatigue
- ✅ "It just works"

### For Developers
- ✅ Simpler UX
- ✅ Fewer edge cases to handle in UI
- ✅ Better offline experience
- ✅ Users trust the app more

---

## Comparison

### Other Apps (Active Sync)
```
❌ "Syncing..." spinner
❌ "Sync failed. Retry?" alert
❌ "3 items pending" badge
❌ "Last synced 5 minutes ago"
```

### Qanet (Passive Sync)
```
✅ Nothing (just works)
✅ Nothing (retries automatically)
✅ Nothing (syncs in background)
✅ Nothing (user doesn't care)
```

---

## Testing

### How to Verify Sync Works

1. **Create prayer log offline** → Check SQLite (should have data)
2. **Go online** → Wait a few seconds → Check Supabase (should sync)
3. **Create prayer log online** → Check Supabase immediately (should sync fast)
4. **Toggle airplane mode** → No errors should appear

### What Users Should Experience

- **Offline:** App works perfectly, no messages
- **Online:** App works perfectly, no messages
- **Intermittent:** App works perfectly, no messages

**Perfectly boring = perfectly designed.**

---

## Future Considerations

### If Sync Status Becomes Important

Add optional "Advanced" settings screen with:
- Last successful sync timestamp
- Pending operations count
- Manual sync trigger (for debugging)

But **never** show in main UI.

### If Users Report Data Loss

1. Check Supabase anonymous auth enabled
2. Check RLS policies allow anonymous users
3. Check sync_operations table for errors
4. **Still don't show errors to users** - fix backend instead

---

## Summary

Qanet's sync is like breathing:
- **Essential** for the app to work
- **Automatic** without thinking
- **Silent** - you don't notice it
- **Reliable** - keeps you alive

Users should never think about sync. They should just use the app and trust their data is safe.

**Mission accomplished when users say: "It just works."**
