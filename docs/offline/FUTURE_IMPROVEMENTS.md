# Future Improvements for Authentication & Sync

> **Status:** Optional enhancements to consider after core functionality is stable
> **Last Updated:** 2026-01-10

---

## Current Status

✅ **Working Architecture:**
- Custom users table with device-first identity
- Anonymous auth for JWT security
- Email linking with `updateUser()`
- Offline-first sync system
- **Architectural decision: Keep custom implementation** (see `OFFLINE_FIRST_ARCHITECTURE_ANALYSIS.md`)

---

## Part 1: Sync Engine Improvements

> **Based on:** Analysis of Supabase/Expo best practices
> **Goal:** Align with industry standards while keeping our offline-first advantages

### 1. Use Standard UUIDs (HIGH PRIORITY)

**Why:** Current ID format (`local_${timestamp}_${random}`) is non-standard and incompatible with Supabase UUID columns

**Current Implementation:**
```typescript
// utils/database/sqlite.ts
private generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // Example: "local_1704806400000_x7a2b3c4d"
}
```

**Recommended Change:**

**File:** `utils/database/sqlite.ts`

```typescript
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

private generateId(): string {
  return uuidv4();
  // Example: "123e4567-e89b-12d3-a456-426614174000"
}
```

**Installation:**
```bash
npm install uuid react-native-get-random-values
```

**Benefits:**
- ✅ Industry standard format
- ✅ Compatible with Supabase UUID columns
- ✅ More portable across systems
- ✅ Cryptographically secure

**Effort:** 30 minutes
**Breaking Change:** No (existing records work as-is)

---

### 2. Add Batched Sync Operations (MEDIUM PRIORITY)

**Why:** Currently making N individual API calls for N pending operations. Should batch into single RPC call.

**Current Implementation:**
```typescript
// utils/sync/syncEngine.ts
private async pushLocalChanges(): Promise<void> {
  const pendingOperations = await sqliteManager.getPendingSyncOperations();

  for (const operation of pendingOperations) {
    await this.processSyncOperation(operation); // ← Individual API call
  }
}
```

**Recommended Implementation:**

**Step 1: Create Postgres RPC Function**

**File:** `supabase/migrations/[timestamp]_add_batch_sync.sql`

```sql
-- Function to handle batched sync operations
CREATE OR REPLACE FUNCTION sync_prayer_logs(
  p_custom_user_id uuid,
  p_changes jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb := '{"created": [], "updated": [], "deleted": []}'::jsonb;
  v_record jsonb;
  v_created_id uuid;
BEGIN
  -- Process creates
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_changes->'created')
  LOOP
    INSERT INTO prayer_logs (
      custom_user_id,
      date,
      start_surah,
      start_ayah,
      end_surah,
      end_ayah,
      total_ayahs,
      status
    ) VALUES (
      p_custom_user_id,
      (v_record->>'date')::date,
      v_record->>'start_surah',
      (v_record->>'start_ayah')::integer,
      v_record->>'end_surah',
      (v_record->>'end_ayah')::integer,
      (v_record->>'total_ayahs')::integer,
      v_record->>'status'
    )
    RETURNING id INTO v_created_id;

    -- Add to result with local_id mapping
    v_result := jsonb_set(
      v_result,
      '{created}',
      (v_result->'created') || jsonb_build_object(
        'local_id', v_record->>'local_id',
        'server_id', v_created_id
      )
    );
  END LOOP;

  -- Process updates
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_changes->'updated')
  LOOP
    UPDATE prayer_logs
    SET
      date = (v_record->>'date')::date,
      start_surah = v_record->>'start_surah',
      start_ayah = (v_record->>'start_ayah')::integer,
      end_surah = v_record->>'end_surah',
      end_ayah = (v_record->>'end_ayah')::integer,
      total_ayahs = (v_record->>'total_ayahs')::integer,
      status = v_record->>'status',
      updated_at = NOW()
    WHERE id = (v_record->>'server_id')::uuid
      AND custom_user_id = p_custom_user_id;
  END LOOP;

  -- Process deletes
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_changes->'deleted')
  LOOP
    DELETE FROM prayer_logs
    WHERE id = (v_record->>'server_id')::uuid
      AND custom_user_id = p_custom_user_id;
  END LOOP;

  RETURN v_result;
END;
$$;
```

