# Registration Flow - Visual Diagram

## Complete Onboarding Flow with Registration

```
┌─────────────────────────────────────────────────────────────────┐
│                         FIRST VISIT                             │
│                    (No country cookie)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                   ┌─────────────────┐
                   │  STEP 1         │
                   │  Country        │
                   │  Selection      │
                   │                 │
                   │  🇺🇸 US  🇭🇺 HU  │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  STEP 2         │
                   │  Registration   │ ← NEW REQUIRED STEP
                   │                 │
                   │  👤 Full Name   │
                   │  📧 Email       │
                   └────────┬────────┘
                            │
                     [Saves to cookies:]
                     - is_registered: true
                     - user_profile: {...}
                     - role: 'registered'
                            │
                            ▼
                   ┌─────────────────┐
                   │  STEP 3         │
                   │  Role           │
                   │  Selection      │
                   │                 │
                   │ 🎓 Teacher      │
                   │ 👥 Non-Teacher  │
                   └────────┬────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
        ┌────────────────┐    ┌───────────────┐
        │   NON-TEACHER  │    │    TEACHER    │
        │   identity =   │    │   identity =  │
        │ 'non-teacher'  │    │   'teacher'   │
        │ role='registered'   │  role='registered'
        └───────┬────────┘    └───────┬───────┘
                │                     │
                │                     ▼
                │            ┌─────────────────┐
                │            │  STEP 4         │
                │            │  Subject        │
                │            │  Selection      │
                │            │                 │
                │            │  🔢 Math        │
                │            │  ⚛️ Physics     │
                │            │  🧪 Chemistry   │
                │            │  ... (12 total) │
                │            └────────┬────────┘
                │                     │
                │                     ▼
                │            ┌─────────────────┐
                │            │  STEP 5         │
                │            │  Action         │
                │            │  Selection      │
                │            │                 │
                │            │  ➕ Create New  │
                │            │     [subject]   │
                │            │                 │
                │            │  🔍 Search      │
                │            │     Existing    │
                │            │     [subject]   │
                │            └────────┬────────┘
                │                     │
                │              ┌──────┴───────┐
                │              │              │
                ▼              ▼              ▼
        ┌────────────┐  ┌──────────┐  ┌──────────────┐
        │  Complete  │  │ Navigate │  │   Navigate   │
        │ Onboarding │  │    to    │  │      to      │
        │            │  │  /task_  │  │   /search_   │
        │ Stay on    │  │ creator  │  │    tasks     │
        │    Home    │  │          │  │              │
        └────────────┘  └──────────┘  └──────────────┘
```

## Registration Modal Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                   Modal 2: Registration (NEW)                   │
│  ┌───────────────────────────────────────────────────┐         │
│  │  👤 Create Your Account                           │         │
│  │  Join EduForger to create and manage educational   │         │
│  │  tasks                                             │         │
│  │                                                    │         │
│  │  ℹ️ This is a simplified registration. In         │         │
│  │     production, you would integrate with a proper  │         │
│  │     authentication system.                         │         │
│  │                                                    │         │
│  │  ┌──────────────────────────────────────┐        │         │
│  │  │ Full Name                            │        │         │
│  │  │ [Enter your full name            ]   │        │         │
│  │  └──────────────────────────────────────┘        │         │
│  │                                                    │         │
│  │  ┌──────────────────────────────────────┐        │         │
│  │  │ Email Address                        │        │         │
│  │  │ [your.email@example.com          ]   │        │         │
│  │  └──────────────────────────────────────┘        │         │
│  │                                                    │         │
│  │  By registering, you agree to our Terms of        │         │
│  │  Service and Privacy Policy                       │         │
│  │                                                    │         │
│  │         [Create Account]                          │         │
│  └───────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Complete Modal Sequence

### Full Flow Visualization

