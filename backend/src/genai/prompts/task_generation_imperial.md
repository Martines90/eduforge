# Generic Specification for Exceptional Math Task Design

## Core Design Philosophy

Transform abstract mathematical concepts into immersive narratives where problem-solving becomes a meaningful human endeavor with real stakes and context.

## Essential Components

### 1. **Narrative Framework (Required)**

- **Historical/Real-World Anchor**: Ground the problem in an authentic time period, profession, or scenario that actually existed or could plausibly exist
- **Role Assignment**: Cast the solver as a professional with authority and responsibility (engineer, architect, analyst, expedition leader, etc.)
- **Stakes and Purpose**: Establish why solving this problem matters—connect it to completion, success, or resolution of a significant challenge
- **Temporal Specificity**: Include exact dates, time periods, or deadlines to enhance realism

### 2. **Problem Context Structure**

- **Opening Hook** (50-80 characters): Begin with time/place/role to immediately establish context
- **Situation Setup** (150-250 characters): Describe the overarching project, challenge, or scenario
- **Dual/Multiple Elements**: Present at least two competing factors, teams, resources, or constraints that must be balanced or reconciled
- **Concrete Data Presentation**: Embed all numerical values within descriptive context rather than listing them separately

### 3. **Data Integration Style**

- **Naturalistic Embedding**: Weave numbers seamlessly into narrative sentences (e.g., "working with 9,500 laborers" not "Team A: 9,500 workers")
- **Precision with Purpose**: Use realistic, specific decimals that reflect actual measurement practices (3.98 km, not 4 km)
- **Asymmetry**: Avoid overly round or symmetrical numbers—reality is messy
- **Units Specified**: Always include appropriate units within the narrative flow

### 4. **Challenge Articulation**

- **Professional Voice**: Frame the task as a professional decision or calculation the solver must make in their role
- **Action-Oriented Language**: Use verbs like "determine," "reorganize," "calculate," "optimize," "ensure"
- **Constraint Specification**: Clearly state what must remain equal, balanced, optimized, or synchronized
- **Goal Clarity**: End with a precise question asking for a specific quantitative answer

### 5. **Linguistic Quality Standards**

- **Varied Sentence Structure**: Mix short and long sentences; avoid repetitive patterns
- **Active Voice Dominance**: Prioritize active constructions to maintain engagement
- **Professional Vocabulary**: Use domain-appropriate terminology without over-complicating
- **Transition Flow**: Connect ideas smoothly between setup, data, and challenge

### 6. **Mathematical Authenticity**

- **Real-World Complexity**: Numbers should reflect actual measurements, not simplified textbook values
- **Logical Constraints**: All given information should be necessary; avoid red herrings unless pedagogically intentional
- **Solution Path**: Ensure the problem requires the target mathematical concept(s) and has a deterministic solution
- **Implicit Assumptions**: Allow for reasonable assumptions a professional would make (e.g., linear relationships, proportional scaling)

## Structural Template

**[OPENING]** (50-100 words)

- Time period and setting
- Solver's role and authority
- Overarching project/challenge

**[SITUATION DEVELOPMENT]** (100-150 words)

- Present Element A with embedded data
- Present Element B with embedded data
- Establish the tension or imbalance between elements
- Include relevant constraints or conditions

**[CHALLENGE]** (40-70 words)

- Professional imperative (what you must do)
- Specific question requiring calculation
- Success criteria (what must be achieved)

## Technical Specifications

**Character Count**: 1,200 - 1,800 characters (including spaces)

- Minimum: 1,200 ensures sufficient context and immersion
- Maximum: 1,800 maintains single-page readability with accompanying illustration

**Paragraph Structure**: 3-4 paragraphs recommended

- Opening context: 1 paragraph
- Detailed situation: 1-2 paragraphs
- Challenge/question: 1 paragraph

**Numerical Precision**:

- Use 2-4 significant figures for realism
- Include decimals where appropriate to the context
- Vary precision levels (some round, some precise)

## Quality Differentiators (What Makes It Exceptional)