**Step 2: Update Sync Engine**

**File:** `utils/sync/syncEngine.ts`

```typescript
private async pushLocalChanges(): Promise<void> {
  const pendingOperations = await sqliteManager.getPendingSyncOperations();

  if (pendingOperations.length === 0) return;

  // Group operations by type
  const changes = {
    created: [],
    updated: [],
    deleted: [],
  };

  for (const operation of pendingOperations) {
    const logData = operation.data as LocalPrayerLog;

    if (operation.operation === 'create') {
      changes.created.push({
        local_id: operation.local_id,
        date: logData.date,
        start_surah: logData.start_surah,
        start_ayah: logData.start_ayah,
        end_surah: logData.end_surah,
        end_ayah: logData.end_ayah,
        total_ayahs: logData.total_ayahs,
        status: logData.status,
      });
    } else if (operation.operation === 'update') {
      // Get server_id from local database
      const logs = await sqliteManager.getPrayerLogs(logData.user_id!, 1000);
      const currentLog = logs.find(log => log.local_id === operation.local_id);

      if (currentLog?.server_id) {
        changes.updated.push({
          server_id: currentLog.server_id,
          date: logData.date,
          start_surah: logData.start_surah,
          start_ayah: logData.start_ayah,
          end_surah: logData.end_surah,
          end_ayah: logData.end_ayah,
          total_ayahs: logData.total_ayahs,
          status: logData.status,
        });
      }
    } else if (operation.operation === 'delete') {
      const logs = await sqliteManager.getPrayerLogs(logData.user_id!, 1000);
      const currentLog = logs.find(log => log.local_id === operation.local_id);

      if (currentLog?.server_id) {
        changes.deleted.push({
          server_id: currentLog.server_id,
        });
      }
    }
  }

  // Single RPC call with all changes
  const customUserId = await this.getCurrentUserId();
  const { data, error } = await supabase.rpc('sync_prayer_logs', {
    p_custom_user_id: customUserId,
    p_changes: changes,
  });

  if (error) throw error;

  // Update local records with server IDs
  for (const created of data.created || []) {
    await sqliteManager.updatePrayerLog(created.local_id, {
      server_id: created.server_id,
      sync_status: SYNC_STATUS.SYNCED,
      last_synced: new Date().toISOString(),
    });
  }

  // Clear all successfully processed operations
  for (const operation of pendingOperations) {
    await sqliteManager.removeSyncOperation(operation.id);
  }
}
```

**Benefits:**
- ✅ 10 pending items = 1 API call instead of 10
- ✅ Faster sync (fewer round-trips)
- ✅ Better battery life
- ✅ Atomic operations (all succeed or all fail)
- ✅ Follows WatermelonDB pattern

**Effort:** 2-3 hours
**Breaking Change:** No (only internal sync logic changes)

---

### 3. Add Exponential Backoff (LOW PRIORITY)

**Why:** Currently retrying failed sync operations immediately, which can overwhelm server or waste battery

**Current Implementation:**
```typescript
// utils/sync/syncEngine.ts
const MAX_RETRY_ATTEMPTS = 3;
// No delay between retries
```

**Recommended Implementation:**

**File:** `utils/sync/syncEngine.ts`

