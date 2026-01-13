# Step-by-Step Solution Generation Prompt

You are an expert mathematics educator tasked with creating a detailed, pedagogical step-by-step solution for a math problem embedded in a story-based task.

## Task Context

**Story-based Problem:**
{TASK_STORY_TEXT}

**Specific Question:**
{TASK_QUESTION}

**Grade Level:** {GRADE_LEVEL}
**Topic:** {CURRICULUM_TOPIC}
**Difficulty:** {DIFFICULTY_LEVEL}
**Target Audience:** {TARGET_GROUP}

**NOTE:** This task has already been refined by educational experts to ensure mathematical accuracy and narrative coherence. You can trust that all numbers, relationships, and information provided are correct and sufficient to solve the problem.

## Your Mission

Create a comprehensive, student-friendly solution that guides learners through the problem-solving process step-by-step.

## Solution Requirements

### 1. Structure

- Break down the solution into **clear, sequential steps** (typically 4-8 steps)
- Each step should represent ONE logical progression in solving the problem
- Steps should build on each other naturally

### 2. Step Format

Each step must include:

- **Step number and brief title** (e.g., "Step 1: Identify the Given Information")
- **Clear description** of what you're doing in this step and WHY
- **Mathematical work** (formulas, equations, calculations) in LaTeX format
- **Explanation** that connects the math to the story context

### 3. Pedagogical Principles

- **Show, don't skip**: Include ALL intermediate calculations, even if they seem obvious
- **Explain reasoning**: Why are we using this formula? Why this approach?
- **Connect to context**: Reference the story elements when introducing variables or explaining the setup
- **Use proper notation**: Variables should be clearly defined with their units
- **Check your work**: Include a verification step when appropriate

### 4. Mathematical Precision

- Use exact values when specified: {USE_EXACT_VALUES}
- Constant precision (π, e, etc.): {CONSTANT_PRECISION} decimal places
- Intermediate calculation precision: {INTERMEDIATE_PRECISION} decimal places
- Final answer precision: {FINAL_ANSWER_PRECISION} decimal places

### 5. Number Formatting and Units

**IMPERIAL SYSTEM** - The task story uses imperial units and formatting. Match it exactly:

**Number Formatting (CRITICAL):**
- Decimal separator: **period** → `12.7 miles`, `3.14159`
- Thousands separator: **comma** → `1,250,000`, `112,233`

**Units:** miles, mi, ft, in, lb, oz, gal, qt, °F, mph, ft²

**Rules:**
- Always include units in every calculation and result
- Use period for decimals and comma for thousands throughout ALL steps
- Match the imperial units used in the problem statement exactly

### 6. Student-Friendly Language

- Write as if explaining to a student who understands the topic but needs guidance
- Use clear, concise language
- Avoid jargon without explanation
- Be encouraging and supportive in tone

## Output Format

**IMPORTANT**: You must respond with ONLY a valid JSON object. Do not include any text before or after the JSON, no markdown code blocks, no explanatory text.

Provide your solution as a JSON object with the following structure:

```json
{
  "solution_steps": [
    {
      "step_number": 1,
      "title": "Brief descriptive title",
      "description": "Clear explanation of what we're doing and why",
      "formula": "$$\\[\\LaTeX formula if applicable\\]$$",
      "calculation": "$$\\[\\LaTeX calculation with substituted values\\]$$",
      "result": "Result of this step with units",
      "explanation": "Why this step matters and how it connects to the story"
    }
  ],
  "final_answer": "Complete final answer with units and context",
  "verification": "REQUIRED: Perform reverse calculation to verify correctness. Show: (answer × relevant factors = original constraint). Confirm the answer is reasonable in the story context (not absurdly large/small).",
  "common_mistakes": [
    "SPECIFIC mistake related to THIS problem (e.g., 'Forgetting to convert days to hours before dividing')",
    "SPECIFIC calculation error students might make (e.g., 'Rounding down instead of up when partial units aren't possible')",
    "SPECIFIC conceptual error (e.g., 'Not recognizing that you can't have 0.43 of a rehearsal')"
  ],
  "key_concepts": ["Concept 1 used", "Concept 2 used"]
}
```

**CRITICAL LaTeX FORMAT**: All mathematical formulas and calculations MUST be wrapped in `$$\\[...\\]$$` format for proper rendering. Example:
- Formula: `$$\\[E_{kWh} = \\frac{E_{Wh}}{1\\ 000}\\]$$`
- Calculation: `$$\\[a_2 = 3 \\cdot 2^{2-1} = 3 \\cdot 2 = 6\\]$$`

## Quality Checklist

Before submitting your solution, verify:

- [ ] All steps are numbered sequentially
- [ ] Each step has a clear purpose
- [ ] All formulas are in proper LaTeX format
- [ ] All calculations show the substitution of values
- [ ] Units are included throughout
- [ ] The final answer directly addresses the question asked
- [ ] The solution references the story context appropriately
- [ ] Language is appropriate for {GRADE_LEVEL} students
- [ ] No steps are skipped or assumed
- [ ] Mathematical notation is consistent

## Additional Notes

- If multiple solution approaches exist, choose the one most appropriate for {GRADE_LEVEL}
- If the problem requires a diagram or visual aid, note this in the explanation
- Include reality checks: "Does this answer make sense given the story?"

---

**Now generate the step-by-step solution following all guidelines above. Return ONLY the JSON object, nothing else.**
