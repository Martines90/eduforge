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

### 5. Student-Friendly Language

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
      "formula": "\\LaTeX formula if applicable",
      "calculation": "\\LaTeX calculation with substituted values",
      "result": "Result of this step",
      "explanation": "Why this step matters and how it connects to the story"
    }
  ],
  "final_answer": "Complete final answer with units and context",
  "verification": "Optional: How to verify the answer makes sense in the story context",
  "common_mistakes": ["Mistake 1 to avoid", "Mistake 2 to avoid"],
  "key_concepts": ["Concept 1 used", "Concept 2 used"]
}
```

## Example Step Structure

**Step 3: Calculate the Total Distance**

- **Description:** Now that we know the speed and time, we can find the total distance traveled using the distance formula.
- **Formula:** `d = v \cdot t`
- **Calculation:** `d = 15 \text{ m/s} \cdot 8 \text{ s} = 120 \text{ m}`
- **Result:** 120 meters
- **Explanation:** This tells us that the hero in our story needs to cover 120 meters to reach their destination in time.

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
