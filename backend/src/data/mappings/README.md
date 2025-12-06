# Subject Mappings Data Directory

This directory contains curriculum data files organized by country.

## Directory Structure

```
mappings/
  hu/                           # Hungary
    hu_mathematics_grade_9_12.json
    hu_physics_grade_9_12.json (future)
  us/                           # United States
    us_mathematics_grade_9_12.json (future)
  mx/                           # Mexico
    mx_mathematics_grade_9_12.json (future)
  ...
```

## File Naming Convention

Files should follow this pattern:
```
{country_code}_{subject}_grade_9_12.json
```

Examples:
- `hu_mathematics_grade_9_12.json`
- `hu_physics_grade_9_12.json`
- `us_mathematics_grade_9_12.json`
- `mx_mathematics_grade_9_12.json`

## JSON File Format

Each file should contain grade-separated curriculum data:

```json
{
  "grade_9_10": [
    {
      "key": "algebra",
      "name": "Algebra",
      "short_description": "Basic algebraic concepts",
      "sub_topics": [
        {
          "key": "linear_equations",
          "name": "Linear Equations",
          "short_description": "Solving linear equations",
          "sub_topics": []
        }
      ]
    }
  ],
  "grade_11_12": [
    {
      "key": "calculus",
      "name": "Calculus",
      "short_description": "Introduction to calculus",
      "sub_topics": []
    }
  ]
}
```

## Configuration

Subject mappings are configured in:
```
/src/config/subject-mappings.config.json
```

To add a new country or subject, edit that file:

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

## Migration

To import data into Firestore, use the migration script:

```bash
# Migrate mathematics for Hungary
npm run migrate:subjects -- --country HU --subject mathematics

# Migrate all subjects for a country
npm run migrate:subjects -- --country HU

# Migrate all countries and subjects
npm run migrate:subjects -- --all

# Clear existing data before import
npm run migrate:subjects -- --country HU --clear
```

## Firestore Structure

Data is stored in Firestore as:
```
countries/
  {countryCode}/
    subjectMappings/
      {docId}/
        - key
        - name
        - shortDescription
        - level
        - parentId
        - path
        - subject
        - gradeLevel
        - orderIndex
        - isLeaf
        - taskCount
        - createdAt
        - updatedAt
```

## Adding New Data

1. **Create JSON file** in appropriate country folder:
   ```bash
   touch src/data/mappings/us/us_mathematics_grade_9_12.json
   ```

2. **Add configuration** in `subject-mappings.config.json`:
   ```json
   "US": {
     "name": "United States",
     "subjects": {
       "mathematics": {
         "name": "Mathematics",
         "file": "us_mathematics_grade_9_12.json"
       }
     }
   }
   ```

3. **Run migration**:
   ```bash
   npm run migrate:subjects -- --country US --subject mathematics
   ```

4. **Verify** in Firebase Console:
   ```
   countries/US/subjectMappings/{docId}
   ```

## Notes

- All JSON files should be UTF-8 encoded
- Use consistent key naming (lowercase, underscores)
- Include meaningful short descriptions
- Keep hierarchy depth reasonable (max 5-6 levels)
- Test with small datasets first
