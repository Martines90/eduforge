# Database Migration Guide: Country-Based Structure

## Overview

This guide explains how to migrate from a flat Firestore structure to a country-based hierarchical structure.

## What Changed

### Before (Flat Structure)
```
users/
  {userId}/
tasks/
  {taskId}/
verificationCodes/
  {email}/
```

### After (Country-Based Structure)
```
countries/
  {countryCode}/
    users/
      {userId}/
    tasks/
      {taskId}/
    verificationCodes/
      {email}/
```

## Frontend Changes Summary

### ✅ Files Updated

1. **`/lib/firebase/paths.ts`** (NEW)
   - Helper functions for generating country-based paths
   - `getUserPath()`, `getTaskPath()`, etc.

2. **`/lib/firebase/users.ts`**
   - All functions now require `country: CountryCode` parameter
   - `createUser(userData)` → stores at `countries/{country}/users/{uid}`
   - `getUserById(uid, country)` → fetches from country-specific path
   - `getUserByEmail(email, country)` → queries within country

3. **`/lib/firebase/verification.ts`**
   - All functions now require `country: CountryCode` parameter
   - `createVerificationCode(email, country)`
   - `verifyCode(email, code, country)`
   - `deleteVerificationCode(email, country)`

4. **`/lib/services/task-save.service.ts`**
   - Added documentation comments
   - Backend must handle country-based storage

5. **`/app/tasks/[id]/page.tsx`**
   - Added comments about backend requirements

6. **`firestore.rules`** (NEW)
   - Security rules for country-based structure
   - Public read access for tasks
   - Teacher-only task creation

7. **`DATABASE_STRUCTURE.md`** (NEW)
   - Complete documentation of new structure
   - Usage examples
   - Security rules

8. **`MIGRATION_GUIDE.md`** (THIS FILE)
   - Step-by-step migration instructions

## Backend Changes Required

### ⚠️ BREAKING CHANGES

The backend must be updated to use country-based Firestore paths. Here's what needs to change:

### 1. Task Save Endpoint

**Before:**
```python
# Python (Flask/FastAPI)
task_ref = db.collection('tasks').document(task_id)
task_ref.set(task_data)
```

**After:**
```python
# Python (Flask/FastAPI)
country_code = request.json.get('country_code')
task_ref = db.collection('countries').document(country_code) \
           .collection('tasks').document(task_id)
task_ref.set(task_data)
```

### 2. Task Fetch Endpoint

**Before:**
```python
# Python
task_ref = db.collection('tasks').document(task_id)
task = task_ref.get()
```

**After:**
```python
# Python - Option 1: Extract country from task ID prefix
country_code = extract_country_from_task_id(task_id)
task_ref = db.collection('countries').document(country_code) \
           .collection('tasks').document(task_id)
task = task_ref.get()

# Python - Option 2: Accept country as query parameter
country_code = request.args.get('country')
task_ref = db.collection('countries').document(country_code) \
           .collection('tasks').document(task_id)
task = task_ref.get()
```

### 3. Task Search Endpoint

**Before:**
```python
# Python
tasks_ref = db.collection('tasks') \
             .where('subject', '==', subject) \
             .limit(20)
tasks = tasks_ref.get()
```

**After:**
```python
# Python
country_code = get_user_country(request)  # From JWT token or query
tasks_ref = db.collection('countries').document(country_code) \
             .collection('tasks') \
             .where('subject', '==', subject) \
             .limit(20)
tasks = tasks_ref.get()
```

### 4. User Operations

**Before:**
```python
# Python
user_ref = db.collection('users').document(user_id)
```

**After:**
```python
# Python
user_ref = db.collection('countries').document(country_code) \
           .collection('users').document(user_id)
```

## Step-by-Step Migration

### Step 1: Update Backend Code

1. **Add country extraction helper**
   ```python
   def get_country_from_auth(request):
       """Extract country from JWT token"""
       token = verify_firebase_token(request.headers.get('Authorization'))
       return token.get('country', 'US')  # Default to US if not found
   ```

2. **Update all Firestore queries**
   - Replace `db.collection('users')` with `db.collection('countries').document(country).collection('users')`
   - Replace `db.collection('tasks')` with `db.collection('countries').document(country).collection('tasks')`