```
STEP 1: COUNTRY
┌─────────────────────────────────────────┐
│  Welcome to EduForger! 🎓                │
│  Please select your country...          │
│                                         │
│  ┌────────┐  ┌────────┐                │
│  │🇺🇸 USA  │  │🇭🇺 HU   │                │
│  │English │  │Hungarian│                │
│  └────────┘  └────────┘                │
│                                         │
│     [Continue with English]            │
└─────────────────────────────────────────┘
                ↓
STEP 2: REGISTRATION (NEW)
┌─────────────────────────────────────────┐
│  👤 Create Your Account                 │
│  Join EduForger to create and manage... │
│                                         │
│  ℹ️ Simplified registration note        │
│                                         │
│  Full Name: [____________]              │
│  Email:     [____________]              │
│                                         │
│  Terms acceptance note                  │
│                                         │
│     [Create Account]                    │
└─────────────────────────────────────────┘
                ↓
STEP 3: ROLE
┌─────────────────────────────────────────┐
│  Who are you?                           │
│  Help us personalize your experience   │
│                                         │
│  ┌─────────────────────────┐           │
│  │ 🎓 Teacher              │           │
│  │ I am an educator...     │           │
│  └─────────────────────────┘           │
│                                         │
│  ┌─────────────────────────┐           │
│  │ 👥 Student/Parent/Other │           │
│  │ I am looking for...     │           │
│  └─────────────────────────┘           │
│                                         │
│     [Continue]                          │
└─────────────────────────────────────────┘
        ↓ (if Teacher)
STEP 4: SUBJECT
┌─────────────────────────────────────────┐
│  What subject do you teach?             │
│  Select the subject you have the most   │
│  experience                             │
│                                         │
│  ┌──────────────────────────┐          │
│  │ Select a subject...    ▼ │          │
│  ├──────────────────────────┤          │
│  │ 🔢 Mathematics           │          │
│  │ ⚛️ Physics               │          │
│  │ 🧪 Chemistry             │          │
│  │ ... (12 subjects)        │          │
│  └──────────────────────────┘          │
│                                         │
│  Don't worry, you can create tasks      │
│  for any subject later                  │
│                                         │
│     [Continue]                          │
└─────────────────────────────────────────┘
        ↓
STEP 5: ACTION
┌─────────────────────────────────────────┐
│  What would you like to do?             │
│  Choose your next step for Mathematics  │
│                                         │
│  ┌─────────────────────────┐           │
│  │ ➕ Create a new          │           │
│  │   Mathematics task      │           │
│  │ Design a custom...      │           │
│  └─────────────────────────┘           │
│                                         │
│  ┌─────────────────────────┐           │
│  │ 🔍 Search for existing  │           │
│  │   Mathematics tasks     │           │
│  │ Browse and use...       │           │
│  └─────────────────────────┘           │
│                                         │
│     [Continue]                          │
└─────────────────────────────────────────┘
```

## User State Evolution

### Step-by-Step State Changes

```
INITIAL STATE (First Visit)
{
  country: 'HU' (detected),
  isFirstVisit: true,
  hasCompletedOnboarding: false,
  isRegistered: false,
  profile: null,
  identity: null,
  role: 'guest',
  subject: null
}

↓ After Country Selection (US)

{
  country: 'US',  ← Changed
  isFirstVisit: true,
  hasCompletedOnboarding: false,
  isRegistered: false,
  profile: null,
  identity: null,
  role: 'guest',
  subject: null
}

↓ After Registration (John Doe, john@example.com)

{
  country: 'US',
  isFirstVisit: true,
  hasCompletedOnboarding: false,
  isRegistered: true,  ← Changed
  profile: {  ← Changed
    name: 'John Doe',
    email: 'john@example.com',
    registeredAt: '2025-11-25T10:30:00.000Z'
  },
  identity: null,
  role: 'registered',  ← Changed from 'guest'
  subject: null
}

↓ After Role Selection (Teacher)

{
  country: 'US',
  isFirstVisit: true,
  hasCompletedOnboarding: false,
  isRegistered: true,
  profile: { ... },
  identity: 'teacher',  ← Changed
  role: 'registered',
  subject: null
}

↓ After Subject Selection (Mathematics)

{
  country: 'US',
  isFirstVisit: true,
  hasCompletedOnboarding: false,
  isRegistered: true,
  profile: { ... },
  identity: 'teacher',
  role: 'registered',
  subject: 'mathematics'  ← Changed
}

↓ After Action Selection (Create) & Navigation

{
  country: 'US',
  isFirstVisit: false,  ← Changed
  hasCompletedOnboarding: true,  ← Changed
  isRegistered: true,
  profile: { ... },
  identity: 'teacher',
  role: 'registered',
  subject: 'mathematics'
}
```

## Cookie Timeline

### When Each Cookie Is Set

```
STEP 1: Country Selection
✓ eduforge_country = 'US'

STEP 2: Registration
✓ eduforge_is_registered = 'true'
✓ eduforge_user_profile = '{"name":"John Doe",...}'
✓ eduforge_role = 'registered'

STEP 3: Role Selection
✓ eduforge_identity = 'teacher'

STEP 4: Subject Selection (if teacher)
✓ eduforge_subject = 'mathematics'

STEP 5: Onboarding Complete
(All cookies already set, just update state)
```

