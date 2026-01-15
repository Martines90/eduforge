# 📋 OUTPUT FORMAT SPECIFICATIONS

## 🎯 JSON OUTPUT STRUCTURE

Return ONLY a JSON object (no markdown wrappers, no extra text):

```json
{
  "title": "Concise, powerful title (3-8 words)",
  "description": "<p>Opening paragraph establishing context.</p><p>Data/evidence paragraph.</p><p>Task framing if needed.</p>",
  "questions": [
    "Clear question 1 requiring specific skill",
    "Clear question 2 building on question 1"
  ],
  "expected_answer_formats": [
    "Format description for answer 1",
    "Format description for answer 2"
  ]
}
```

---

## 📝 DESCRIPTION REQUIREMENTS

### Length Constraints
- **Plain text content**: {{TASK_CHARACTER_MIN_LENGTH}}-{{TASK_CHARACTER_MAX_LENGTH}} characters
- **Excluding HTML tags** from count
- Use only `<p>` tags for paragraphs

### Language
- Write in **{{LANGUAGE}}**
- Use **{{METRIC_SYSTEM}}** system for measurements

### Structure

**Paragraph 1 - Context & Immersion (Second Person)**
- Establish WHO you are (profession/role)
- WHERE you are (specific location, time)
- WHAT situation you're in (the challenge/opportunity)
- WHY it matters (stakes preview)

Example:
```html
<p>You are a structural engineer at the San Francisco Bay Bridge Authority in 2002. The new eastern span is under construction - the largest self-anchored suspension bridge in the world. You must verify the load calculations before the first deck segments are installed. If the stress analysis is wrong, the entire $6.4 billion project could fail catastrophically once traffic begins crossing.</p>
```

**Paragraph 2 - Data/Evidence Provision**
- Provide ALL necessary information to solve the problem
- Use specific numbers, measurements, or evidence
- For literature/history: Include full text excerpts or document quotes
- For STEM: Include all numerical data, constants, conditions

Example (STEM):
```html
<p>The main cable has a diameter of 0.85 meters and will support a total distributed load of 240,000 kN across the 385-meter main span. The cable's tensile strength is 1,770 MPa. The maximum allowable stress is 40% of tensile strength for safety. The cable material is high-strength steel with density 7,850 kg/m³.</p>
```

Example (Humanities):
```html
<p>You have discovered three key excerpts from Act II: (1) DON JUAN: "¿Tan largo me lo fiáis? De aquí allá hay gran jornada." [Context: responding to warnings about divine punishment] (2) DON JUAN: "Sevilla a voces me llama el Burlador, y el mayor gusto que en mí puede haber es burlar una mujer y dejarla sin honor." [Context: boasting about his reputation] (3) CATALINÓN: "Tú presumes que has burlado la hija de un pescador... Advierte, mi parecer es que se han de avisar todos cuantos burles." DON JUAN: "¿Avisar? ¿Prevenir? ¡Qué necia locura!" [Context: servant's warning and Don Juan's defiant response]</p>
```

**Optional Paragraph 3 - Task Framing (if needed)**
- Clarify what action needs to be taken
- Frame the analytical or computational task
- Connect to professional decision-making

---

## 🎯 TITLE REQUIREMENTS

### Format
- **3-8 words maximum**
- Powerful, evocative language
- Captures the essence of the scenario
- NO generic titles

### Good Title Examples:
- "Bridge Cable Stress Verification - Bay Bridge"
- "Don Juan's Character - Theater Casting Analysis"
- "Mars Rover Heat Shield Calculations"
- "Forensic Ballistics - Murder Trial Testimony"
- "Pandemic Spread Modeling - R₀ Calculation"

### Bad Title Examples (DON'T DO THIS):
- ❌ "Quadratic Equation Problem"
- ❌ "Character Analysis Exercise"
- ❌ "Physics Calculation Task"
- ❌ "Math Problem Number 5"

**The title should excite students about the scenario, not label it as homework.**

---

## ❓ QUESTIONS REQUIREMENTS

### Number of Questions
- Typically **2-3 questions**
- Can be 1 question if complex enough
- Maximum 4 questions (only if necessary)

### Question Characteristics

**Each question must:**
- Require specific curriculum skill
- Build on previous questions (progression)
- Be answerable using provided data/text
- Have clear, unambiguous expectations

**Question Types by Subject:**

**STEM (Mathematics, Physics, Chemistry):**
- "Calculate [specific quantity]"
- "Solve for [variable] using [method]"
- "Verify if [condition] is met"
- "Determine [physical quantity] and explain [significance]"