```typescript
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_BASE = 1000; // 1 second
const MAX_RETRY_DELAY = 32000; // 32 seconds

private async retryWithBackoff(
  operation: SyncOperation,
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const newRetryCount = operation.retry_count + 1;

    if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
      // Max retries exceeded
      await sqliteManager.updateSyncOperation(operation.id, {
        retry_count: newRetryCount,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }

    // Calculate exponential backoff delay
    const delay = Math.min(
      RETRY_DELAY_BASE * Math.pow(2, operation.retry_count),
      MAX_RETRY_DELAY
    );

    console.log(`Retrying in ${delay}ms (attempt ${newRetryCount}/${MAX_RETRY_ATTEMPTS})`);

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));

    // Update retry count
    await sqliteManager.updateSyncOperation(operation.id, {
      retry_count: newRetryCount,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    // Retry
    return this.retryWithBackoff(
      { ...operation, retry_count: newRetryCount },
      fn
    );
  }
}

// Usage:
private async processSyncOperation(operation: SyncOperation): Promise<void> {
  await this.retryWithBackoff(operation, async () => {
    switch (operation.operation) {
      case 'create':
        await this.syncCreateOperation(operation);
        break;
      case 'update':
        await this.syncUpdateOperation(operation);
        break;
      case 'delete':
        await this.syncDeleteOperation(operation);
        break;
    }
  });
}
```

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 seconds delay
- Attempt 4: 4 seconds delay
- Attempt 5: 8 seconds delay

**Benefits:**
- ✅ Reduces server load during failures
- ✅ Better battery life (less aggressive retries)
- ✅ Higher success rate (temporary failures recover)
- ✅ Industry standard pattern

**Effort:** 30 minutes
**Breaking Change:** No

---

### 4. Add Realtime Sync (OPTIONAL - NOT RECOMMENDED)

**Why:** Enable instant cross-device updates (only if truly needed)

**Current Limitation:** Changes on Device A only appear on Device B after app reopen

**Recommended Implementation:**

**File:** `utils/sync/syncEngine.ts`

```typescript
async initialize(): Promise<void> {
  if (this.isInitialized) return;

  try {
    // Existing network listener...
    networkManager.onOnline(async () => {
      if (!anonymousAuthManager.isReady()) {
        await anonymousAuthManager.initialize();
      }
      this.triggerSync();
    });

    // OPTIONAL: Add realtime subscription
    if (ENABLE_REALTIME_SYNC) { // Feature flag
      await this.setupRealtimeSync();
    }

    this.isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize SyncEngine:', error);
    throw error;
  }
}

private async setupRealtimeSync(): Promise<void> {
  const customUserId = await this.getCurrentUserId();

  // Subscribe to changes on prayer_logs table
  supabase
    .channel('prayer_logs_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'prayer_logs',
        filter: `custom_user_id=eq.${customUserId}`,
      },
      async (payload) => {
        console.log('🔄 Realtime change received:', payload);

        if (payload.eventType === 'INSERT') {
          await this.handleRealtimeInsert(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          await this.handleRealtimeUpdate(payload.new);
        } else if (payload.eventType === 'DELETE') {
          await this.handleRealtimeDelete(payload.old);
        }
      }
    )
    .subscribe();
}

private async handleRealtimeInsert(serverLog: any): Promise<void> {
  // Check if we already have this record locally
  const customUserId = await this.getCurrentUserId();
  const existingLogs = await sqliteManager.getPrayerLogs(customUserId, 1000);
  const exists = existingLogs.find(log => log.server_id === serverLog.id);

  if (!exists) {
    // Insert from another device - add to local DB
    await sqliteManager.insertPrayerLog({
      server_id: serverLog.id,
      user_id: serverLog.custom_user_id,
      date: serverLog.date,
      start_surah: serverLog.start_surah,
      start_ayah: serverLog.start_ayah,
      end_surah: serverLog.end_surah,
      end_ayah: serverLog.end_ayah,
      total_ayahs: serverLog.total_ayahs,
      status: serverLog.status,
      created_at: serverLog.created_at,
      updated_at: serverLog.updated_at,
      sync_status: SYNC_STATUS.SYNCED,
      last_synced: new Date().toISOString(),
      is_deleted: false,
    });

    console.log('✅ Realtime insert applied');
  }
}

private async handleRealtimeUpdate(serverLog: any): Promise<void> {
  const customUserId = await this.getCurrentUserId();
  const existingLogs = await sqliteManager.getPrayerLogs(customUserId, 1000);
  const existingLog = existingLogs.find(log => log.server_id === serverLog.id);

  if (existingLog) {
    await sqliteManager.updatePrayerLog(existingLog.local_id, {
      date: serverLog.date,
      start_surah: serverLog.start_surah,
      start_ayah: serverLog.start_ayah,
      end_surah: serverLog.end_surah,
      end_ayah: serverLog.end_ayah,
      total_ayahs: serverLog.total_ayahs,
      status: serverLog.status,
      updated_at: serverLog.updated_at,
      sync_status: SYNC_STATUS.SYNCED,
      last_synced: new Date().toISOString(),
    });

    console.log('✅ Realtime update applied');
  }
}

private async handleRealtimeDelete(serverLog: any): Promise<void> {
  const customUserId = await this.getCurrentUserId();
  const existingLogs = await sqliteManager.getPrayerLogs(customUserId, 1000);
  const existingLog = existingLogs.find(log => log.server_id === serverLog.id);

  if (existingLog) {
    await sqliteManager.deletePrayerLog(existingLog.local_id);
    console.log('✅ Realtime delete applied');
  }
}
```