## Validation Flow

### Registration Field Validation

```
User Types in Name Field
        ↓
    Is empty?
    ↙     ↘
  YES      NO
   ↓        ↓
Show:    Length >= 2?
"Name     ↙     ↘
required" YES    NO
           ↓     ↓
         Valid  Show:
                "Name must be
                 at least 2
                 characters"

User Types in Email Field
        ↓
    Is empty?
    ↙     ↘
  YES      NO
   ↓        ↓
Show:    Valid format?
"Email    (regex check)
required" ↙     ↘
        YES      NO
         ↓       ↓
       Valid   Show:
               "Please enter
                a valid email"

Both Fields Valid?
    ↙     ↘
  YES      NO
   ↓       ↓
Enable   Disable
"Create  "Create
Account" Account"
button   button
```

## Comparison: Before vs After

### Previous Flow (No Registration)

```
Country → Role → [Teacher: Subject → Action] → Complete
   ↓       ↓                ↓
  Save   Save            Save
  role=  identity=      subject=
  'guest''teacher'      'math'
```

### Current Flow (With Registration)

```
Country → Registration → Role → [Teacher: Subject → Action] → Complete
   ↓           ↓          ↓                ↓
  Save       Save      Save            Save
  country    profile   identity=      subject=
            +register  'teacher'      'math'
            role=
            'registered'
```

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **Steps** | 4-5 steps | 5-6 steps |
| **Registration** | ❌ Not required | ✅ Required |
| **User Role** | Always 'guest' | 'registered' after signup |
| **User Info** | Not collected | Name + Email collected |
| **Cookies** | 4-5 cookies | 6-7 cookies |
| **Identity** | Set immediately | Set after registration |
| **Production Ready** | Limited | Foundation for auth |

## Error States

### Registration Modal Error Scenarios

```
SCENARIO 1: Empty Fields
┌─────────────────────────────────┐
│ Full Name                       │
│ [                            ]  │
│ ⚠️ Name is required             │
├─────────────────────────────────┤
│ Email Address                   │
│ [                            ]  │
│ ⚠️ Email is required            │
└─────────────────────────────────┘

SCENARIO 2: Invalid Name
┌─────────────────────────────────┐
│ Full Name                       │
│ [J                           ]  │
│ ⚠️ Name must be at least 2      │
│    characters                   │
└─────────────────────────────────┘

SCENARIO 3: Invalid Email
┌─────────────────────────────────┐
│ Email Address                   │
│ [notanemail                  ]  │
│ ⚠️ Please enter a valid email   │
│    address                      │
└─────────────────────────────────┘

SCENARIO 4: All Valid ✓
┌─────────────────────────────────┐
│ Full Name                       │
│ [John Doe                    ]  │
├─────────────────────────────────┤
│ Email Address                   │
│ [john@example.com            ]  │
└─────────────────────────────────┘
[Create Account] ← Enabled
```

## Accessibility Flow

### Keyboard Navigation

```
Registration Modal Opens
        ↓
Focus on Name Input
        ↓
User Types Name
        ↓
Press Tab
        ↓
Focus on Email Input
        ↓
User Types Email
        ↓
Press Enter OR Tab to Button
        ↓
Submit Form
```

### Screen Reader Announcements

```
Modal Opens
→ "Dialog: Create Your Account"
→ "Join EduForger to create and manage educational tasks"

Name Field Focus
→ "Full Name, text input, required"

Name Error
→ "Error: Name is required"

Email Field Focus
→ "Email Address, email input, required"

Email Error
→ "Error: Please enter a valid email address"

Button Enabled
→ "Create Account button, enabled"
```

## Summary

### What Changed

**Added:**
1. Registration step after country selection
2. RegistrationModal component
3. UserProfile type
4. isRegistered flag
5. registerUser() method
6. Two new cookies

**Flow Changes:**
- Country → **Registration** → Role → ...
- All users must register before role selection
- Role changes from 'guest' to 'registered' after registration

**Benefits:**
- ✅ User accountability
- ✅ Contact collection
- ✅ Auth foundation
- ✅ Better UX for returning users
- ✅ Analytics enabled

---

**Implementation Status:** ✅ Complete
**Build Status:** ✅ Passing
**Production Ready:** ⚠️ With backend integration
