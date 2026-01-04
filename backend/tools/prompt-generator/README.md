# Subject Mapping Prompt Generator

This tool generates comprehensive prompts for ChatGPT to create structured curriculum mapping data for various subjects and countries.

## Features

- ✅ Supports 7 subjects (Mathematics, Physics, Chemistry, Biology, History, Geography, Literature)
- ✅ Supports 5 countries (Hungary, Mexico, United States, United Kingdom, Germany)
- ✅ Generates prompts in appropriate language for each country
- ✅ Includes subject-specific pedagogical guidance
- ✅ Structured for 3000-3500 line JSON output (~150,000-160,000 characters)
- ✅ Delivers data in manageable chunks

## Usage

### Basic Command

```bash
node subject_mapping_prompt_generator.js --country-code=COUNTRY --subject=SUBJECT
```

### Examples

```bash
# Hungarian Mathematics
node subject_mapping_prompt_generator.js --country-code=HU --subject=mathematics

# Mexican Biology
node subject_mapping_prompt_generator.js --country-code=MX --subject=biology

# US History
node subject_mapping_prompt_generator.js --country-code=US --subject=history

# German Physics
node subject_mapping_prompt_generator.js --country-code=DE --subject=physics
```

## Available Options

### Countries (--country-code)

| Code | Country        | Curriculum                                    | Language   |
|------|----------------|-----------------------------------------------|------------|
| HU   | Hungary        | Nemzeti Alaptanterv (NAT)                    | Hungarian  |
| MX   | Mexico         | SEP Curriculum                                | Spanish    |
| US   | United States  | Common Core / NGSS                            | English    |
| UK   | United Kingdom | National Curriculum / GCSE & A-Level         | English    |
| DE   | Germany        | Bildungsstandards (KMK)                       | German     |

### Subjects (--subject)

| Subject      | Category   | Emoji |
|--------------|------------|-------|
| mathematics  | STEM       | 🔢    |
| physics      | STEM       | ⚛️    |
| chemistry    | STEM       | 🧪    |
| biology      | STEM       | 🧬    |
| history      | Humanities | 📜    |
| geography    | Humanities | 🌍    |
| literature   | Humanities | 📚    |

## Output

The script generates a `.txt` file in the `prompts/` directory with the naming format:

```
{country_code}_{subject}_grade_9_12.txt
```

**Examples:**
- `hu_mathematics_grade_9_12.txt`
- `mx_biology_grade_9_12.txt`
- `us_history_grade_9_12.txt`

## Workflow

### Step 1: Generate the Prompt

```bash
node subject_mapping_prompt_generator.js --country-code=HU --subject=mathematics
```

Output:
```
📝 Generating prompt for: Mathematics (Hungary)

✅ Prompt generated successfully!

📄 File: hu_mathematics_grade_9_12.txt
📁 Location: /path/to/prompts/hu_mathematics_grade_9_12.txt
📊 Size: 12,453 characters

💡 Next steps:
   1. Open the generated file
   2. Copy the entire prompt
   3. Paste it into ChatGPT (GPT-4 recommended)
   4. Follow the instructions to receive the curriculum data in chunks
```

### Step 2: Use with ChatGPT

1. Open the generated `.txt` file
2. Copy the entire prompt
3. Paste into ChatGPT (GPT-4 or GPT-4 Turbo recommended for best results)
4. ChatGPT will first provide an **overview** of all topics
5. Review and approve the overview
6. ChatGPT will then deliver the data in **8 chunks**
7. After each chunk, reply "continue" to get the next chunk
8. Save each chunk as you receive it

### Step 3: Process the JSON Data

Once you have all chunks:

1. Combine all chunks into a single JSON file
2. Validate the JSON structure
3. Use the migration script to upload to Firestore:

```bash
cd /Users/martonhorvath/Documents/EduForger/app/backend
npx ts-node src/scripts/migrate-subject-mappings.ts --country=HU --subject=mathematics --file=path/to/combined.json
```

## Prompt Structure

Each generated prompt includes:

1. **Research Requirements** - Official curriculum sources and standards
2. **JSON Structure** - Exact format with 4 levels of hierarchy
3. **Depth Requirements** - Specific counts for topics, sub-topics, and tasks
4. **Quality Standards** - Language, terminology, and content guidelines
5. **Subject-Specific Guidance** - Core topics and pedagogical considerations
6. **Curriculum Alignment** - Checklist for validation
7. **Delivery Format** - Instructions for chunked delivery
8. **Final Validation** - Quality checks

## Adding New Countries

To add a new country, edit `subject_mapping_prompt_generator.js` and add to the `COUNTRIES` object:

```javascript
COUNTRIES.FR = {
  name: 'France',
  officialCurriculum: 'Programmes officiels de l\'Éducation nationale',
  primaryLanguage: 'French',
  educationAuthority: 'Ministère de l\'Éducation nationale',
  gradeLevels: {
    '9-10': 'Lycée - Seconde et Première',
    '11-12': 'Lycée - Terminale'
  }
};
```

Then add French labels to each subject in the `SUBJECTS` object.

## Adding New Subjects

To add a new subject, edit `subject_mapping_prompt_generator.js` and add to the `SUBJECTS` object:

```javascript
SUBJECTS.economics = {
  name: 'Economics',
  labels: { HU: 'Közgazdaságtan', MX: 'Economía', US: 'Economics', ... },
  emoji: '💰',
  category: 'humanities',
  specificGuidance: `
    ### Subject-Specific Requirements for Economics:
    ... (add detailed guidance)
  `
};
```

## Tips for Best Results

1. **Use GPT-4** - GPT-3.5 may not have enough context window for this task
2. **Review the overview carefully** - Ensure topics align with the curriculum before proceeding
3. **Save as you go** - Copy each chunk immediately to avoid losing work
4. **Validate JSON** - Use a JSON validator after combining chunks
5. **Spot-check content** - Review a few example tasks for accuracy and appropriateness
6. **Iterate if needed** - If content is inaccurate, regenerate with more specific instructions

## Troubleshooting

**Problem**: ChatGPT doesn't know the country's curriculum

**Solution**: The prompt asks ChatGPT to research, but you can also provide reference materials or official curriculum documents as context.

---

**Problem**: JSON structure is inconsistent across chunks

**Solution**: After each chunk, remind ChatGPT to maintain the exact structure. You may need to correct and re-request a chunk.

---

**Problem**: Content is in English instead of the local language

**Solution**: Explicitly remind ChatGPT that all names and descriptions must be in [language]. Provide examples if needed.

---

**Problem**: Output is too short (not reaching 3000-3500 lines)

**Solution**: In your initial message, emphasize the size requirement and ask ChatGPT to expand with more sub-topics and example tasks.

## License

MIT License - Part of the EduForger project