**Configuration:**

**File:** `utils/config.ts` (create if needed)

```typescript
// Feature flags
export const ENABLE_REALTIME_SYNC = false; // Set to true to enable
```

**Benefits:**
- ✅ Instant cross-device updates
- ✅ Better multi-device experience

**Drawbacks:**
- ❌ Increased battery drain
- ❌ More complex sync logic
- ❌ Higher Supabase costs (realtime connections)
- ❌ Not needed for personal prayer logs

**Recommendation:** ❌ **Skip this** unless users specifically request cross-device realtime

**Effort:** 1-2 hours
**Breaking Change:** No (opt-in feature)

---

## Part 2: Authentication & Security Improvements

### 1. Add OAuth Identity Linking

**Why:** Allow users to sign in with Google, Apple, GitHub, etc. and link to their existing account

**Implementation:**

**File:** `utils/auth/anonymousAuth.ts`

```typescript
/**
 * Link OAuth provider to current account
 * Uses Supabase's identity linking for multi-provider support
 *
 * @param provider OAuth provider (google, apple, github, etc.)
 */
async linkWithOAuth(provider: 'google' | 'apple' | 'github' | 'facebook'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No active session to link');
  }

  // Use Supabase identity linking
  const { data, error } = await supabase.auth.linkIdentity({ provider });

  if (error) throw error;

  // Update custom users table with linked identity info
  const customUserId = await getCachedCustomUserId();
  if (customUserId && data.user) {
    await supabase
      .from('users')
      .update({
        auth_user_id: data.user.id,
        email: data.user.email,
        email_verified: data.user.email_confirmed_at !== null,
        updated_at: new Date().toISOString()
      })
      .eq('id', customUserId);
  }

  console.log('✅ OAuth identity linked:', provider);
}

/**
 * Get all linked identities for current user
 */
async getLinkedIdentities(): Promise<any[]> {
  const { data } = await supabase.auth.getUserIdentities();
  return data?.identities || [];
}

/**
 * Unlink an OAuth provider from current account
 * Requires at least 2 identities to unlink one
 *
 * @param identityId Identity ID to unlink
 */
async unlinkIdentity(identityId: string): Promise<void> {
  const identities = await this.getLinkedIdentities();

  if (identities.length < 2) {
    throw new Error('Cannot unlink - account must have at least one identity method');
  }

  const { error } = await supabase.auth.unlinkIdentity(
    identities.find(id => id.id === identityId)
  );

  if (error) throw error;

  console.log('✅ Identity unlinked');
}
```

**UI Component:** `components/OAuthLinkingButtons.tsx`

