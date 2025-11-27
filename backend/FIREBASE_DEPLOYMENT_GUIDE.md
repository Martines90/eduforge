# Firebase Deployment Guide

Complete guide for deploying Firestore indexes and security rules for EduForge.

## 📋 Prerequisites

```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in this directory (if not already done)
firebase init
```

## 🚀 Quick Start

### Option 1: Deploy Everything at Once
```bash
npm run firebase:deploy:firestore
```
This deploys both indexes and rules together.

### Option 2: Deploy Separately
```bash
# Deploy only indexes
npm run firebase:deploy:indexes

# Deploy only rules
npm run firebase:deploy:rules

# Deploy everything (hosting, functions, etc.)
npm run firebase:deploy
```

## 🧪 Testing Security Rules

### Step 1: Install test dependencies
```bash
npm install --save-dev @firebase/rules-unit-testing
```

### Step 2: Start the emulator (Terminal 1)
```bash
npm run emulators:start
```

Keep this running. It starts the Firestore emulator on `localhost:8080`.

### Step 3: Run the tests (Terminal 2)
```bash
npm run test:rules
```

### Step 4: Watch mode (optional)
```bash
npm run test:rules:watch
```
This automatically re-runs tests when you modify `firestore.rules`.

### Step 5: Stop the emulator
```bash
npm run emulators:kill
```
Or just `Ctrl+C` in the emulator terminal.

## 📊 Available NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run emulators:start` | Start Firebase emulators (Firestore only) |
| `npm run emulators:kill` | Kill all Firebase emulator processes |
| `npm run test:rules` | Run security rules tests once |
| `npm run test:rules:watch` | Run tests on file change (watch mode) |
| `npm run firebase:deploy` | Deploy everything to Firebase |
| `npm run firebase:deploy:indexes` | Deploy only Firestore indexes |
| `npm run firebase:deploy:rules` | Deploy only Firestore security rules |
| `npm run firebase:deploy:firestore` | Deploy both indexes and rules |

## 📁 Important Files

| File | Purpose |
|------|---------|
| `firestore.rules` | Security rules for Firestore database |
| `firestore.indexes.json` | Composite index definitions |
| `test-firestore-rules.js` | Automated security rules tests |
| `FIRESTORE_INDEXES_REQUIRED.md` | Documentation of all required indexes |

## 🔐 Security Rules Overview

### Public Access
- ✅ Anyone can read user profiles
- ✅ Anyone can read subject mappings
- ✅ Anyone can read published tasks
- ✅ Anyone can read ratings for published tasks

### Protected Access
- 🔒 Only verified teachers can create tasks
- 🔒 Only task creators can update/delete their tasks
- 🔒 Users can only update their own profiles
- 🔒 Only authenticated users can create ratings
- 🔒 Users can only rate on their own behalf

## 📚 Index Deployment Details

### Deployment Time
- Each index takes **2-5 minutes** to build
- Multiple indexes build **in parallel**
- Total deployment time: **~5-10 minutes**

### Monitoring Index Status
Check index status at:
```
https://console.firebase.google.com/project/eduforge-d29d9/firestore/indexes
```

**Index States:**
- 🟡 **Building** (yellow) - Wait for it to complete
- 🟢 **Enabled** (green) - Ready to use!
- 🔴 **Error** (red) - Check error message

### Required Indexes (10 total)
1. ✅ Published + SubjectMappingId + Recent (most important)
2. ✅ Published + SubjectMappingId + Rating
3. ✅ Published + SubjectMappingId + Views
4. ✅ Published + SubjectMappingId + Popular
5. ✅ Published + Subject + Recent
6. ✅ Published + Subject + GradeLevel + Recent
7. ✅ Published + GradeLevel + Recent
8. ✅ CreatedBy + Recent
9. ✅ CreatedBy + Published + Recent
10. ✅ Published + Subject + DifficultyLevel + Recent

See `FIRESTORE_INDEXES_REQUIRED.md` for detailed specifications.

## ⚡ Troubleshooting

### Error: "Firebase command not found"
```bash
npm install -g firebase-tools
```

### Error: "Not logged in"
```bash
firebase login
```

### Error: "No Firebase project selected"
```bash
firebase use eduforge-d29d9
```

### Error: "Emulator already running"
```bash
npm run emulators:kill
# Wait a few seconds
npm run emulators:start
```

### Error: "Index already exists"
This is normal! Firebase skips existing indexes. Deployment succeeds.

### Tests fail to connect to emulator
1. Make sure emulator is running: `npm run emulators:start`
2. Check if port 8080 is available
3. Try killing and restarting: `npm run emulators:kill && npm run emulators:start`

## 🎯 Deployment Checklist

Before deploying to production:

- [ ] Run security rules tests: `npm run test:rules`
- [ ] All tests pass (no ❌ marks)
- [ ] Review rules changes in `firestore.rules`
- [ ] Review index changes in `firestore.indexes.json`
- [ ] Deploy to production: `npm run firebase:deploy:firestore`
- [ ] Wait 5-10 minutes for indexes to build
- [ ] Verify indexes in Firebase Console
- [ ] Test queries in production

## 📖 Additional Resources

- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

## 🆘 Need Help?

1. Check Firebase Console for detailed error messages
2. Review test output for specific rule violations
3. Consult `FIRESTORE_INDEXES_REQUIRED.md` for index specifications
4. Check Firebase Emulator logs for debugging info

---

**Last Updated**: 2025-01-27
**Firebase Project**: eduforge-d29d9
**Environment**: Production
