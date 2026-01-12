# Usage Examples - Offline-First Features

## How to Use the Account Linking Card

### Example 1: Add to Settings Screen

```typescript
// app/(tabs)/settings.tsx (or wherever your settings are)
import { ScrollView, View, Text } from 'react-native';
import { AccountLinkingCard } from '@/components/AccountLinkingCard';
import { useAccountStatus } from '@/hooks/useAccountStatus';

export default function SettingsScreen() {
  const { shouldShowLinkingPrompt, hasEmail, userEmail } = useAccountStatus();

  return (
    <ScrollView>
      {/* Show account linking card if user hasn't linked email */}
      {shouldShowLinkingPrompt && (
        <AccountLinkingCard
          onLinkSuccess={() => {
            console.log('Account linked successfully!');
            // Optionally refresh the screen or show a success message
          }}
        />
      )}

      {/* Show account status if user has email */}
      {hasEmail && (
        <View style={{ padding: 16 }}>
          <Text>Signed in as: {userEmail}</Text>
          <Text>✓ Cloud sync enabled</Text>
        </View>
      )}

      {/* Rest of your settings... */}
    </ScrollView>
  );
}
```

### Example 2: Add to Profile Tab

```typescript
// app/(tabs)/profile.tsx
import { View, Text, StyleSheet } from 'react-native';
import { AccountLinkingCard } from '@/components/AccountLinkingCard';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { shouldShowLinkingPrompt, isAuthenticated, userEmail } = useAccountStatus();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* User is offline-only */}
      {!isAuthenticated && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>
            Offline Mode
          </Text>
          <Text style={{ color: theme.textSecondary, marginTop: 8 }}>
            Your data is saved locally on this device.
          </Text>
        </View>
      )}

      {/* Show linking card */}
      {shouldShowLinkingPrompt && <AccountLinkingCard />}

      {/* User has email */}
      {userEmail && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.text }}>Account: {userEmail}</Text>
        </View>
      )}
    </View>
  );
}
```

### Example 3: Show as Modal After First Prayer Log

```typescript
// components/WelcomeToCloudModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { AccountLinkingCard } from './AccountLinkingCard';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODAL_SHOWN_KEY = '@cloud_modal_shown';

export function WelcomeToCloudModal() {
  const [visible, setVisible] = useState(false);
  const { shouldShowLinkingPrompt } = useAccountStatus();

  useEffect(() => {
    checkShouldShow();
  }, []);

  const checkShouldShow = async () => {
    // Only show once, and only if user doesn't have email
    const alreadyShown = await AsyncStorage.getItem(MODAL_SHOWN_KEY);
    if (!alreadyShown && shouldShowLinkingPrompt) {
      // Check if user has created at least one prayer log
      // (you can implement this check based on your needs)
      setVisible(true);
    }
  };

  const handleClose = async () => {
    await AsyncStorage.setItem(MODAL_SHOWN_KEY, 'true');
    setVisible(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <AccountLinkingCard
            onLinkSuccess={() => {
              handleClose();
            }}
          />

          <TouchableOpacity onPress={handleClose} style={styles.skipButton}>
            <Text style={styles.skipText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  container: {
    margin: 20,
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipText: {
    color: 'white',
    fontSize: 16,
  },
});
```

---

## How to Check Authentication Status

### Example: Conditional UI Based on Auth Status

```typescript
import { useAccountStatus } from '@/hooks/useAccountStatus';

function MyComponent() {
  const {
    isAuthenticated,    // Has any Supabase session (anonymous or email)
    hasEmail,           // Has email account
    isAnonymous,        // Has anonymous session (no email)
    shouldShowLinkingPrompt, // Should show linking card
    userEmail,          // User's email (or null)
    loading,            // Loading state
  } = useAccountStatus();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (hasEmail) {
    return <Text>Logged in as {userEmail}</Text>;
  }

  if (isAnonymous) {
    return <Text>Using cloud backup (anonymous)</Text>;
  }

  return <Text>Offline mode (device only)</Text>;
}
```

---

## How to Manually Trigger Data Migration

### Example: Migration Button for Testing