```typescript
import { TouchableOpacity, Text } from 'react-native';
import { anonymousAuthManager } from '@/utils/auth/anonymousAuth';

export function OAuthLinkingButtons() {
  const handleLinkGoogle = async () => {
    try {
      await anonymousAuthManager.linkWithOAuth('google');
      alert('Google account linked successfully!');
    } catch (error) {
      alert('Failed to link Google account');
    }
  };

  const handleLinkApple = async () => {
    try {
      await anonymousAuthManager.linkWithOAuth('apple');
      alert('Apple account linked successfully!');
    } catch (error) {
      alert('Failed to link Apple account');
    }
  };

  return (
    <>
      <TouchableOpacity onPress={handleLinkGoogle}>
        <Text>🔗 Link with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLinkApple}>
        <Text>🔗 Link with Apple</Text>
      </TouchableOpacity>
    </>
  );
}
```

**Enable in Supabase Dashboard:**
- Auth → Providers → Enable Google, Apple, etc.
- Configure OAuth credentials

---

### 2. Add Advanced RLS for Anonymous Users

**Why:** Restrict certain features to permanent (non-anonymous) users

**Implementation:**

**File:** `supabase/migrations/[timestamp]_add_anonymous_restrictions.sql`

```sql
-- Example: Only permanent users can share prayer logs publicly
CREATE POLICY "Only permanent users can share publicly"
  ON prayer_logs FOR UPDATE
  USING (
    custom_user_id IN (
      SELECT u.id FROM public.users u
      INNER JOIN auth.users au ON u.auth_user_id = au.id
      WHERE au.id = auth.uid()
        AND (au.is_anonymous IS FALSE OR au.is_anonymous IS NULL)
    )
  );

-- Helper function to check if current user is anonymous
CREATE OR REPLACE FUNCTION is_current_user_anonymous()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_anonymous FROM auth.users WHERE id = auth.uid()),
    false
  );
$$;
```

**Usage in app:**

```typescript
// Check if user should be prompted to link email
const { data: { user } } = await supabase.auth.getUser();
const isAnonymous = user?.is_anonymous === true;

if (isAnonymous) {
  // Show prompt: "Link your email to unlock sharing features"
}
```

---

### 3. Cleanup Job for Old Anonymous Users

**Why:** Prevent database bloat from abandoned anonymous accounts

**Implementation:**

**File:** `supabase/migrations/[timestamp]_add_cleanup_job.sql`

```sql
-- Function to clean up old anonymous users
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete custom users whose auth users are anonymous and inactive for 30+ days
  DELETE FROM public.users
  WHERE auth_user_id IN (
    SELECT id FROM auth.users
    WHERE is_anonymous = true
      AND last_sign_in_at < NOW() - INTERVAL '30 days'
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Cleaned up % old anonymous users', deleted_count;
  RETURN deleted_count;
END;
$$;

-- Schedule with pg_cron (if available) or call from edge function
-- SELECT cron.schedule('cleanup-anonymous-users', '0 2 * * 0', 'SELECT cleanup_old_anonymous_users()');
```

**Alternative: Edge Function** (if pg_cron not available)

**File:** `supabase/functions/cleanup-anonymous/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data, error } = await supabaseAdmin.rpc('cleanup_old_anonymous_users')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(
    JSON.stringify({ deleted_count: data, message: 'Cleanup completed' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**Schedule:** Set up GitHub Actions or external cron to call weekly:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/cleanup-anonymous \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### 4. Enhanced CAPTCHA Protection

**Why:** Prevent abuse of anonymous sign-ups (recommended by Supabase)

**Implementation:**

**File:** `utils/auth/anonymousAuth.ts`

```typescript
private async createAnonymousSession(): Promise<void> {
  try {
    const deviceId = deviceIdentityManager.getDeviceId();

    // Get CAPTCHA token (using Turnstile or reCAPTCHA)
    const captchaToken = await getCaptchaToken(); // Implement this

    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          device_id: deviceId,
          is_anonymous_device: true,
        },
        captchaToken: captchaToken, // ← Add CAPTCHA
      }
    });

    // ... rest of the code
  } catch (error) {
    // Silent failure
  }
}
```

**Setup:**
1. Enable Cloudflare Turnstile or Google reCAPTCHA in Supabase Dashboard
2. Add CAPTCHA widget to first-launch screen
3. Pass token when creating anonymous session

---

### 5. Native OAuth Sign-In (Mobile)

**Why:** Better UX with native Google/Apple sign-in instead of web redirects

**Implementation:**

Requires native OAuth libraries:
- Google: `@react-native-google-signin/google-signin`
- Apple: `@invertase/react-native-apple-authentication`

**Example with Google Sign-In:**

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

async linkWithGoogleNative(): Promise<void> {
  // Configure Google Sign-In
  await GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });

  // Get Google ID token
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const { idToken, accessToken } = await GoogleSignin.getTokens();

  // Link with Supabase
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    token: idToken!,
    access_token: accessToken,
  });

  if (error) throw error;

  // Update custom users table
  // ... (same as before)
}
```

