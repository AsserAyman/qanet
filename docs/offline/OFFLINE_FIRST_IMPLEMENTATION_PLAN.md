# Offline-First Authentication Architecture Plan

> **Last Updated:** After code review
> **Status:** Ready for implementation

---

## Critical Issues Found (Must Fix!)

### Issue 1: Root Layout Auth Wall
**File:** `app/_layout.tsx:40-46`

The root layout prevents tabs from rendering when there's no session:
```typescript
{!session ? (
  <Stack.Screen name="(auth)" /> // ❌ Only shows auth screens!
) : (
  <Stack.Screen name="(tabs)" />
)}
```
**Impact:** Users can't reach the app at all without logging in!

### Issue 2: Supabase Client Missing Persistence
**File:** `utils/supabase.ts:7`

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Missing: storage adapter for React Native!
```
**Impact:** Sessions don't persist across app restarts.

### Issue 3: Legacy Functions Require Auth
**File:** `utils/supabase.ts`

Direct Supabase functions (`savePrayerLog`, `getPrayerLogs`, etc.) all call `checkAuth()` which throws.

### Issue 4: Data Migration Missing
When user_id changes from device_id → supabase_user_id, existing local data becomes orphaned.

### Issue 5: Supabase Dashboard Config Required
Anonymous sign-ins must be enabled in Supabase Dashboard → Authentication → Providers.

---

## Current State Analysis

### ✅ What You've Already Built (Excellent!)

You have a **solid offline-first foundation**:

1. **Local SQLite Database** (`utils/database/`)
   - Complete schema with `prayer_logs`, `sync_operations`, `sync_metadata`
   - Sync status tracking (pending/synced/conflict/error)
   - Local-first writes with automatic queuing

2. **Sync Engine** (`utils/sync/syncEngine.ts`)
   - Automatic sync with retry logic
   - Conflict resolution (timestamp-based)
   - Push local → server, pull server → local
   - Triggers: app launch, network reconnect, after data changes

3. **Network Management** (`utils/network/networkManager.ts`)
   - Online/offline detection
   - Event-driven sync triggering
   - Network state listeners

4. **React Hooks** (`hooks/useOfflineData.ts`)
   - `useOfflineData()` - initialization
   - `usePrayerLogs()` - CRUD operations
   - `useNetworkStatus()` - online/offline state
   - `useSyncStatus()` - pending ops, last sync

### ❌ The Critical Problem

**Your app requires authentication to work**, which breaks offline-first UX:

```typescript
// offlineDataManager.ts:251-261
private async getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user.id;

  const cachedUserId = await AsyncStorage.getItem('@cached_user_id');
  if (cachedUserId) return cachedUserId;

  throw new Error('No authenticated user found'); // ❌ App crashes without auth
}
```

**Impact:**
- Users can't use the app offline without logging in first
- No "try before signup" experience
- Auth wall blocks immediate usage

---

## Proposed Architecture: Anonymous Device Identity

### Design Principles

1. **Zero friction start** - App works immediately, no signup required
2. **Device as identity** - Each device gets a unique UUID
3. **Local-first always** - All data stored locally first
4. **Optional cloud sync** - Enabled when user wants cross-device access
5. **Seamless upgrade** - Device identity → Email account (no data loss)

---

## Implementation Phases

### Phase 1: Device Identity System (IMMEDIATE)

**Goal:** Make app work 100% offline without any authentication

#### 1.1 Create Device Identity Manager

**New file:** `utils/auth/deviceIdentity.ts`

```typescript
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@device_id';
const DEVICE_SECRET_KEY = '@device_secret';

export class DeviceIdentityManager {
  private deviceId: string | null = null;

  async initialize(): Promise<string> {
    // Try to get existing device ID
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (!deviceId) {
      // First launch - generate new device identity
      deviceId = Crypto.randomUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);

      // Also generate a device secret for future cryptographic signing
      const deviceSecret = Crypto.randomUUID();
      await SecureStore.setItemAsync(DEVICE_SECRET_KEY, deviceSecret);

      console.log('Created new device identity:', deviceId);
    }

    this.deviceId = deviceId;
    return deviceId;
  }

  getDeviceId(): string {
    if (!this.deviceId) {
      throw new Error('DeviceIdentityManager not initialized');
    }
    return this.deviceId;
  }

  async getDeviceSecret(): Promise<string> {
    const secret = await SecureStore.getItemAsync(DEVICE_SECRET_KEY);
    if (!secret) throw new Error('No device secret found');
    return secret;
  }
}