```typescript
import { offlineDataManager } from '@/utils/database/offlineDataManager';
import { deviceIdentityManager } from '@/utils/auth/deviceIdentity';

async function migrateDataForTesting() {
  const deviceId = deviceIdentityManager.getDeviceId();
  const newUserId = 'new-user-id-here'; // From Supabase

  await offlineDataManager.migrateLocalDataToNewUserId(deviceId, newUserId);
  console.log('Migration complete!');
}
```

---

## How to Check Device Identity

### Example: Show Device ID in Settings

```typescript
import { deviceIdentityManager } from '@/utils/auth/deviceIdentity';
import { useState, useEffect } from 'react';

function DeviceInfoSection() {
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    const id = deviceIdentityManager.getDeviceId();
    setDeviceId(id);
  }, []);

  return (
    <View>
      <Text>Device ID: {deviceId.substring(0, 8)}...</Text>
      <Text style={{ fontSize: 12, color: '#666' }}>
        This identifies your device for offline storage
      </Text>
    </View>
  );
}
```

---

## How to Force Anonymous Auth Creation

### Example: "Enable Cloud Backup" Button

```typescript
import { anonymousAuthManager } from '@/utils/auth/anonymousAuth';
import { useState } from 'react';

function EnableCloudBackupButton() {
  const [loading, setLoading] = useState(false);

  const handleEnableBackup = async () => {
    try {
      setLoading(true);
      await anonymousAuthManager.initialize();
      alert('Cloud backup enabled!');
    } catch (error) {
      alert('Failed to enable cloud backup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={handleEnableBackup} disabled={loading}>
      <Text>{loading ? 'Enabling...' : 'Enable Cloud Backup'}</Text>
    </TouchableOpacity>
  );
}
```

---

## How to Show Sync Status

### Example: Sync Status Badge

```typescript
import { useSyncStatus, useNetworkStatus } from '@/hooks/useOfflineData';

function SyncStatusBadge() {
  const { syncStatus, loading } = useSyncStatus();
  const { isOnline } = useNetworkStatus();

  if (loading) return null;

  if (!isOnline) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'gray' }} />
        <Text>Offline</Text>
      </View>
    );
  }

  if (syncStatus.pendingOperations > 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'orange' }} />
        <Text>Syncing {syncStatus.pendingOperations} items...</Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'green' }} />
      <Text>Synced</Text>
    </View>
  );
}
```

---

## How to Add Sign-In Option

### Example: Sign In with Existing Account

```typescript
import { anonymousAuthManager } from '@/utils/auth/anonymousAuth';
import { offlineDataManager } from '@/utils/database/offlineDataManager';
import { deviceIdentityManager } from '@/utils/auth/deviceIdentity';
import { useState } from 'react';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);

      // Get current device ID
      const deviceId = deviceIdentityManager.getDeviceId();

      // Sign in with email
      await anonymousAuthManager.signInWithEmail(email, password);

      // Get the user from the session
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Migrate local data to this account
        await offlineDataManager.migrateLocalDataToNewUserId(deviceId, user.id);
        alert('Signed in successfully! Your data is now synced.');
      }
    } catch (error: any) {
      alert(error.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
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
      <TouchableOpacity onPress={handleSignIn} disabled={loading}>
        <Text>{loading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## How to Add Sign-Out Option

### Example: Sign Out Button

```typescript
import { anonymousAuthManager } from '@/utils/auth/anonymousAuth';
import { Alert } from 'react-native';

function SignOutButton() {
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Your data will remain on this device but will not sync until you sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await anonymousAuthManager.signOut();
            alert('Signed out successfully');
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={handleSignOut}>
      <Text style={{ color: 'red' }}>Sign Out</Text>
    </TouchableOpacity>
  );
}
```

---

## Debugging Tips

### Check Current User ID

```typescript
import { offlineDataManager } from '@/utils/database/offlineDataManager';

// In your component or during debugging:
async function checkCurrentUserId() {
  const userId = await offlineDataManager['getCurrentUserId']();
  console.log('Current user ID:', userId);
  console.log('Type:', userId.includes('-') ? 'UUID (device or anon)' : 'Unknown');
}
```

### Check Anonymous Auth Status

```typescript
import { anonymousAuthManager } from '@/utils/auth/anonymousAuth';
import { supabase } from '@/utils/supabase';