---

### 6. Account Deletion with Data Export

**Why:** GDPR compliance and good UX

**Implementation:**

**File:** `utils/auth/accountDeletion.ts`

```typescript
import { supabase } from '../supabase';
import { sqliteManager } from '../database/sqlite';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Export all user data as JSON
 */
export async function exportUserData(): Promise<string> {
  const customUserId = await getCachedCustomUserId();

  // Get all prayer logs from local database
  const logs = await sqliteManager.getPrayerLogs(customUserId!, 10000);

  // Get user info
  const userRecord = await getCustomUserRecord();

  const exportData = {
    user: userRecord,
    prayer_logs: logs,
    exported_at: new Date().toISOString(),
  };

  // Save to file
  const fileUri = `${FileSystem.documentDirectory}qanet_export_${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

  // Share file
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri);
  }

  return fileUri;
}

/**
 * Delete user account and all data
 * WARNING: This is irreversible!
 */
export async function deleteAccount(): Promise<void> {
  const customUserId = await getCachedCustomUserId();

  // 1. Delete custom user (cascades to prayer_logs)
  await supabase
    .from('users')
    .delete()
    .eq('id', customUserId);

  // 2. Delete auth user
  // Note: This requires service role key - call from edge function
  await supabase.functions.invoke('delete-user-account');

  // 3. Clear local data
  await sqliteManager.clearAllData();
  await clearCustomUserId();
  await deviceIdentityManager.clearDeviceIdentity();

  // 4. Sign out
  await supabase.auth.signOut();

  console.log('✅ Account deleted');
}
```

**Edge Function:** `supabase/functions/delete-user-account/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!

  // Create admin client
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Get user from request auth
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Delete user from auth.users
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## Part 3: Code Security & Quality

### 1. Add SQL Field Validation (HIGH PRIORITY - SECURITY FIX)

**Why:** Field names in `updatePrayerLog()` and `updateSyncOperation()` are dynamically constructed without validation, creating a potential SQL injection vulnerability

**Current Implementation:**

**File:** `utils/database/sqlite.ts` (lines 136-153)

```typescript
async updatePrayerLog(
  localId: string,
  updates: Partial<LocalPrayerLog>
): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  // VULNERABLE: Field names not validated
  const setClause = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(', ');

  const values = Object.values(updates);
  values.push(localId);

  await this.db.runAsync(
    `UPDATE ${TABLES.PRAYER_LOGS} SET ${setClause} WHERE local_id = ?`,
    values
  );
}
```

**Security Risk:**
- While TypeScript provides compile-time type safety, runtime attacks could exploit this if:
  - Data comes from untrusted sources (serialization attacks)
  - Type assertions bypass the type system
  - Object keys are manipulated through prototype pollution
- Even in local SQLite, following security best practices prevents vulnerabilities

**Recommended Implementation:**

**File:** `utils/database/sqlite.ts`

