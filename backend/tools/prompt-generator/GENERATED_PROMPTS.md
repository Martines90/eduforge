# Generated Prompts Inventory

This file tracks all generated prompts organized by country.

Last updated: 2025-12-15

---

## Directory Structure

```
prompts/
├── hu/                          # Hungary (Hungarian)
│   ├── mathematics_grade_9_12.txt
│   ├── physics_grade_9_12.txt
│   ├── chemistry_grade_9_12.txt
│   ├── biology_grade_9_12.txt
│   ├── history_grade_9_12.txt
│   ├── geography_grade_9_12.txt  (not yet generated)
│   └── literature_grade_9_12.txt (not yet generated)
│
├── mx/                          # Mexico (Spanish)
│   ├── biology_grade_9_12.txt
│   └── (6 more subjects available)
│
├── us/                          # United States (English)
│   └── (7 subjects available)
│
├── uk/                          # United Kingdom (English)
│   └── (7 subjects available)
│
└── de/                          # Germany (German)
    └── (7 subjects available)
```

---

## Generated Prompts Summary

### 🇭🇺 Hungary (HU) - 5 prompts

| Subject       | File                         | Status | Size   |
|---------------|------------------------------|--------|--------|
| Mathematics   | mathematics_grade_9_12.txt   | ✅     | 8.2 KB |
| Physics       | physics_grade_9_12.txt       | ✅     | 8.2 KB |
| Chemistry     | chemistry_grade_9_12.txt     | ✅     | 8.2 KB |
| Biology       | biology_grade_9_12.txt       | ✅     | 8.3 KB |
| History       | history_grade_9_12.txt       | ✅     | 8.3 KB |
| Geography     | geography_grade_9_12.txt     | ⏳     | -      |
| Literature    | literature_grade_9_12.txt    | ⏳     | -      |

### 🇲🇽 Mexico (MX) - 1 prompt

| Subject       | File                         | Status | Size   |
|---------------|------------------------------|--------|--------|
| Biology       | biology_grade_9_12.txt       | ✅     | 8.4 KB |
| Mathematics   | mathematics_grade_9_12.txt   | ⏳     | -      |
| Physics       | physics_grade_9_12.txt       | ⏳     | -      |
| Chemistry     | chemistry_grade_9_12.txt     | ⏳     | -      |
| History       | history_grade_9_12.txt       | ⏳     | -      |
| Geography     | geography_grade_9_12.txt     | ⏳     | -      |
| Literature    | literature_grade_9_12.txt    | ⏳     | -      |

---

## Quick Generation Commands

### Complete Hungarian (All Subjects)

```bash
cd /Users/martonhorvath/Documents/EduForge/app/backend/tools/prompt-generator

# Already generated:
# ✅ node subject_mapping_prompt_generator.js --country-code=HU --subject=mathematics
# ✅ node subject_mapping_prompt_generator.js --country-code=HU --subject=physics
# ✅ node subject_mapping_prompt_generator.js --country-code=HU --subject=chemistry
# ✅ node subject_mapping_prompt_generator.js --country-code=HU --subject=biology
# ✅ node subject_mapping_prompt_generator.js --country-code=HU --subject=history

# Still needed:
node subject_mapping_prompt_generator.js --country-code=HU --subject=geography
node subject_mapping_prompt_generator.js --country-code=HU --subject=literature
```

### Complete Mexican (All Subjects)

```bash
cd /Users/martonhorvath/Documents/EduForge/app/backend/tools/prompt-generator

# Already generated:
# ✅ node subject_mapping_prompt_generator.js --country-code=MX --subject=biology

# Still needed:
node subject_mapping_prompt_generator.js --country-code=MX --subject=mathematics
node subject_mapping_prompt_generator.js --country-code=MX --subject=physics
node subject_mapping_prompt_generator.js --country-code=MX --subject=chemistry
node subject_mapping_prompt_generator.js --country-code=MX --subject=history
node subject_mapping_prompt_generator.js --country-code=MX --subject=geography
node subject_mapping_prompt_generator.js --country-code=MX --subject=literature
```

---

## Next Steps After Generation

1. **Open the prompt file**:
   ```bash
   open prompts/hu/biology_grade_9_12.txt
   ```

2. **Copy entire prompt** and paste into ChatGPT (GPT-4 recommended)

3. **Follow ChatGPT workflow**:
   - Review overview (lists all topics)
   - Type "continue" after each chunk (8 chunks total)
   - Save all chunks

4. **Combine chunks** into single JSON file

5. **Validate JSON**:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('combined.json'))"
   ```

6. **Upload to Firestore**:
   ```bash
   cd /Users/martonhorvath/Documents/EduForge/app/backend
   npx ts-node src/scripts/migrate-subject-mappings.ts \
     --country=HU \
     --subject=biology \
     --file=tools/prompt-generator/data/hu_biology_complete.json \
     --clear
   ```

---

## Curriculum Data Stats (Per Prompt)

Each generated prompt will produce approximately:

- **Lines**: 3,000-3,500
- **Characters**: 150,000-160,000
- **Main Topics**: 8-12 per grade level (16-24 total)
- **Sub Topics**: ~100-150 total
- **Detailed Topics**: ~300-500 total
- **Example Tasks**: ~1,000-1,500 total

---

## Country-Specific Information

### 🇭🇺 Hungary
- **Curriculum**: Nemzeti Alaptanterv (NAT)
- **Language**: Hungarian
- **Authority**: Oktatási és Kulturális Minisztérium
- **Grade Levels**: Középiskola 9-10, 11-12. évfolyam

### 🇲🇽 Mexico
- **Curriculum**: SEP (Secretaría de Educación Pública)
- **Language**: Spanish
- **Authority**: Secretaría de Educación Pública
- **Grade Levels**: Educación Media Superior

### 🇺🇸 United States
- **Curriculum**: Common Core / NGSS
- **Language**: English
- **Authority**: State Boards of Education
- **Grade Levels**: High School Grades 9-12

### 🇬🇧 United Kingdom
- **Curriculum**: National Curriculum / GCSE & A-Level
- **Language**: English
- **Authority**: Department for Education
- **Grade Levels**: Key Stage 4-5 (Years 10-13)

### 🇩🇪 Germany
- **Curriculum**: Bildungsstandards (KMK)
- **Language**: German
- **Authority**: Kultusministerkonferenz
- **Grade Levels**: Sekundarstufe I-II (Klassen 9-12)

---

## Tips for Quality

✅ **Review ChatGPT's overview** before getting full chunks
✅ **Save chunks immediately** - don't lose work
✅ **Validate JSON** after combining
✅ **Spot-check** a few example tasks for accuracy
✅ **Use GPT-4** for best results (not GPT-3.5)

---

## Maintenance

To update this inventory:

```bash
cd /Users/martonhorvath/Documents/EduForge/app/backend/tools/prompt-generator
ls -lh prompts/*/*.txt
```