3. **Test all endpoints**
   - Create test user
   - Create test task
   - Fetch tasks
   - Update/delete operations

### Step 2: Deploy Backend Changes

```bash
# Test locally first
python -m pytest tests/

# Deploy to staging
firebase deploy --only functions:api --project staging

# Verify staging works
curl https://staging-api.eduforge.com/api/v2/tasks/test

# Deploy to production
firebase deploy --only functions:api --project production
```

### Step 3: Deploy Firestore Rules

```bash
# Test rules locally
firebase emulators:start --only firestore

# Deploy to production
firebase deploy --only firestore:rules
```

### Step 4: Migrate Existing Data (If Any)

⚠️ **IMPORTANT**: Only run this if you have existing production data!

```python
# Migration script (run once)
import firebase_admin
from firebase_admin import firestore

db = firestore.client()

def migrate_users():
    """Migrate users to country-based structure"""
    users_ref = db.collection('users')
    users = users_ref.stream()

    for user in users:
        data = user.to_dict()
        country = data.get('country', 'US')

        # Write to new location
        new_ref = db.collection('countries').document(country) \
                   .collection('users').document(user.id)
        new_ref.set(data)

        print(f"Migrated user {user.id} to {country}")

def migrate_tasks():
    """Migrate tasks to country-based structure"""
    tasks_ref = db.collection('tasks')
    tasks = tasks_ref.stream()

    for task in tasks:
        data = task.to_dict()
        country = data.get('country_code', 'US')

        # Write to new location
        new_ref = db.collection('countries').document(country) \
                   .collection('tasks').document(task.id)
        new_ref.set(data)

        print(f"Migrated task {task.id} to {country}")

# Run migrations
migrate_users()
migrate_tasks()
```

### Step 5: Verify Migration

1. **Check new structure**
   ```bash
   # Firebase console
   # Navigate to Firestore
   # Verify countries/ collection exists
   # Check countries/US/users and countries/US/tasks
   ```

2. **Test all features**
   - [ ] User registration
   - [ ] User login
   - [ ] Task creation (teachers)
   - [ ] Task search
   - [ ] Task detail view (public)
   - [ ] Profile updates

3. **Monitor errors**
   ```bash
   # Check logs
   firebase functions:log
   ```

### Step 6: Clean Up Old Data (After Verification)

⚠️ **Wait 1-2 weeks** before deleting old data!

```python
# Delete old collections (DANGER!)
def cleanup_old_data():
    # Delete old users
    users_ref = db.collection('users')
    delete_collection(users_ref, batch_size=100)

    # Delete old tasks
    tasks_ref = db.collection('tasks')
    delete_collection(tasks_ref, batch_size=100)

def delete_collection(coll_ref, batch_size):
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0

    for doc in docs:
        doc.reference.delete()
        deleted += 1

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)
```

## Testing Checklist

### Frontend Tests
- [ ] User registration with country selection
- [ ] Login flow
- [ ] Task creator page (teachers only)
- [ ] Task search page
- [ ] Task detail page (public access)
- [ ] Profile page

### Backend Tests
- [ ] POST /api/register - creates user in correct country path
- [ ] POST /api/login - retrieves user from country path
- [ ] POST /save-task - stores task in correct country path
- [ ] GET /api/v2/tasks/:id - fetches task from country path
- [ ] GET /api/v2/tasks - searches tasks within country

### Security Tests
- [ ] Verify users can only access their own data
- [ ] Verify teachers can create tasks
- [ ] Verify non-teachers cannot create tasks
- [ ] Verify public can view task details
- [ ] Verify users cannot access other countries' data

## Rollback Plan

If something goes wrong:

1. **Keep old collections** until migration is verified
2. **Revert backend code** to previous version
3. **Revert security rules** if needed
4. **Data is still in old structure** - no data loss

## Support

For questions or issues:
- Check `DATABASE_STRUCTURE.md` for structure details
- Review `firestore.rules` for security rules
- Check Firebase console for error logs
- Test with Firebase emulators locally first

## Timeline Estimate

- Backend code updates: 2-4 hours
- Testing: 2-3 hours
- Deployment: 1 hour
- Data migration (if needed): 1-2 hours
- Verification: 1-2 days
- **Total: 1-2 days** (excluding verification period)