```typescript
// Add at top of file, after imports
const ALLOWED_PRAYER_LOG_FIELDS = [
  'date', 'start_surah', 'start_ayah', 'end_surah', 'end_ayah',
  'total_ayahs', 'status', 'sync_status', 'is_deleted', 'updated_at',
  'last_synced', 'server_id', 'user_id'
] as const;

const ALLOWED_SYNC_OPERATION_FIELDS = [
  'table_name', 'operation', 'local_id', 'data',
  'created_at', 'retry_count', 'error_message'
] as const;

// Update updatePrayerLog() method
async updatePrayerLog(
  localId: string,
  updates: Partial<LocalPrayerLog>
): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  // VALIDATE field names before building query
  const updateKeys = Object.keys(updates);
  const invalidFields = updateKeys.filter(
    (key) => !ALLOWED_PRAYER_LOG_FIELDS.includes(key as any)
  );

  if (invalidFields.length > 0) {
    throw new Error(
      `Invalid update fields: ${invalidFields.join(', ')}. ` +
      `Allowed fields: ${ALLOWED_PRAYER_LOG_FIELDS.join(', ')}`
    );
  }

  const setClause = updateKeys
    .map((key) => `${key} = ?`)
    .join(', ');

  const values = Object.values(updates);
  values.push(localId);

  await this.db.runAsync(
    `UPDATE ${TABLES.PRAYER_LOGS} SET ${setClause} WHERE local_id = ?`,
    values
  );
}

// Update updateSyncOperation() method (lines 213-236)
async updateSyncOperation(
  id: string,
  updates: Partial<SyncOperation>
): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  // VALIDATE field names before building query
  const updateKeys = Object.keys(updates).filter((key) => key !== 'id');
  const invalidFields = updateKeys.filter(
    (key) => !ALLOWED_SYNC_OPERATION_FIELDS.includes(key as any)
  );

  if (invalidFields.length > 0) {
    throw new Error(
      `Invalid update fields: ${invalidFields.join(', ')}. ` +
      `Allowed fields: ${ALLOWED_SYNC_OPERATION_FIELDS.join(', ')}`
    );
  }

  const setClause = updateKeys
    .map((key) => `${key} = ?`)
    .join(', ');

  const values = updateKeys.map((key) =>
    key === 'data'
      ? JSON.stringify(updates[key as keyof SyncOperation])
      : updates[key as keyof SyncOperation]
  );
  values.push(id);

  await this.db.runAsync(
    `UPDATE ${TABLES.SYNC_OPERATIONS} SET ${setClause} WHERE id = ?`,
    values
  );
}
```

**Benefits:**
- ✅ Prevents SQL injection through field name manipulation
- ✅ Follows security best practices
- ✅ Provides clear error messages for debugging
- ✅ Defense-in-depth security approach
- ✅ Minimal performance impact (validation is cheap)

