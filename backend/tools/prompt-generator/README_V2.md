# Subject Mapping Prompt Generator V2

**Country-Aware Curriculum Mapping System** 🌍

This tool generates prompts for ChatGPT to create comprehensive curriculum mapping data for different countries, grade levels, and subjects. It uses the **shared grades configuration** to automatically adapt to each country's educational structure.

> **New in V2**: Dynamic grade systems based on `@eduforger/shared`, organized output structure `[country]/[grade]/[subject]`, and comprehensive coverage of all grade levels.

---

## 🎯 Key Features

- ✅ **Country-Aware**: Uses shared grades configuration from `grades-config.js`
- ✅ **Dynamic Grade Systems**: Automatically adapts to each country's grade structure
- ✅ **Organized Output**: Generates prompts in `[country]/[grade]/[subject]` directory structure
- ✅ **Comprehensive Coverage**: All subjects across all grades for each country
- ✅ **Single Source of Truth**: Grade systems synced with frontend TypeScript types

---

## 📁 Directory Structure

```
prompts/
├── hu/                    # Hungary
│   ├── grade_1_4/        # Elementary (ages 6-10)
│   │   ├── mathematics.txt
│   │   ├── physics.txt
│   │   ├── chemistry.txt
│   │   ├── biology.txt
│   │   ├── history.txt
│   │   ├── geography.txt
│   │   ├── literature.txt
│   │   └── information_technology.txt
│   ├── grade_5_8/        # Middle school (ages 10-14)
│   │   └── ... (8 subjects)
│   └── grade_9_12/       # High school (ages 14-18)
│       └── ... (8 subjects)
├── mx/                    # Mexico
│   ├── grade_1_6/        # Primaria (ages 6-12)
│   │   └── ... (8 subjects)
│   ├── grade_7_9/        # Secundaria (ages 12-15)
│   │   └── ... (8 subjects)
│   └── grade_10_12/      # Preparatoria (ages 15-18)
│       └── ... (8 subjects)
└── us/                    # United States
    ├── grade_k_5/        # Elementary (ages 5-11)
    │   └── ... (8 subjects)
    ├── grade_6_8/        # Middle school (ages 11-14)
    │   └── ... (8 subjects)
    └── grade_9_12/       # High School (ages 14-18)
        └── ... (8 subjects)
```

---

## 🚀 Usage

### Generate Prompts for Specific Combination

```bash
# Single country/grade/subject
node subject_mapping_prompt_generator_v2.js --country-code=HU --grade=grade_9_12 --subject=mathematics

# All subjects for a specific grade
node subject_mapping_prompt_generator_v2.js --country-code=MX --grade=grade_7_9

# All grades and subjects for a country
node subject_mapping_prompt_generator_v2.js --country-code=US

# All countries, all grades, all subjects (72 prompts!)
node subject_mapping_prompt_generator_v2.js
```

### Command-Line Options

| Option | Alias | Description | Example |
|--------|-------|-------------|---------|
| `--country-code` | `--country` | Country code (HU, MX, US) | `--country-code=HU` |
| `--grade` | - | Grade level value | `--grade=grade_9_12` |
| `--subject` | - | Subject key | `--subject=mathematics` |

---

## 📚 Supported Countries & Grades

| Code | Country | Grades | Grade Values |
|------|---------|--------|--------------|
| **HU** | Hungary | 3 levels | `grade_1_4`, `grade_5_8`, `grade_9_12` |
| **MX** | Mexico | 3 levels | `grade_1_6`, `grade_7_9`, `grade_10_12` |
| **US** | United States | 3 levels | `grade_k_5`, `grade_6_8`, `grade_9_12` |

### Hungary (HU)

| Grade Value | Label EN | Label Local | Grade Range | Age Range | Teacher Role |
|-------------|----------|-------------|-------------|-----------|--------------|
| `grade_1_4` | Grade 1-4 | 1-4. osztály | 1-4 | 6-10 | Pedagógus |
| `grade_5_8` | Grade 5-8 | 5-8. osztály | 5-8 | 10-14 | Általános iskolai tanár |
| `grade_9_12` | Grade 9-12 | 9-12. osztály | 9-12 | 14-18 | Középiskolai tanár |

### Mexico (MX)

| Grade Value | Label EN | Label Local | Grade Range | Age Range | Teacher Role |
|-------------|----------|-------------|-------------|-----------|--------------|
| `grade_1_6` | Grade 1-6 (Primaria) | Primaria (1-6) | 1-6 | 6-12 | Maestro de Primaria |
| `grade_7_9` | Grade 7-9 (Secundaria) | Secundaria (7-9) | 7-9 | 12-15 | Maestro de Secundaria |
| `grade_10_12` | Grade 10-12 (Preparatoria) | Preparatoria (10-12) | 10-12 | 15-18 | Maestro de Preparatoria |

### United States (US)