**Humanities (Literature, History):**
- "Analyze how [author/figure] uses [technique] to [effect]"
- "Identify [pattern/theme] in these excerpts and explain [significance]"
- "Compare [element A] and [element B] in terms of [analytical lens]"
- "What does [evidence] reveal about [historical/literary question]?"

### Question Progression

**Good Progression:**
1. Calculate basic quantity (e.g., force)
2. Use that result to find secondary quantity (e.g., acceleration)
3. Interpret meaning in context (e.g., verify safety limit)

**Bad Progression:**
1. Calculate X
2. Calculate completely unrelated Y
3. Random third calculation

**Questions should BUILD on each other, not be disconnected tasks.**

---

## 📋 EXPECTED ANSWER FORMATS

### Purpose
Tell students WHAT to provide in their answer:
- Format (number, equation, paragraph, list, etc.)
- Units (if applicable)
- Precision (decimal places, significant figures)
- Reasoning required (show work, cite evidence, explain logic)

### Examples by Subject

**Mathematics:**
- "Numerical answer in meters, rounded to 2 decimal places, showing all calculation steps"
- "Solved equation with final answer as a simplified fraction or decimal to 3 decimal places"
- "Yes/No answer with calculation showing verification of the condition"

**Physics:**
- "Numerical answer in joules (J), showing formula used and substitution of values"
- "Force vector with magnitude in Newtons and direction in degrees, with free-body diagram"
- "Final velocity in m/s with full kinematic equation solution shown"

**Chemistry:**
- "Balanced chemical equation with correct stoichiometric coefficients"
- "Mass in grams, calculated using molar mass and stoichiometry, rounded to 2 decimal places"
- "Molecular formula and structural diagram showing bonding"

**Literature:**
- "2-3 sentence analysis citing specific textual evidence (quote and explain)"
- "Paragraph identifying character trait with 2-3 textual examples as support"
- "Comparative analysis (150-200 words) with quotes from both texts"

**History:**
- "Argument paragraph (100-150 words) citing at least 2 pieces of documentary evidence"
- "List of 3-4 causes with brief explanation of each, supported by source material"
- "Comparison identifying 2 similarities and 2 differences, with evidence"

---

## ✅ FORMATTING CHECKLIST

Before finalizing output, verify:

- [ ] **Valid JSON** - No syntax errors, proper escaping of quotes in strings
- [ ] **No markdown wrappers** - JSON only, no ```json or ``` around it
- [ ] **Title**: 3-8 words, powerful and specific
- [ ] **Description**: {{TASK_CHARACTER_MIN_LENGTH}}-{{TASK_CHARACTER_MAX_LENGTH}} characters (excluding HTML tags)
- [ ] **Paragraphs**: Proper `<p>` tags, no other HTML
- [ ] **Second person**: "You are...", "You must...", "You witness..."
- [ ] **Complete data**: All necessary information provided
- [ ] **Questions**: 2-3 clear questions, building on each other
- [ ] **Answer formats**: Clear expectations for each question
- [ ] **Language**: Written in {{LANGUAGE}}
- [ ] **Measurements**: Using {{METRIC_SYSTEM}} system

---

## 🚫 COMMON FORMATTING MISTAKES

### ❌ Markdown Wrapper (WRONG):
```json
{
  "title": "..."
}
```

### ✅ Raw JSON Only (CORRECT):
```
{
  "title": "..."
}
```

### ❌ Description Too Short (WRONG):
```
<p>You need to calculate something.</p>
```
(Way under character minimum!)

### ✅ Proper Length (CORRECT):
```
<p>You are a structural engineer at the San Francisco Bay Bridge Authority in 2002. The new eastern span is under construction - the largest self-anchored suspension bridge in the world. You must verify the load calculations before the first deck segments are installed. If the stress analysis is wrong, the entire $6.4 billion project could fail catastrophically once traffic begins crossing.</p><p>The main cable has a diameter of 0.85 meters...</p>
```

### ❌ Third Person (WRONG):
"An engineer needs to calculate the force..."

### ✅ Second Person (CORRECT):
"You are an engineer calculating the force..."

### ❌ No Data Provided (WRONG):
"Calculate the energy of the system."
(What system? What values?)

### ✅ Complete Data (CORRECT):
"Calculate the kinetic energy when mass = 1,800 kg and velocity = 25 m/s."

---

## 📌 FINAL REMINDER

**Your output is a JSON object that represents a complete, immersive, exciting task.**

Students should:
1. **Read the title** and think "This sounds interesting!"
2. **Read paragraph 1** and feel immersed in the scenario
3. **Read paragraph 2** and have ALL the information they need
4. **Read the questions** and know exactly what to do
5. **Read answer formats** and know exactly how to respond

**If ANY of these fail, the task output is incomplete or poorly formatted.**

**Return ONLY the JSON. Nothing else.**