**Effort:** 15-20 minutes
**Breaking Change:** No (only affects invalid input that shouldn't work anyway)

---

### 2. Remove Unused Device Secret Code (LOW PRIORITY)

**Why:** Dead code that generates and stores a `deviceSecret` that's never used in the application

**Current Implementation:**

**File:** `utils/auth/deviceIdentity.ts` (lines 44-46)

```typescript
// First launch - generate new device identity
deviceId = Crypto.randomUUID();
await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);

// Dead code - generated but never used
const deviceSecret = Crypto.randomUUID();
await SecureStore.setItemAsync(DEVICE_SECRET_KEY, deviceSecret);
```

**Issues:**
- The `deviceSecret` is generated and stored but never used in the application
- There's a `getDeviceSecret()` method (lines 78-87) but it's never called
- The comment says "for future cryptographic signing if needed" but this never materialized
- Creates unnecessary SecureStore operations on first launch
- Confusing for developers reading the code

**Recommended Implementation:**

**Option 1: Remove Entirely** (Recommended if not planning to use it)

```typescript
// Remove lines 44-46
// Remove DEVICE_SECRET_KEY constant (line 5)
// Remove deviceSecret property (line 21)
// Remove getDeviceSecret() method (lines 78-87)
// Update clearDeviceIdentity() to not delete DEVICE_SECRET_KEY (line 102)

async initialize(): Promise<string> {
  if (this.isInitialized && this.deviceId) {
    return this.deviceId;
  }

  try {
    // Try to get existing device ID
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (!deviceId) {
      // First launch - generate new device identity
      deviceId = Crypto.randomUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }

    this.deviceId = deviceId;
    this.isInitialized = true;
    return deviceId;
  } catch (error) {
    console.error('❌ Failed to initialize device identity:', error);
    throw error;
  }
}

async clearDeviceIdentity(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  this.deviceId = null;
  this.isInitialized = false;
  console.log('⚠️  Device identity cleared');
}
```

**Option 2: Add TODO Comment** (If planning to use it later)

```typescript
// TODO: Implement cryptographic signing with device secret
// For now, this is unused - consider removing if not needed
const deviceSecret = Crypto.randomUUID();
await SecureStore.setItemAsync(DEVICE_SECRET_KEY, deviceSecret);
```

**Benefits:**
- ✅ Cleaner, more maintainable code
- ✅ Removes confusion for developers
- ✅ Slightly faster first-launch initialization
- ✅ Reduces SecureStore usage

**Effort:** 5-10 minutes
**Breaking Change:** No (unused code removal)

---

## Priority Order

### Code Security & Quality (New)

1. **High Priority - CRITICAL:**
   - [ ] Add SQL field validation (15-20 min, **security vulnerability fix**)

2. **Low Priority:**
   - [ ] Remove unused device secret code (5-10 min, code cleanup)

### Sync Engine (Based on Architecture Analysis)

1. **High Priority:**
   - [ ] Use standard UUIDs (30 min effort, industry standard)

2. **Medium Priority:**
   - [ ] Add batched sync operations (2-3 hours, significant performance gain)

3. **Low Priority:**
   - [ ] Add exponential backoff (30 min, better retry logic)
   - [ ] Add realtime sync (1-2 hours, NOT RECOMMENDED for this app)

### Authentication & Security

1. **High Priority:**
   - [ ] CAPTCHA protection (prevent abuse)
   - [ ] Cleanup job for old anonymous users (database hygiene)

2. **Medium Priority:**
   - [ ] OAuth identity linking (better UX)
   - [ ] Account deletion with data export (GDPR compliance)

3. **Low Priority:**
   - [ ] Advanced RLS for anonymous restrictions (optional feature gating)
   - [ ] Native OAuth sign-in (mobile UX improvement)

---

## Recommended Implementation Order

Based on priority and effort, implement in this order:

1. **SQL field validation** (15-20 min) - Security fix, must do first
2. **Use standard UUIDs** (30 min) - Foundation for better sync
3. **Remove unused device secret code** (5-10 min) - Quick cleanup while in auth code
4. **CAPTCHA protection** (varies) - Prevent abuse of anonymous auth
5. **Batched sync operations** (2-3 hours) - Significant performance improvement
6. **Cleanup job for old anonymous users** (1-2 hours) - Database hygiene
7. Everything else as needed...

---

## Notes

- All improvements are **optional** and can be added incrementally
- Current architecture is solid for MVP
- Test each improvement thoroughly before production
- Consider user privacy and security with each addition

---

## References

### Internal Documentation
- `OFFLINE_FIRST_ARCHITECTURE_ANALYSIS.md` - Comprehensive comparison of 5 offline-first approaches
- `IMPLEMENTATION_SUMMARY.md` - Current implementation details
- `SYNC_ARCHITECTURE.md` - Silent sync philosophy
- `DATABASE_SCHEMA.md` - Database structure and rationale

### External Resources
- [Supabase Anonymous Auth Guide](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [OAuth Native Sign-In](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase: Local-First with Legend-State](https://supabase.com/blog/local-first-expo-legend-state)
- [Supabase: Offline-First with WatermelonDB](https://supabase.com/blog/react-native-offline-first-watermelon-db)
- [Expo: Local-First Development](https://docs.expo.dev/guides/local-first/)