async function debugAuthStatus() {
  console.log('Anonymous manager ready:', anonymousAuthManager.isReady());
  console.log('Anonymous user ID:', anonymousAuthManager.getAnonymousUserId());
  console.log('Is anonymous:', await anonymousAuthManager.isAnonymous());

  const { data: { session } } = await supabase.auth.getSession();
  console.log('Supabase session:', session);
}
```

### Monitor Sync Operations

```typescript
import { useSyncStatus } from '@/hooks/useOfflineData';

function SyncDebugger() {
  const { syncStatus, loading, forceSync } = useSyncStatus();

  return (
    <View>
      <Text>Loading: {loading.toString()}</Text>
      <Text>Pending ops: {syncStatus.pendingOperations}</Text>
      <Text>Last sync: {syncStatus.lastSync || 'Never'}</Text>
      <Text>Is online: {syncStatus.isOnline.toString()}</Text>
      <TouchableOpacity onPress={forceSync}>
        <Text>Force Sync Now</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## Common Patterns

### Pattern 1: Gentle Prompt to Link Email

Show a non-intrusive banner after some usage:

```typescript
function GentlePrompt() {
  const { shouldShowLinkingPrompt } = useAccountStatus();
  const [dismissed, setDismissed] = useState(false);

  if (!shouldShowLinkingPrompt || dismissed) return null;

  return (
    <View style={{ backgroundColor: '#e3f2fd', padding: 12, flexDirection: 'row' }}>
      <Text style={{ flex: 1 }}>
        💡 Link your email to backup data and sync across devices
      </Text>
      <TouchableOpacity onPress={() => setDismissed(true)}>
        <Text>✕</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Pattern 2: Show "Last Synced" Timestamp

```typescript
import { useSyncStatus } from '@/hooks/useOfflineData';
import { formatDistanceToNow } from 'date-fns';

function LastSyncedIndicator() {
  const { syncStatus } = useSyncStatus();

  if (!syncStatus.lastSync) return <Text>Never synced</Text>;

  const timeAgo = formatDistanceToNow(new Date(syncStatus.lastSync), { addSuffix: true });

  return <Text style={{ fontSize: 12, color: '#666' }}>Last synced {timeAgo}</Text>;
}
```

### Pattern 3: Show Offline Indicator

```typescript
import { useNetworkStatus } from '@/hooks/useOfflineData';

function OfflineBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View style={{ backgroundColor: '#ff9800', padding: 8 }}>
      <Text style={{ color: 'white', textAlign: 'center' }}>
        📡 Offline - Changes will sync when you're back online
      </Text>
    </View>
  );
}
```

---

## Testing Scenarios

### Test 1: Pure Offline Experience

1. Enable airplane mode
2. Launch app
3. Create prayer logs
4. Verify they save locally
5. Restart app
6. Verify data persists

### Test 2: Anonymous Cloud Sync

1. Disable airplane mode
2. Launch app
3. Check console for "Anonymous session created"
4. Create prayer logs
5. Check Supabase dashboard for data

### Test 3: Email Linking

1. Use app with device ID or anonymous
2. Add `<AccountLinkingCard />` to a screen
3. Enter email and password
4. Verify migration completes
5. Check all data is accessible

### Test 4: Cross-Device Sync

1. Device A: Link email
2. Device B: Sign in with same email
3. Verify Device B shows Device A's data
4. Create log on Device B
5. Verify Device A syncs and shows it

---

## Quick Reference

| Feature | File | Export |
|---------|------|--------|
| Device Identity | `utils/auth/deviceIdentity.ts` | `deviceIdentityManager` |
| Anonymous Auth | `utils/auth/anonymousAuth.ts` | `anonymousAuthManager` |
| Data Management | `utils/database/offlineDataManager.ts` | `offlineDataManager` |
| Account Status Hook | `hooks/useAccountStatus.ts` | `useAccountStatus()` |
| Offline Hooks | `hooks/useOfflineData.ts` | `useOfflineData()`, `usePrayerLogs()`, etc. |
| Account Linking UI | `components/AccountLinkingCard.tsx` | `<AccountLinkingCard />` |

---

## Need Help?

Check the implementation summary: `IMPLEMENTATION_SUMMARY.md`
Check the full plan: `OFFLINE_FIRST_IMPLEMENTATION_PLAN.md`
