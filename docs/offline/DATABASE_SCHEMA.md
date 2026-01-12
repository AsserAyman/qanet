# Database Schema Documentation

This document explains every table and column in the Qanet prayer tracking app.

## Architecture Overview

**Offline-First Design:**
- Local SQLite database on device (works offline)
- Supabase PostgreSQL database in cloud (syncs when online)
- Some tables exist in BOTH places, some only local

---

## Tables Overview

### 📍 Location Key
- **[BOTH]** = Exists in both SQLite (local) and Supabase (cloud)
- **[LOCAL]** = Only in SQLite on device
- **[CLOUD]** = Only in Supabase

---

## 1. prayer_logs [BOTH]

**Purpose:** Stores user's prayer/Quran reading logs

**Location:**
- Local SQLite: Working copy, always available offline
- Supabase: Synced copy, shared across devices (if email linked)

### Columns:

#### `local_id` (UUID, Primary Key)
- **What:** Unique ID generated on device when log is created
- **Why:** Allows offline creation without server
- **Example:** `123e4567-e89b-12d3-a456-426614174000`
- **Keep:** ✅ YES - Critical for offline-first

#### `server_id` (UUID, nullable)
- **What:** ID assigned by Supabase when synced
- **Why:** Links local record to cloud record
- **When set:** After first successful sync
- **Example:** `987f6543-c21b-45e6-d789-543216789012`
- **Keep:** ✅ YES - Needed for sync

#### `user_id` (UUID, nullable)
- **What:** OLD reference to auth.users table
- **Status:** DEPRECATED - Kept for backward compatibility
- **Migration path:** Moving to `custom_user_id`
- **Keep:** ⚠️  TEMPORARY - Remove after full migration

#### `custom_user_id` (UUID, nullable → will be NOT NULL)
- **What:** NEW reference to public.users table (custom users)
- **Why:** Device-first identity (not auth-first)
- **Links to:** public.users.id
- **Keep:** ✅ YES - Primary user reference going forward

#### `date` (DATE, required)
- **What:** Date of prayer/reading
- **Format:** YYYY-MM-DD
- **Example:** `2026-01-09`
- **Keep:** ✅ YES

#### `start_surah` (VARCHAR(255), required)
- **What:** Name of starting Surah
- **Example:** `Al-Fatiha`
- **Keep:** ✅ YES

#### `start_ayah` (INTEGER, required)
- **What:** Starting Ayah number
- **Example:** `1`
- **Keep:** ✅ YES

#### `end_surah` (VARCHAR(255), required)
- **What:** Name of ending Surah
- **Example:** `Al-Baqarah`
- **Keep:** ✅ YES

#### `end_ayah` (INTEGER, required)
- **What:** Ending Ayah number
- **Example:** `10`
- **Keep:** ✅ YES

#### `total_ayahs` (INTEGER, required)
- **What:** Total number of Ayahs read
- **Calculated:** Yes (derived from start/end)
- **Keep:** ✅ YES - Denormalized for quick stats

#### `status` (VARCHAR(50), required, default: 'completed')
- **What:** Status of the reading session
- **Possible values:** 'completed', 'in_progress', etc.
- **Keep:** ✅ YES

#### `created_at` (TIMESTAMPTZ, required, auto)
- **What:** When record was first created
- **Set by:** Database on INSERT
- **Keep:** ✅ YES

#### `updated_at` (TIMESTAMPTZ, required, auto)
- **What:** Last time record was modified
- **Updated by:** Database trigger on UPDATE
- **Keep:** ✅ YES

#### `sync_status` (ENUM, required, default: 'pending')
- **What:** Tracks sync state of this record
- **Possible values:**
  - `pending`: Created locally, not yet synced to cloud
  - `synced`: Successfully synced to Supabase
  - `conflict`: Server has different version (rare)
  - `error`: Sync failed (will retry)
- **Why:** Knows which records need syncing
- **Location:** LOCAL ONLY (not meaningful in cloud)
- **Keep:** ✅ YES - Critical for offline-first

#### `last_synced` (TIMESTAMPTZ, nullable)
- **What:** Last time this record was successfully synced to cloud
- **NULL means:** Never synced yet
- **Keep:** ✅ YES - Useful for debugging sync issues

#### `is_deleted` (BOOLEAN, required, default: false)
- **What:** Soft delete flag
- **Why:**
  - Allows "undo" functionality
  - Syncs deletions across devices
  - Prevents hard delete of unsynced data
- **True means:** User deleted, but record kept for sync
- **Keep:** ✅ YES - Important for sync integrity

---

## 2. users [CLOUD ONLY]

**Purpose:** Custom user table for device-first identity

**Location:** Supabase only (public.users)

**Why custom table?** Device ID is primary identity, not email/auth

### Columns:

#### `id` (UUID, Primary Key)
- **What:** Unique custom user ID
- **Keep:** ✅ YES

#### `device_id` (UUID, UNIQUE, required)
- **What:** Device identifier from SecureStore
- **Never changes:** Once generated on device
- **Keep:** ✅ YES - Core identity

#### `auth_user_id` (UUID, nullable)
- **What:** Links to auth.users (anonymous session)
- **Foreign key:** auth.users.id
- **Can change:** Anonymous sessions can be recreated
- **NULL means:** No active auth session
- **Keep:** ✅ YES - Needed for RLS policies