| Grade Value | Label EN | Label Local | Grade Range | Age Range | Teacher Role |
|-------------|----------|-------------|-------------|-----------|--------------|
| `grade_k_5` | Elementary (K-5) | Elementary School (K-5) | K-5 | 5-11 | Elementary Teacher |
| `grade_6_8` | Middle School (6-8) | Middle School (6-8) | 6-8 | 11-14 | Middle School Teacher |
| `grade_9_12` | High School (9-12) | High School (9-12) | 9-12 | 14-18 | High School Teacher |

---

## 📖 Supported Subjects

| Subject Key | Name | Labels (HU / MX / US) | Emoji | Category |
|-------------|------|----------------------|-------|----------|
| `mathematics` | Mathematics | Matematika / Matemáticas / Mathematics | 🔢 | STEM |
| `physics` | Physics | Fizika / Física / Physics | ⚛️ | STEM |
| `chemistry` | Chemistry | Kémia / Química / Chemistry | 🧪 | STEM |
| `biology` | Biology | Biológia / Biología / Biology | 🧬 | STEM |
| `history` | History | Történelem / Historia / History | 📜 | Humanities |
| `geography` | Geography | Földrajz / Geografía / Geography | 🌍 | Humanities |
| `literature` | Literature | Irodalom / Literatura / Literature | 📚 | Humanities |
| `information_technology` | IT/CS | Informatika / Informática / Computer Science | 💻 | STEM |

---

## 🔄 Workflow

### Step 1: Generate Prompts

```bash
# Example: Generate all prompts for Hungary
node subject_mapping_prompt_generator_v2.js --country-code=HU
```

**Output**:
```
📝 Generating: HU/grade_1_4/mathematics
📝 Generating: HU/grade_1_4/physics
...
📝 Generating: HU/grade_9_12/literature

✅ All prompts generated successfully!

📊 Summary:
   Total prompts: 24
   Total size: 156,789 characters

📄 Generated files by country:
   Hungary (HU):
      Grade 1-4 - Mathematics → hu/grade_1_4/mathematics.txt
      Grade 1-4 - Physics → hu/grade_1_4/physics.txt
      ...
```

### Step 2: Use Prompts with ChatGPT

1. **Navigate to generated prompt**:
   ```bash
   cat prompts/hu/grade_9_12/mathematics.txt
   ```

2. **Copy entire prompt content**

3. **Paste into ChatGPT** (GPT-4 or Claude recommended)

4. **ChatGPT/Claude will**:
   - First provide a detailed plan dividing the curriculum into 5 chunks
   - Then generate each chunk sequentially as a JSON array
   - Each chunk covers approximately 20% of the curriculum

5. **Combine all 5 chunks** into a single JSON array

### Step 3: Save Generated Data

Save the ChatGPT output as:
```
backend/src/data/subject_mapping/[country]/[grade]/[subject].json
```

**Examples**:
- `backend/src/data/subject_mapping/hu/grade_9_12/mathematics.json`
- `backend/src/data/subject_mapping/mx/grade_7_9/physics.json`
- `backend/src/data/subject_mapping/us/grade_k_5/mathematics.json`

---

## 📋 Prompt Structure

Each generated prompt includes:

1. **Context**
   - Country name, grade level, age range
   - Education authority and official curriculum
   - Teacher role for the grade level

2. **JSON Structure**
   - Exact hierarchical format with examples
   - Uses grade-specific key (e.g., `grade_9_12`, `grade_k_5`)

3. **Depth Requirements**
   - 10-14 main topics
   - 3-6 subtopics per main topic
   - 3-5 example tasks per detailed concept
   - Target: 800-1200 lines, 50-80k characters

4. **Quality Standards**
   - Language: All content in country's primary language
   - Terminology: Official education system terms
   - Age-appropriate: Suitable for the grade's age range

5. **Subject-Specific Guidance**
   - Core topics to include
   - Pedagogical considerations
   - Example task types

6. **Curriculum Alignment**
   - Checklist for validation
   - Links to official standards

---

## 🎯 Grade System Integration

The generator uses `grades-config.js` which is synced from:
```
shared/types/grades.ts
```

This ensures:
- ✅ **Single Source of Truth**: Grade systems defined once
- ✅ **Automatic Updates**: Changes propagate to all tools
- ✅ **Type Safety**: Consistent with frontend TypeScript types
- ✅ **Country-Specific**: Each country has its own grade structure

---

## 📊 Statistics

### Per Country
- **3 grade levels** × **8 subjects** = **24 prompts**
- Average prompt size: ~6,500 characters
- Total size per country: ~156 KB

### All Countries
- **3 countries** × **24 prompts** = **72 prompts**
- Total size: ~468 KB of prompt content

---

## 🆚 Differences from V1

