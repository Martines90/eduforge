# Subject Mappings - Quick Start Guide

## 🎯 What Was Updated

The subject mappings migration script now supports:
- ✅ **Multiple countries** (HU, US, MX, etc.)
- ✅ **Multiple subjects** (mathematics, physics, etc.)
- ✅ **Country-based Firestore structure** (`countries/{country}/subjectMappings/{docId}`)
- ✅ **Dynamic configuration** via JSON config file
- ✅ **Organized data files** in `/src/data/mappings/{country}/`

## 📁 File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── subject-mappings.config.json    # Configuration
│   ├── data/
│   │   └── mappings/
│   │       ├── hu/
│   │       │   └── hu_mathematics_grade_9_12.json
│   │       ├── us/
│   │       │   └── (future files)
│   │       └── mx/
│   │           └── (future files)
│   └── scripts/
│       └── migrate-subject-mappings.ts     # Migration script
```

## 🚀 Quick Start

### 1. Check Configuration

Edit `src/config/subject-mappings.config.json`:

```json
{
  "countries": {
    "HU": {
      "name": "Hungary",
      "subjects": {
        "mathematics": {
          "name": "Mathematics",
          "file": "hu_mathematics_grade_9_12.json"
        }
      }
    }
  }
}
```

### 2. Ensure Data File Exists

```bash
ls src/data/mappings/hu/hu_mathematics_grade_9_12.json
```

### 3. Run Migration

```bash
# Migrate mathematics for Hungary
npm run migrate:subjects -- --country HU --subject mathematics

# With output:
# 🚀 Starting Subject Mappings Migration (Country-Based)
# =====================================================
#
# Initializing Firebase...
#
# ████████████████████████████████████████████████████████████
# 🌍 Processing Hungary (HU)
# ████████████████████████████████████████████████████████████
#
# ============================================================
# Importing Mathematics (mathematics) for HU
# ============================================================
#
# 📚 Processing grade-9-10 (5 main topics)
#   [1] Grade 9-10
#     [2] Algebra (mathematics/grade_9_10/algebra)
#       [3] Linear Equations (mathematics/grade_9_10/algebra/linear_equations)
#   ...
#
# ✅ Mathematics import complete for HU!
#
# ============================================================
# 🎉 Migration Complete!
# ============================================================
```

## 📝 Common Commands

### Migrate Specific Country & Subject
```bash
npm run migrate:subjects -- --country HU --subject mathematics
```

### Migrate All Subjects for a Country
```bash
npm run migrate:subjects -- --country HU
```

### Migrate All Countries & Subjects
```bash
npm run migrate:subjects -- --all
```

### Clear Existing Data First
```bash
npm run migrate:subjects -- --country HU --clear
```

### Migrate Specific Subject for All Countries
```bash
npm run migrate:subjects -- --all --subject mathematics
```

### Show Help
```bash
npm run migrate:subjects -- --help
```

## 🗄️ Firestore Structure

After migration, data will be stored as:

```
countries/
  HU/
    subjectMappings/
      mathematics_grade_9_10_root/
        key: "grade_9_10"
        name: "Grade 9-10"
        subject: "mathematics"
        gradeLevel: "grade_9_10"
        level: 1
        parentId: null
        isLeaf: false
        ...

      mathematics_grade_9_10_algebra/
        key: "algebra"
        name: "Algebra"
        subject: "mathematics"
        gradeLevel: "grade_9_10"
        level: 2
        parentId: "mathematics_grade_9_10_root"
        path: "mathematics/grade_9_10/algebra"
        isLeaf: false
        ...

      mathematics_grade_9_10_algebra_linear_equations/
        key: "linear_equations"
        name: "Linear Equations"
        subject: "mathematics"
        gradeLevel: "grade_9_10"
        level: 3
        parentId: "mathematics_grade_9_10_algebra"
        path: "mathematics/grade_9_10/algebra/linear_equations"
        isLeaf: true
        ...
```

## ➕ Adding New Country/Subject

### Step 1: Add Data File

```bash
# Create country directory if needed
mkdir -p src/data/mappings/us

# Add JSON file
touch src/data/mappings/us/us_mathematics_grade_9_12.json
```

### Step 2: Update Configuration

Edit `src/config/subject-mappings.config.json`:

```json
{
  "countries": {
    "HU": { ... },
    "US": {
      "name": "United States",
      "subjects": {
        "mathematics": {
          "name": "Mathematics",
          "file": "us_mathematics_grade_9_12.json"
        },
        "physics": {
          "name": "Physics",
          "file": "us_physics_grade_9_12.json"
        }
      }
    }
  }
}
```

### Step 3: Run Migration

```bash
npm run migrate:subjects -- --country US --subject mathematics
```

## ✅ Verification

### Check Firestore Console
1. Open Firebase Console
2. Go to Firestore Database
3. Navigate to: `countries/{HU}/subjectMappings`
4. Verify documents exist with correct structure

### Check via API (if backend is running)
```bash
curl http://localhost:3000/api/subject-mappings?country=HU
```

## 🔧 Troubleshooting

### Error: "Configuration file not found"
- Make sure `src/config/subject-mappings.config.json` exists
- Check file path is correct

### Error: "Data file not found"
- Verify file exists at `src/data/mappings/{country}/{filename}`
- Check filename matches config

### Error: "Unknown country: XX"
- Add country to `subject-mappings.config.json`
- Use correct country code (uppercase)

### Error: "Please specify --country or --all"
- You must provide either `--country HU` or `--all`

## 📚 Related Files

- **Migration Script**: `/src/scripts/migrate-subject-mappings.ts`
- **Config File**: `/src/config/subject-mappings.config.json`
- **Data Files**: `/src/data/mappings/{country}/*.json`
- **Documentation**: `/src/data/mappings/README.md`

## 🎓 Examples

### Example 1: Fresh Migration for Hungary
```bash
cd /Users/martonhorvath/Documents/EduForger/app/backend
npm run migrate:subjects -- --country HU --subject mathematics --clear
```

### Example 2: Add US Mathematics
```bash
# 1. Create file
mkdir -p src/data/mappings/us
cp src/data/mappings/hu/hu_mathematics_grade_9_12.json \
   src/data/mappings/us/us_mathematics_grade_9_12.json

# 2. Edit config
# (add US entry to subject-mappings.config.json)

# 3. Migrate
npm run migrate:subjects -- --country US --subject mathematics
```

### Example 3: Migrate Everything
```bash
npm run migrate:subjects -- --all --clear
```

## 🚨 Important Notes

- ⚠️ Use `--clear` carefully - it deletes existing data!
- ✅ Always test with a single country/subject first
- ✅ Verify in Firestore Console after migration
- ✅ Keep JSON files in source control
- ✅ Back up Firestore data before large migrations