1. **Immersive vs. Instructional**: Reads like a professional briefing, not a textbook exercise
2. **Contextual Data**: Numbers emerge from story rather than being presented in isolation
3. **Professional Agency**: Solver has authority and responsibility, not just following instructions
4. **Authentic Complexity**: Reflects real-world messiness while remaining solvable
5. **Temporal Grounding**: Specific dates/eras create tangibility
6. **Human Stakes**: Solution matters for project completion, team coordination, resource allocation
7. **Visual Potential**: Scenario naturally suggests accompanying period-appropriate illustration
8. **Vocabulary Richness**: Domain-specific terms without unnecessary jargon

## What to AVOID

- Generic scenarios ("Two trains leave stations...")
- Artificially round numbers (100, 50, 25)
- Data presented in lists or tables within narrative
- Passive voice dominance
- Present tense for historical scenarios
- Asking "Show your work" or "Explain your reasoning" (keep focus on the answer)
- Mathematical terminology in the narrative (save for the challenge statement)

## Note on Adaptability

This specification applies across all mathematical topics—from basic arithmetic to calculus—by adjusting the professional role, scenario complexity, and technical vocabulary while maintaining the core narrative immersion principle.

---

## OUTPUT FORMAT

**IMPORTANT**: You must respond with ONLY a valid JSON object. Do not include any text before or after the JSON.

Return your response in the following JSON structure:

```json
{
  "title": "Short, engaging title that captures the scenario (5-10 words)",
  "story_chunks": [
    "First paragraph: Opening hook with time/place/role (50-100 words)",
    "Second paragraph: Situation development with Element A and embedded data (100-150 words). Use **bold** for key numerical values.",
    "Third paragraph: Element B, tension, constraints (80-120 words). Use **bold** for key numerical values.",
    "Fourth paragraph: The challenge and specific questions (40-70 words)"
  ],
  "questions": [
    "Question A: Clear, specific question asking for quantitative answer",
    "Question B: Optional second question (ONLY if the problem naturally requires it)"
  ],
  "expected_answer_formats": [
    "Format for answer A (e.g., 'distance in kilometers to 2 decimal places')",
    "Format for answer B (optional, only if there's a second question)"
  ]
}
```

**IMPORTANT**: Use markdown **bold** formatting (double asterisks) to highlight key numerical values and important data points in your story. For example: "working at a pace of **0.41 miles per week**" or "completed **8.3 miles**".

**IMPORTANT NOTES ON QUESTIONS:**
- **Default: Use 1 question** - Most problems should have a single, focused question
- **Maximum: 2 questions (A and B)** - Only use 2 questions when:
  - The problem naturally has two distinct parts that build on each other
  - Both questions are essential to fully exploring the scenario
  - The second question adds pedagogical value (not just busywork)
- **DO NOT force multiple questions** - If the problem works well with one question, use one question
- **Questions should be labeled** as "A)" and "B)" in the last paragraph if there are 2

---

## MEASUREMENT SYSTEM AND NUMBER FORMATTING

**IMPERIAL SYSTEM** - Use these units and formatting conventions:

**Units to Use:**
- Distance: miles (mi), yards (yd), feet (ft), inches (in)
- Weight: pounds (lb), ounces (oz), tons
- Volume: gallons (gal), quarts (qt), pints (pt), fluid ounces (fl oz)
- Temperature: Fahrenheit (°F)
- Speed: mph, ft/s
- Area: square feet (ft²), acres

**Number Formatting (CRITICAL):**
- Decimal separator: **period** → `12.7 miles` (NOT 12,7)
- Thousands separator: **comma** → `112,233,222` (NOT 112 233 222)

**Examples:**
- `3.98 miles` (three point nine eight miles)
- `1,250,000 people` (one million two hundred fifty thousand)
- `0.05 seconds` (zero point zero five)
- `15.3 pounds` (fifteen point three pounds)

**Rules:**
- Use imperial system throughout the entire task
- Match decimal precision to real-world measurement practices
- Numbers should flow naturally in sentences
- Always include units - never write bare numbers
- Choose units that professionals would actually use in that scenario

---

Remember:
- Return ONLY the JSON object, no markdown code blocks, no explanatory text
- All story chunks should be complete paragraphs with proper flow
- Embed all numerical data naturally within the narrative
- Use **bold** markdown formatting to highlight key numerical values
- Make the title compelling and era-specific
- Default to 1 question unless 2 questions genuinely enhance the problem
- Ensure each question is clear and unambiguous
- If using 2 questions, label them as A) and B) in the story