#### `email` (TEXT, UNIQUE, nullable)
- **What:** Optional email for multi-device sync
- **NULL means:** Device-only user (no email linked)
- **Keep:** ✅ YES - Optional feature

#### `email_verified` (BOOLEAN, default: false)
- **What:** Whether email has been confirmed
- **Keep:** ✅ YES

#### `created_at` (TIMESTAMPTZ, required, auto)
- **What:** When custom user was created
- **Keep:** ✅ YES

#### `updated_at` (TIMESTAMPTZ, required, auto)
- **What:** Last modification time
- **Keep:** ✅ YES

#### `last_seen_at` (TIMESTAMPTZ, nullable)
- **What:** Last time user synced/was active
- **Keep:** ✅ YES - Analytics

---

## 3. sync_operations [LOCAL ONLY]

**Purpose:** Queue of pending operations to sync to cloud

**Location:** SQLite ONLY (local device)

**Why needed?** Tracks what changes to push when coming back online

### Columns:

#### `id` (UUID, Primary Key)
- **What:** Unique operation ID
- **Keep:** ✅ YES

#### `table_name` (VARCHAR(255), required)
- **What:** Which table this operation affects
- **Example:** 'prayer_logs'
- **Keep:** ✅ YES

#### `operation` (ENUM, required)
- **What:** Type of change
- **Values:** 'create', 'update', 'delete'
- **Keep:** ✅ YES

#### `local_id` (UUID, required)
- **What:** The local_id of the affected record
- **Links to:** prayer_logs.local_id
- **Keep:** ✅ YES

#### `data` (JSONB, required)
- **What:** Full record data to sync
- **Keep:** ✅ YES

#### `created_at` (TIMESTAMPTZ, required, auto)
- **What:** When operation was queued
- **Keep:** ✅ YES

#### `retry_count` (INTEGER, required, default: 0)
- **What:** How many times sync was attempted
- **Keep:** ✅ YES - Prevents infinite retries

#### `error_message` (TEXT, nullable)
- **What:** Last error if sync failed
- **Keep:** ✅ YES - Debugging

**Should this table exist in Supabase?** ❌ NO - Should be LOCAL ONLY

---

## 4. sync_metadata [LOCAL ONLY]

**Purpose:** Tracks last sync timestamp for each table

**Location:** SQLite ONLY (local device)

**Current status:** ✅ Used by pullServerChanges()

### Columns:

#### `table_name` (VARCHAR(255), Primary Key)
- **What:** Name of synced table
- **Example:** 'prayer_logs'
- **Keep:** ✅ YES

#### `last_sync` (TIMESTAMPTZ, required)
- **What:** Last time we pulled changes from server
- **Used for:** Incremental sync (only fetch new changes)
- **Keep:** ✅ YES

#### `sync_version` (INTEGER, required, default: 1)
- **What:** Version counter for conflict resolution
- **Status:** Not currently used
- **Keep:** ⚠️  MAYBE - Could remove if not implementing versioning

**Should this table exist in Supabase?** ❌ NO - Should be LOCAL ONLY

---

## Redundancy Issues Found

### ❌ Issue 1: sync_operations in Supabase
**Problem:** sync_operations table exists in Supabase but should ONLY be local
**Why wrong:** This is a client-side queue, server doesn't need it
**Action:** DROP table from Supabase

### ❌ Issue 2: sync_metadata in Supabase
**Problem:** sync_metadata table exists in Supabase but should ONLY be local
**Why wrong:** Each device has its own sync state, not shared
**Action:** DROP table from Supabase

### ⚠️  Issue 3: user_id column still in prayer_logs
**Problem:** OLD column `user_id` coexisting with NEW `custom_user_id`
**Migration status:** In progress
**Action:** Keep temporarily, remove after migration complete

---

## Recommended Cleanup

### Phase 1: Drop Supabase-only tables (NOW)
```sql
-- These should ONLY exist in local SQLite
DROP TABLE IF EXISTS public.sync_operations CASCADE;
DROP TABLE IF EXISTS public.sync_metadata CASCADE;
```

### Phase 2: Complete custom_user_id migration (LATER)
```sql
-- After all clients updated to use custom_user_id
ALTER TABLE prayer_logs DROP COLUMN user_id;
ALTER TABLE prayer_logs ALTER COLUMN custom_user_id SET NOT NULL;
```

### Phase 3: Clean up unused columns (OPTIONAL)
```sql
-- If we never implement version-based conflict resolution
ALTER TABLE sync_metadata DROP COLUMN sync_version; -- (LOCAL SQLite only)
```

---

## Summary

### Keep in BOTH (local + cloud):
- ✅ `prayer_logs` - Core data that syncs
- ✅ `users` - User identity (cloud only, referenced locally)

### Keep in LOCAL SQLite only:
- ✅ `sync_operations` - Pending changes queue
- ✅ `sync_metadata` - Last sync timestamps

### Remove from Supabase:
- ❌ `sync_operations` - Client-side only
- ❌ `sync_metadata` - Client-side only

### Remove later (after migration):
- ⚠️  `prayer_logs.user_id` - Deprecated column