export const deviceIdentityManager = new DeviceIdentityManager();
```

#### 1.2 Update Offline Data Manager

**Modify:** `utils/database/offlineDataManager.ts`

```typescript
// OLD (throws error when no user)
private async getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user.id;

  const cachedUserId = await AsyncStorage.getItem('@cached_user_id');
  if (cachedUserId) return cachedUserId;

  throw new Error('No authenticated user found'); // ❌
}

// NEW (always works, offline-first)
private async getCurrentUserId(): Promise<string> {
  // Priority 1: Supabase authenticated user (if logged in)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await AsyncStorage.setItem('@cached_user_id', user.id);
    return user.id;
  }

  // Priority 2: Cached user ID (from previous session)
  const cachedUserId = await AsyncStorage.getItem('@cached_user_id');
  if (cachedUserId) return cachedUserId;

  // Priority 3: Device ID (always available, offline-first)
  return deviceIdentityManager.getDeviceId();
}
```

#### 1.3 Update Initialization Flow

**Modify:** `utils/database/offlineDataManager.ts`

```typescript
import { deviceIdentityManager } from '../auth/deviceIdentity';

async initialize(): Promise<void> {
  if (this.isInitialized) return;

  try {
    // Initialize device identity FIRST (offline-first)
    await deviceIdentityManager.initialize();

    await sqliteManager.initialize();
    await networkManager.initialize();
    await syncEngine.initialize();
    this.isInitialized = true;
    console.log('OfflineDataManager initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OfflineDataManager:', error);
    throw error;
  }
}
```

**Result:** ✅ App now works completely offline without any authentication!

---

### Phase 2: Anonymous Supabase Authentication (CLOUD SYNC)

**Goal:** Enable cloud backup using anonymous Supabase sessions

#### 2.1 Create Anonymous Auth Manager

**New file:** `utils/auth/anonymousAuth.ts`

```typescript
import { supabase } from '../supabase';
import { deviceIdentityManager } from './deviceIdentity';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANON_USER_ID_KEY = '@anon_user_id';

export class AnonymousAuthManager {
  private anonUserId: string | null = null;

  async initialize(): Promise<void> {
    // Check if we already have an anonymous session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      this.anonUserId = session.user.id;
      await AsyncStorage.setItem(ANON_USER_ID_KEY, session.user.id);
      return;
    }

    // Try to restore cached anonymous user
    const cachedAnonId = await AsyncStorage.getItem(ANON_USER_ID_KEY);
    if (cachedAnonId) {
      this.anonUserId = cachedAnonId;
      return;
    }

    // Create new anonymous session
    await this.createAnonymousSession();
  }

  private async createAnonymousSession(): Promise<void> {
    try {
      const deviceId = deviceIdentityManager.getDeviceId();

      // Use Supabase anonymous sign-in
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            device_id: deviceId,
            is_anonymous: true,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        this.anonUserId = data.user.id;
        await AsyncStorage.setItem(ANON_USER_ID_KEY, data.user.id);
        console.log('Created anonymous session:', data.user.id);
      }
    } catch (error) {
      console.error('Failed to create anonymous session:', error);
      // Don't throw - app should work offline without cloud
    }
  }

  getAnonymousUserId(): string | null {
    return this.anonUserId;
  }

  async linkWithEmail(email: string, password: string): Promise<void> {
    // Upgrade anonymous user to permanent user
    const { error } = await supabase.auth.updateUser({
      email,
      password,
    });

    if (error) throw error;

    console.log('Anonymous user linked to email:', email);
  }
}

