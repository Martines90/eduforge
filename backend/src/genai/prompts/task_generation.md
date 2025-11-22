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
    "Second paragraph: Situation development with Element A and embedded data (100-150 words)",
    "Third paragraph: Element B, tension, constraints (80-120 words)",
    "Fourth paragraph: The challenge and specific question (40-70 words)"
  ],
  "key_values": {
    "value1_name": "value1_with_unit",
    "value2_name": "value2_with_unit"
  },
  "question": "Clear, specific question asking for quantitative answer",
  "expected_answer_format": "Description of what format the answer should be in (e.g., 'distance in kilometers to 2 decimal places')"
}
```

**Example Response:**

```json
{
  "title": "The Great Canal Project of 1855",
  "story_chunks": [
    "As chief engineer for the Erie Extension Canal in March 1855, you oversee the final phase connecting Lake Michigan to the Illinois River. With spring flooding imminent, precise calculations become critical.",
    "Your northern crew has excavated 12.7 miles at a steady pace of 0.41 miles per week, working through frozen ground since January. The terrain is relatively flat, allowing for consistent progress despite harsh conditions.",
    "Meanwhile, the southern team tackles more challenging rocky terrain, having completed 8.3 miles at just 0.29 miles per week. Recent geological surveys revealed unexpected limestone deposits, further slowing their advance.",
    "To coordinate the ceremonial meeting point by April 30th, you must determine the exact date when both crews will converge. How many weeks from today will the teams meet, assuming their current rates continue?"
  ],
  "key_values": {
    "northern_progress": "12.7 miles",
    "northern_rate": "0.41 miles/week",
    "southern_progress": "8.3 miles",
    "southern_rate": "0.29 miles/week"
  },
  "question": "How many weeks from today will the teams meet, assuming their current rates continue?",
  "expected_answer_format": "Number of weeks as a decimal to 1 decimal place"
}
```

Remember:
- Return ONLY the JSON object, no markdown code blocks, no explanatory text
- All story chunks should be complete paragraphs with proper flow
- Embed all numerical data naturally within the narrative
- Make the title compelling and era-specific
- Ensure the question is clear and unambiguous
