# Quick Start Guide - Subject Mapping Prompt Generator

## Installation

No installation required! Just Node.js is needed (already part of your project).

## Generate a Prompt (3 Easy Steps)

### Step 1: Run the Generator

```bash
cd /Users/martonhorvath/Documents/EduForge/app/backend/tools/prompt-generator

# Example: Hungarian Mathematics
node subject_mapping_prompt_generator.js --country-code=HU --subject=mathematics
```

### Step 2: Copy the Generated Prompt

The script creates a `.txt` file in the `prompts/` folder:

```bash
# Open the file
open prompts/hu_mathematics_grade_9_12.txt

# Or view in terminal
cat prompts/hu_mathematics_grade_9_12.txt
```

### Step 3: Use with ChatGPT

1. Copy the entire prompt from the `.txt` file
2. Paste it into ChatGPT (GPT-4 or GPT-4 Turbo)
3. ChatGPT will provide an overview first
4. Review and type "continue" to get each chunk
5. Save each chunk as it arrives

---

## Quick Examples

```bash
# Hungarian subjects
node subject_mapping_prompt_generator.js --country-code=HU --subject=mathematics
node subject_mapping_prompt_generator.js --country-code=HU --subject=physics
node subject_mapping_prompt_generator.js --country-code=HU --subject=chemistry
node subject_mapping_prompt_generator.js --country-code=HU --subject=biology
node subject_mapping_prompt_generator.js --country-code=HU --subject=history
node subject_mapping_prompt_generator.js --country-code=HU --subject=geography
node subject_mapping_prompt_generator.js --country-code=HU --subject=literature

# Mexican subjects
node subject_mapping_prompt_generator.js --country-code=MX --subject=mathematics
node subject_mapping_prompt_generator.js --country-code=MX --subject=biology
node subject_mapping_prompt_generator.js --country-code=MX --subject=history

# US subjects
node subject_mapping_prompt_generator.js --country-code=US --subject=mathematics
node subject_mapping_prompt_generator.js --country-code=US --subject=chemistry
node subject_mapping_prompt_generator.js --country-code=US --subject=literature
```

---

## Available Options

### Countries
- `HU` - Hungary (Hungarian)
- `MX` - Mexico (Spanish)
- `US` - United States (English)
- `UK` - United Kingdom (English)
- `DE` - Germany (German)

### Subjects
- `mathematics` 🔢
- `physics` ⚛️
- `chemistry` 🧪
- `biology` 🧬
- `history` 📜
- `geography` 🌍
- `literature` 📚

---

## Workflow After Getting Data from ChatGPT

### 1. Save All Chunks

As ChatGPT delivers each chunk:
- Copy the JSON chunk
- Paste into a text editor
- Type "continue" to get the next chunk

### 2. Combine Chunks into Single JSON File

After all 8 chunks, combine them into a single file following this structure:

```json
{
  "grade_9_10": [
      // ... all grade 9-10 topics from chunks 1-4
  ],
  "grade_11_12": [
      // ... all grade 11-12 topics from chunks 5-8
  ]
}
```

Save as: `hu_mathematics_curriculum.json` (or appropriate name)

### 3. Validate JSON

```bash
# Check if JSON is valid
node -e "console.log(JSON.parse(require('fs').readFileSync('hu_mathematics_curriculum.json', 'utf8')))"
```

### 4. Upload to Firestore (using your existing migration script)

```bash
cd /Users/martonhorvath/Documents/EduForge/app/backend

# Upload to Firestore
npx ts-node src/scripts/migrate-subject-mappings.ts \
  --country=HU \
  --subject=mathematics \
  --file=tools/prompt-generator/data/hu_mathematics_curriculum.json \
  --clear
```

---

## Tips

✅ **Use GPT-4** - GPT-3.5 doesn't have enough context for this task

✅ **Save as you go** - Don't lose chunks! Copy each one immediately

✅ **Review the overview** - Make sure topics look correct before getting full chunks

✅ **Validate JSON** - Check for syntax errors after combining chunks

✅ **Spot-check content** - Review a few example tasks for quality

---

## Troubleshooting

**Problem**: "Unknown country code" error

**Solution**: Check spelling. Use uppercase: `HU`, `MX`, `US`, `UK`, `DE`

---

**Problem**: "Unknown subject" error

**Solution**: Check spelling. Use lowercase: `mathematics`, `physics`, etc.

---

**Problem**: ChatGPT output is in English instead of local language

**Solution**: In ChatGPT, emphasize: "All names and descriptions MUST be in [language]"

---

**Problem**: JSON is invalid after combining chunks

**Solution**:
- Make sure you copied complete chunks (with proper opening/closing braces)
- Check for missing commas between topics
- Validate with: `node -e "JSON.parse(require('fs').readFileSync('file.json'))"`

---

## Output Structure

Each prompt generates comprehensive curriculum data:

- **Lines**: 3,000-3,500
- **Characters**: 150,000-160,000
- **Main Topics**: 8-12 per grade level (16-24 total)
- **Hierarchy**: 4 levels deep
- **Example Tasks**: 3-5 per leaf topic
- **Language**: Localized to country's education language

---

For detailed documentation, see: `README.md`