export const anonymousAuthManager = new AnonymousAuthManager();
```

#### 2.2 Update User ID Resolution

**Modify:** `utils/database/offlineDataManager.ts`

```typescript
private async getCurrentUserId(): Promise<string> {
  // Priority 1: Authenticated user (email/OAuth)
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    await AsyncStorage.setItem('@cached_user_id', user.id);
    return user.id;
  }

  // Priority 2: Anonymous Supabase user (cloud sync without email)
  const anonUserId = anonymousAuthManager.getAnonymousUserId();
  if (anonUserId) {
    await AsyncStorage.setItem('@cached_user_id', anonUserId);
    return anonUserId;
  }

  // Priority 3: Cached user ID (from previous session)
  const cachedUserId = await AsyncStorage.getItem('@cached_user_id');
  if (cachedUserId) return cachedUserId;

  // Priority 4: Device ID (pure offline mode)
  return deviceIdentityManager.getDeviceId();
}
```

#### 2.3 Enable Cloud Sync When Online

**Modify:** `utils/database/offlineDataManager.ts`

```typescript
async initialize(): Promise<void> {
  if (this.isInitialized) return;

  try {
    // 1. Device identity (always first, offline-first)
    await deviceIdentityManager.initialize();

    // 2. Local database (always needed)
    await sqliteManager.initialize();

    // 3. Network detection
    await networkManager.initialize();

    // 4. Anonymous auth (only if online)
    if (networkManager.isOnline()) {
      await anonymousAuthManager.initialize();
    }

    // 5. Sync engine
    await syncEngine.initialize();

    this.isInitialized = true;
    console.log('OfflineDataManager initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OfflineDataManager:', error);
    throw error;
  }
}
```

**Result:** ✅ Cloud sync works without email signup!

---

### Phase 3: Optional Email Linking (CROSS-DEVICE SYNC)

**Goal:** Let users link their device data to an email for multi-device access

#### 3.1 Add Sign-In UI (Non-blocking)

**New component:** `components/AccountLinkingCard.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { anonymousAuthManager } from '../utils/auth/anonymousAuth';

