# Example Prompts Generated

This file shows examples of what prompts look like for different subjects and countries.

## File Structure

```
tools/prompt-generator/
├── subject_mapping_prompt_generator.js  # Main generator script
├── README.md                            # Full documentation
├── QUICK_START.md                       # Quick reference
├── EXAMPLES.md                          # This file
└── prompts/                             # Generated prompts
    ├── hu_mathematics_grade_9_12.txt
    ├── hu_physics_grade_9_12.txt
    ├── mx_biology_grade_9_12.txt
    ├── us_history_grade_9_12.txt
    └── ... (more prompts)
```

## Generated Prompt Preview

Here's what a generated prompt includes:

### 1. Header & Introduction
- Subject and country identification
- Official curriculum framework reference
- Task description and goals

### 2. Research Requirements
- Authoritative curriculum sources
- Official education standards
- Grade level mappings

### 3. JSON Structure Template
```json
{
  "grade_9_10": [
      {
        "key": "topic_key",
        "name": "Topic Name (in local language)",
        "short_description": "...",
        "sub_topics": [ ... ]
      }
  ]
  ,
  "grade_11_12": [ ... ]
}
```

### 4. Coverage Requirements
- 8-12 main topics per grade level
- 3-6 sub-topics per main topic
- 2-5 detailed sub-topics per sub-topic
- 3-5 example tasks per leaf topic
- Total: 3,000-3,500 lines (~150K-160K characters)

### 5. Subject-Specific Guidance
**Example for Mathematics:**
- Core topics: Algebra, Geometry, Trigonometry, Calculus, Statistics, etc.
- Pedagogical approach: Concrete to abstract
- Task types: Computation, proof, word problems, modeling

**Example for Biology:**
- Core topics: Cell biology, Genetics, Evolution, Ecology, etc.
- Pedagogical approach: Molecular → Organism → Ecosystem
- Task types: Diagrams, experiments, classification, data analysis

**Example for History:**
- Core topics: National history, World history, Political/Social/Economic history
- Pedagogical approach: Source analysis, chronology, multiple perspectives
- Task types: Primary source analysis, timelines, cause-effect, essays

### 6. Quality Standards
- Language: All content in country's primary education language
- Keys: lowercase_with_underscores
- Descriptions: 1-2 sentences, pedagogically accurate
- Tasks: Authentic, age-appropriate, progressive, curriculum-aligned

### 7. Delivery Instructions
- Step 1: Overview (list all topics, wait for approval)
- Step 2: 8 chunks of JSON data
- After each chunk: Character count and "continue" prompt

### 8. Validation Checklist
- Curriculum alignment
- Topic sequencing
- Cultural appropriateness
- Language authenticity

## Sample Output from ChatGPT

When you use the prompt with ChatGPT, you'll receive:

**First Response (Overview):**
```
Hungarian Mathematics Curriculum Mapping - Overview

Grade 9-10 Main Topics:
1. Halmazok és matematikai logika - Set theory and mathematical logic
2. Számok és műveletek - Numbers and operations
3. Algebrai kifejezések - Algebraic expressions
... (8-12 topics total)

Grade 11-12 Main Topics:
1. Függvények és sorozatok - Functions and sequences
2. Kombinatorika és valószínűség - Combinatorics and probability
... (8-12 topics total)

Estimated output: 3,200 lines, ~155,000 characters
Alignment confirmed with NAT (Nemzeti Alaptanterv)

Proceed with Chunk 1?
```

**Second Response (Chunk 1):**
```json
{
  "grade_9_10": [
      {
        "key": "halmazok",
        "name": "Halmazok és matematikai logika",
        "short_description": "Halmazelméleti alapfogalmak, műveletek, logikai alapok",
        "sub_topics": [
          {
            "key": "halmaz_fogalma",
            "name": "A halmaz fogalma",
            "short_description": "...",
            "sub_topics": [ ... ]
          }
        ]
      }
    ]
}

✅ Chunk 1 of 8 complete.
📊 Character count: 18,500
📈 Cumulative: 18,500 / ~160,000
🔄 Reply 'continue' for Chunk 2
```

## Real Usage Example

```bash
# Step 1: Generate prompt
cd tools/prompt-generator
node subject_mapping_prompt_generator.js --country-code=HU --subject=biology

# Output:
# ✅ Prompt generated: hu_biology_grade_9_12.txt (8.5K characters)

# Step 2: Copy prompt to ChatGPT
open prompts/hu_biology_grade_9_12.txt
# Copy entire file contents
# Paste into ChatGPT

# Step 3: Follow ChatGPT's chunked delivery
# - Review overview
# - Type "continue" 8 times
# - Save each chunk

# Step 4: Combine and validate
# Merge all chunks into single JSON file

# Step 5: Upload to Firestore
cd ../..
npx ts-node src/scripts/migrate-subject-mappings.ts \
  --country=HU \
  --subject=biology \
  --file=tools/prompt-generator/data/hu_biology_complete.json \
  --clear
```

## Language Examples

### Hungarian (HU)
```json
{
  "key": "sejtbiologia",
  "name": "Sejtbiológia",
  "short_description": "A sejt felépítése, működése és osztódása",
  "example_tasks": [
    "Magyarázd el a mitózis fázisait!",
    "Hasonlítsd össze a prokarióta és eukarióta sejteket!"
  ]
}
```

### Spanish (MX)
```json
{
  "key": "biologia_celular",
  "name": "Biología Celular",
  "short_description": "Estructura, función y división celular",
  "example_tasks": [
    "Explica las fases de la mitosis",
    "Compara las células procariotas y eucariotas"
  ]
}
```

### English (US)
```json
{
  "key": "cell_biology",
  "name": "Cell Biology",
  "short_description": "Cell structure, function, and division",
  "example_tasks": [
    "Explain the phases of mitosis",
    "Compare prokaryotic and eukaryotic cells"
  ]
}
```

## Tips for Best Results

1. **Use specific prompts**: The generated prompts are highly detailed and specific to each country's curriculum

2. **Review the overview**: Don't skip this step! It ensures ChatGPT understands the curriculum structure

3. **Be patient**: Generating 3000+ lines takes time. ChatGPT may need 10-15 minutes total

4. **Validate as you go**: Check each chunk for JSON validity before requesting the next

5. **Customize if needed**: You can edit the generated prompt before using it to add more specific requirements

## Next Steps

Ready to generate curriculum data? See `QUICK_START.md` for the simplest workflow.

For full details on customization and advanced usage, see `README.md`.