| Feature | V1 (Old) | V2 (New) |
|---------|----------|----------|
| **Grade System** | Hardcoded `grade_9_12` | Dynamic from shared config |
| **Directory** | `[country]/[subject]_grade_9_12.txt` | `[country]/[grade]/[subject].txt` |
| **Grade Levels** | Only high school (9-12) | All grades (elementary → high school) |
| **Country Coverage** | Partial | Complete per country |
| **Output Files** | 8 per country | 24 per country |
| **Maintainability** | Manual updates | Single source of truth |
| **JSON Key** | Always `grade_9_10` / `grade_11_12` | Dynamic per grade (`grade_k_5`, etc.) |

---

## 🔧 Adding a New Country

### 1. Update Shared Grades Config

Edit `shared/types/grades.ts`:
```typescript
export const FRANCE_GRADES: GradeConfig[] = [
  {
    value: 'grade_6_9',
    labelEN: 'Collège (6-9)',
    labelLocal: 'Collège (6ème-3ème)',
    gradeRange: '6-9',
    ageRange: '11-15',
    teacherRole: 'professeur_college',
    teacherRoleLabel: 'Professeur de Collège',
    order: 1,
  },
  // ... more grades
];

export const GRADE_SYSTEMS: Record<CountryCode, CountryGradeSystem> = {
  // ... existing countries
  FR: {
    country: 'FR',
    gradeLevels: FRANCE_GRADES,
  },
};
```

### 2. Sync to JavaScript

Update `grades-config.js`:
```javascript
const FRANCE_GRADES = [ /* copy from TypeScript */ ];

const GRADE_SYSTEMS = {
  HU: { /* ... */ },
  MX: { /* ... */ },
  US: { /* ... */ },
  FR: {
    country: 'FR',
    gradeLevels: FRANCE_GRADES,
  },
};
```

### 3. Add Country to Generator

Edit `subject_mapping_prompt_generator_v2.js`:
```javascript
const COUNTRIES = {
  // ... existing
  FR: {
    name: "France",
    officialCurriculum: "Bulletin Officiel de l'Éducation Nationale",
    primaryLanguage: "French",
    educationAuthority: "Ministère de l'Éducation Nationale",
  },
};
```

### 4. Add Subject Labels

```javascript
const SUBJECTS = {
  mathematics: {
    name: "Mathematics",
    labels: {
      HU: "Matematika",
      MX: "Matemáticas",
      US: "Mathematics",
      FR: "Mathématiques",  // Add French
    },
    // ...
  },
  // ... repeat for all subjects
};
```

### 5. Generate Prompts

```bash
node subject_mapping_prompt_generator_v2.js --country-code=FR
```

---

## 💡 Tips for Best Results

1. **Use GPT-4 or Claude**: Better quality curriculum mappings with comprehensive coverage
2. **Follow the chunked approach**: The prompt now requests 5 chunks with a plan upfront
3. **Review the plan first**: Ensure the AI's chunk plan covers all necessary topics before generation
4. **Process in batches**: Generate prompts for one country at a time
5. **Validate output**: Ensure JSON structure matches expected format
6. **Combine chunks carefully**: Make sure to properly merge all 5 JSON arrays
7. **Review content**: Check accuracy for your target country
8. **Update regularly**: Curricula change - regenerate as needed
9. **Save incrementally**: Don't lose work - save each grade/subject as you complete it

---

## 🔗 Related Files

- `grades-config.js` - Grade system configuration (synced from shared)
- `../../shared/types/grades.ts` - TypeScript source of truth
- `../../backend/src/data/subject_mapping/` - Generated JSON data location
- `../../backend/src/services/subject-mapping.service.ts` - Backend service

---

## 📝 Example Output

### Sample Prompt Structure

```markdown
# Curriculum Mapping Prompt: Mathematics for Hungary (Grade 9-12)

You are an expert curriculum analyst specializing in Hungary's official
national education standards for Mathematics.

Your task is to create a comprehensive, hierarchical JSON structure that
maps the complete Mathematics curriculum for Grade 9-12 (9-12, ages 14-18)
according to Hungary's official government education standards:
Nemzeti Alaptanterv (NAT).

Grade Level Context:
- Grade Range: 9-12
- Local Label: 9-12. osztály
- Age Range: 14-18
- Teacher Role: Középiskolai tanár

[... full prompt continues ...]
```

---

## 🐛 Troubleshooting

### Problem: "Unknown country code"
**Solution**: Make sure the country is added to both `COUNTRIES` and `grades-config.js`

### Problem: "Grade not found for country"
**Solution**: Check that the grade value matches those in `grades-config.js` for that country

### Problem: Prompts not generating
**Solution**: Ensure you're in the correct directory and `grades-config.js` exists

### Problem: Wrong language in generated content
**Solution**: Check the `primaryLanguage` in COUNTRIES object matches the desired language

---

## 📄 License

MIT License - Part of the EduForger project

---

**Version**: 2.0
**Last Updated**: 2026-01-05
**Compatible with**: @eduforger/shared grades system