export function AccountLinkingCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLinkAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      await anonymousAuthManager.linkWithEmail(email, password);
      alert('Account linked! Your data is now synced across devices.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text>Enable Cross-Device Sync</Text>
      <Text>Link your data to an email to access it on other devices</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error && <Text style={{ color: 'red' }}>{error}</Text>}

      <TouchableOpacity onPress={handleLinkAccount} disabled={loading}>
        <Text>{loading ? 'Linking...' : 'Link Account'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### 3.2 Add to Settings/Profile Screen

```typescript
// In your settings or profile screen
import { AccountLinkingCard } from '../components/AccountLinkingCard';

export default function SettingsScreen() {
  const { session } = useAuth();

  return (
    <ScrollView>
      {/* Only show if not already linked to email */}
      {!session?.user?.email && <AccountLinkingCard />}

      {/* Rest of settings... */}
    </ScrollView>
  );
}
```

**Result:** ✅ Users can optionally link email for cross-device sync!

---

## Migration Strategy

### For Existing Users (Already Logged In)

No action needed! The new code gracefully handles existing authenticated users:

```typescript
// Priority 1: Authenticated user (existing users stay authenticated)
const { data: { user } } = await supabase.auth.getUser();
if (user?.email) return user.id;
```

### For New Users

1. App launches → Device ID created → Works immediately
2. User goes online → Anonymous session created → Cloud backup enabled
3. User wants multi-device → Links email → Full cross-device sync

---

## Database Schema Changes

### Supabase Schema Update

**Add to `prayer_logs` table:**

```sql
ALTER TABLE prayer_logs
ADD COLUMN device_id uuid REFERENCES auth.users(id);

-- Index for efficient device-based queries
CREATE INDEX idx_prayer_logs_device_id ON prayer_logs(device_id);
```

### Backend Changes

**Update Row Level Security (RLS) policies:**

```sql
-- Allow users to read their own data OR data from their devices
CREATE POLICY "Users can view their own logs"
  ON prayer_logs FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    auth.uid() = device_id
    OR
    user_id IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'linked_device_id' = auth.uid()::text
    )
  );
```

---

## Testing Plan

### Phase 1 Testing (Device Identity)

- [ ] Fresh install → Device ID created → App works offline
- [ ] Create prayer log offline → Saves to SQLite
- [ ] View stats offline → Works without errors
- [ ] Restart app → Device ID persisted → Data still there

### Phase 2 Testing (Anonymous Auth)

- [ ] Go online → Anonymous session created automatically
- [ ] Create prayer log → Syncs to Supabase
- [ ] View data on Supabase → Shows with anonymous user_id
- [ ] Go offline → App continues working
- [ ] Go back online → Pending changes sync

### Phase 3 Testing (Email Linking)

- [ ] Link email → Anonymous user upgraded
- [ ] Data still accessible → No data loss
- [ ] Second device login with email → Data syncs
- [ ] Both devices show same data → Cross-device sync works

---

## Implementation Order (Revised)

### Phase 0: Remove Auth Walls (IMMEDIATE - Do First!)

**Goal:** Make app accessible without login

1. **Fix `app/_layout.tsx`** - Remove session-based routing, show tabs always
2. **Fix `utils/supabase.ts`** - Add AsyncStorage persistence adapter
3. **Deprecate legacy functions** - Mark direct Supabase functions as deprecated

```typescript
// _layout.tsx - NEW routing (always show tabs)
return (
  <>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
    <StatusBar style={isDark ? "light" : "dark"} />
  </>
);
```

```typescript
// utils/supabase.ts - Add persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Result:** App opens directly to main screen ✅

---

### Phase 1: Device Identity System

**Goal:** App works 100% offline without any network

1. Create `utils/auth/deviceIdentity.ts`
2. Update `offlineDataManager.getCurrentUserId()` to use device ID fallback
3. Update `syncEngine.getCurrentUserId()` to use device ID fallback
4. Update initialization order
5. Test: Create prayer log offline → Works without error

**Result:** Full offline functionality ✅

---

### Phase 2: Anonymous Cloud Sync

**Goal:** Cloud backup without email signup

**Prerequisites:**
- Enable "Anonymous Sign-ins" in Supabase Dashboard → Authentication → Providers

1. Create `utils/auth/anonymousAuth.ts`
2. Add anonymous session creation on first online connection
3. Update user ID resolution priority:
   - Authenticated user (email) → Anonymous user → Cached ID → Device ID
4. Handle session refresh for anonymous users
5. Test: Data syncs to Supabase with anonymous user

**Result:** Cloud backup without signup ✅

---

### Phase 3: Data Migration Strategy

**Goal:** Handle user_id transitions smoothly

**Scenarios:**
| From | To | Migration |
|------|-----|-----------|
| device_id | anon_user_id | Re-associate local records |
| anon_user_id | email_user_id | Supabase handles automatically |
| device_id (Device A) + device_id (Device B) | same email | Merge with conflict resolution |

**Implementation:**

```typescript
async migrateLocalDataToNewUserId(oldUserId: string, newUserId: string): Promise<void> {
  // 1. Update all local prayer_logs with new user_id
  await sqliteManager.db.runAsync(
    `UPDATE prayer_logs SET user_id = ?, sync_status = 'pending' WHERE user_id = ?`,
    [newUserId, oldUserId]
  );

  // 2. Queue all records for re-sync
  const logs = await sqliteManager.getPrayerLogs(newUserId, 10000);
  for (const log of logs) {
    await sqliteManager.addSyncOperation({
      table_name: 'prayer_logs',
      operation: 'create', // Re-create on server with new user_id
      local_id: log.local_id,
      data: log,
      created_at: new Date().toISOString(),
      retry_count: 0,
    });
  }

  // 3. Trigger sync
  syncEngine.triggerSync();
}
```

**Result:** No data loss during identity transitions ✅

---

### Phase 4: Account Linking (Optional Email)

**Goal:** Cross-device sync for users who want it

1. Create `AccountLinkingCard` component
2. Add to settings/profile screen
3. Handle edge cases:
   - Email already has account → Offer to merge or switch
   - Linking fails → Keep anonymous, show error
   - Multiple devices same email → Merge server data
4. Test: Link email → Data syncs across devices

**Result:** Optional cross-device sync ✅

---

## Risk Mitigation

### Privacy Concerns

**Q:** Are anonymous users tracked across devices?
**A:** No. Each device has its own UUID. Only after email linking do devices share data.

### Data Loss Concerns

**Q:** What if user uninstalls app before linking email?
**A:** Local data is lost (same as any offline-first app). Solution:
- Show gentle reminder to link email for backup
- Add "Export data" feature (JSON/CSV export)

### Supabase Costs

**Q:** Won't anonymous users increase costs?
**A:** Minimal impact:
- Anonymous users count toward MAU (Monthly Active Users)
- But most users will link email within days
- Implement cleanup job to delete inactive anonymous users after 30 days

---

## Success Metrics

After implementation, you should see:

- ⬆️ **Increased engagement** - Users can try app immediately
- ⬆️ **Higher retention** - No signup friction
- ⬆️ **Better offline UX** - App works everywhere
- ⬆️ **More conversions** - Users link email after seeing value

---

## Open Questions for Discussion

1. **Anonymous user cleanup:** Delete inactive anonymous users after 30 days?
2. **Device limit:** Limit number of devices per email account?
3. **Data migration:** Merge or replace when linking multiple devices to one email?
4. **Export feature:** Add JSON/CSV export before deleting account?
5. **Offline indicator:** Show "Offline mode" badge prominently?

---

## Additional Considerations

### Supabase RLS (Row Level Security) Policies

**Current (likely):** Only authenticated users can access their data
**Needed:** Allow anonymous users + device-linked data

```sql
-- Example RLS policy update
CREATE POLICY "Allow anonymous and authenticated users"
  ON prayer_logs FOR ALL
  USING (
    auth.uid() = user_id
  );
```

Since anonymous users also get a `auth.uid()`, existing RLS should work.
But verify your Supabase dashboard has correct policies.

### Error Handling for Sync Failures

When offline and user creates data:
1. ✅ Data saved locally (immediate)
2. ✅ Queued for sync (your current implementation)
3. ⚠️ Need: Show user pending sync count in UI (you have `OfflineIndicator.tsx` - great!)
4. ⚠️ Need: Handle max retry exceeded (notify user)

### Session Token Refresh

Anonymous sessions need refresh too. Supabase handles this, but ensure:
- `autoRefreshToken: true` in client config
- Handle `TOKEN_REFRESHED` event if needed

### Offline-First UX Improvements

Consider adding:
1. ✅ Offline indicator (you have it!)
2. ✅ Sync button (you have it!)
3. ⬜ "Last synced: X minutes ago" display
4. ⬜ "Sign in to backup" gentle prompt (not blocking)
5. ⬜ Conflict resolution UI (for rare sync conflicts)

---

## Summary

This plan transforms Qanet from **auth-first** to **truly offline-first**:

| Before | After |
|--------|-------|
| ❌ Must login to use app | ✅ Works immediately |
| ❌ Requires internet first time | ✅ Works 100% offline |
| ❌ Auth wall blocks usage | ✅ No signup required |
| ❌ No cross-device sync | ✅ Optional email linking |
| ⚠️ User ID required | ✅ Device ID fallback |

**Your existing infrastructure is excellent** - we just need to add the device identity layer and make authentication optional instead of required.

---

## Implementation Checklist

### Phase 0: Remove Auth Walls
- [ ] Fix `app/_layout.tsx` - Show tabs regardless of session
- [ ] Update `utils/supabase.ts` - Add AsyncStorage persistence
- [ ] Verify auth screens still accessible (for optional login)

### Phase 1: Device Identity
- [ ] Create `utils/auth/deviceIdentity.ts`
- [ ] Update `offlineDataManager.getCurrentUserId()`
- [ ] Update `syncEngine.getCurrentUserId()`
- [ ] Test offline create/read/update/delete

### Phase 2: Anonymous Cloud Sync
- [ ] Enable anonymous sign-ins in Supabase Dashboard
- [ ] Create `utils/auth/anonymousAuth.ts`
- [ ] Initialize anonymous session when online
- [ ] Test cloud sync without email

### Phase 3: Data Migration
- [ ] Implement `migrateLocalDataToNewUserId()`
- [ ] Test device_id → anon_user_id transition
- [ ] Test anon_user_id → email transition

### Phase 4: Account Linking
- [ ] Create `AccountLinkingCard` component
- [ ] Add to settings screen
- [ ] Handle merge/conflict scenarios
- [ ] Test cross-device sync

### UX Polish
- [ ] Add "Sign in to sync" prompt (gentle, non-blocking)
- [ ] Add "Last synced" timestamp display
- [ ] Handle sync error notifications

---

## Files to Create/Modify

### New Files
```
utils/auth/deviceIdentity.ts      # Device UUID management
utils/auth/anonymousAuth.ts       # Anonymous Supabase sessions
components/AccountLinkingCard.tsx # Optional email linking UI
```

### Modified Files
```
app/_layout.tsx                   # Remove auth wall
utils/supabase.ts                 # Add persistence config
utils/database/offlineDataManager.ts # Update getCurrentUserId()
utils/sync/syncEngine.ts          # Update getCurrentUserId()
```

---

## Estimated Scope

| Phase | Files Changed | Complexity | Risk |
|-------|---------------|------------|------|
| Phase 0 | 2 | Low | Low |
| Phase 1 | 3 | Medium | Low |
| Phase 2 | 2 | Medium | Medium |
| Phase 3 | 1 | High | Medium |
| Phase 4 | 2 | Medium | Low |

**Total:** ~10 files, mostly straightforward changes

---

## Ready for Implementation?

The plan is now comprehensive. When you're ready:
1. Start with **Phase 0** (critical fixes) - this unblocks everything
2. Then **Phase 1** (device identity) - makes app truly offline
3. **Phase 2-4** can be done incrementally

Let me know when you want to proceed!
