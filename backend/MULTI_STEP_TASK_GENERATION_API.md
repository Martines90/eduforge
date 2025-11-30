# Multi-Step Task Generation API Specification

## Overview

This document specifies the backend API endpoints for the new multi-step task generation workflow. The workflow consists of 4 sequential steps with AI validation and retry logic.

## Workflow Summary

1. **Step 1**: Generate task text (problem statement only - no images, no solution)
2. **Step 2**: Review task quality with AI validation (retry once if invalid)
3. **Step 3**: Generate images based on task text
4. **Step 4**: Generate detailed solution steps

Steps 3 and 4 can be executed in parallel for efficiency.

---

## Endpoint 1: Generate Task Text

### `POST /generate-task-text`

Generates the task text (problem statement) without images or solution.

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <firebase_token>
```

### Request Body
```json
{
  "curriculum_path": "math:grade_9_10:algebra:equations:linear_equations",
  "country_code": "HU",
  "target_group": "mixed",
  "difficulty_level": "medium",
  "educational_model": "constructive",
  "number_of_images": 1,
  "display_template": "modern",
  "precision_settings": {
    "constant_precision": 2,
    "intermediate_precision": 4,
    "final_answer_precision": 2,
    "use_exact_values": false
  },
  "custom_keywords": [],
  "template_id": "",
  "step": "task_text_only"
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "task_data": {
    "title": "A tankolás problémája",
    "story_text": "Péter autóval utazik Budapestről Debrecenbe. Az autója átlagosan 7 liter benzint fogyaszt 100 kilométeren. A távolság 220 kilométer. A benzin ára 580 Ft/liter. Péter indulás előtt 15 liter benzin van a tankban.",
    "questions": [
      "Mennyi benzinre van szükség az útra?",
      "Mennyit kell fizetnie a benzinért, ha teletankolja az autót indulás előtt (a tank kapacitása 50 liter)?"
    ],
    "metadata": {
      "curriculum_path": "math:grade_9_10:algebra:equations:linear_equations",
      "difficulty_level": "medium",
      "educational_model": "constructive",
      "target_group": "mixed",
      "estimated_time_minutes": 15
    }
  }
}
```

### Response (Error - 400/500)
```json
{
  "success": false,
  "message": "Failed to generate task text",
  "error": "Detailed error message"
}
```

### AI Prompt Template

```
You are an expert educational content creator specializing in {educational_model} learning approach.

TASK: Generate a mathematical problem suitable for {difficulty_level} level students.

CURRICULUM CONTEXT:
- Subject Path: {curriculum_path}
- Grade Level: {grade_level}
- Topic: {topic_name}
- Country: {country_code}
- Target Audience: {target_group}

REQUIREMENTS:
1. Create a realistic, engaging story-based problem
2. Use Hungarian context and names
3. Difficulty level: {difficulty_level}
4. Educational approach: {educational_model}
5. Generate 1-3 related questions
6. DO NOT include solutions or answers
7. DO NOT include images or image descriptions

OUTPUT FORMAT (JSON):
{
  "title": "Engaging, short title",
  "story_text": "Detailed problem description with real-world context",
  "questions": [
    "Question 1",
    "Question 2"
  ],
  "metadata": {
    "curriculum_path": "{curriculum_path}",
    "difficulty_level": "{difficulty_level}",
    "educational_model": "{educational_model}",
    "target_group": "{target_group}",
    "estimated_time_minutes": <number>
  }
}

Ensure the problem:
- Aligns with the curriculum topic
- Matches the difficulty level
- Encourages {educational_model} thinking
- Uses appropriate complexity for target group
- Is culturally relevant to {country_code}
```

---

## Endpoint 2: Review Task Quality

### `POST /review-task`

Reviews the generated task against curriculum criteria and quality standards.

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <firebase_token>
```

### Request Body
```json
{
  "task_text": {
    "title": "A tankolás problémája",
    "story_text": "Péter autóval utazik...",
    "questions": [
      "Mennyi benzinre van szükség az útra?",
      "Mennyit kell fizetnie a benzinért..."
    ],
    "metadata": {
      "curriculum_path": "math:grade_9_10:algebra:equations:linear_equations",
      "difficulty_level": "medium",
      "educational_model": "constructive",
      "target_group": "mixed"
    }
  },
  "criteria": {
    "curriculum_path": "math:grade_9_10:algebra:equations:linear_equations",
    "difficulty_level": "medium",
    "educational_model": "constructive",
    "target_group": "mixed"
  }
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "review": {
    "is_valid": true,
    "score": 8.5,
    "feedback": "The task is well-aligned with the curriculum. Questions are clear and appropriately challenging. Good real-world context.",
    "issues": []
  }
}
```

### Response (Invalid Task - 200)
```json
{
  "success": true,
  "review": {
    "is_valid": false,
    "score": 4.2,
    "feedback": "Task does not adequately address the curriculum topic. Difficulty level is too low.",
    "issues": [
      "Questions do not require linear equation solving",
      "Complexity is below medium level",
      "Missing constructive learning elements"
    ]
  }
}
```

### Response (Error - 400/500)
```json
{
  "success": false,
  "message": "Failed to review task",
  "error": "Detailed error message"
}
```

### AI Prompt Template

```
You are an educational quality reviewer specializing in curriculum alignment.

TASK: Review the following generated educational task and assess its quality.

TASK TO REVIEW:
Title: {task_title}
Story: {task_story_text}
Questions: {task_questions}

CRITERIA:
- Curriculum Path: {curriculum_path}
- Expected Topic: {topic_name}
- Difficulty Level: {difficulty_level}
- Educational Model: {educational_model}
- Target Group: {target_group}

EVALUATION CHECKLIST:
1. Does the task address the curriculum topic correctly?
2. Is the difficulty appropriate for {difficulty_level}?
3. Do questions require the expected mathematical concepts?
4. Does it support {educational_model} learning approach?
5. Is the language and context appropriate for {target_group}?
6. Is the problem statement clear and unambiguous?
7. Are the questions measurable and solvable?
8. Is the real-world context realistic and engaging?

OUTPUT FORMAT (JSON):
{
  "is_valid": <boolean>,
  "score": <number between 0-10>,
  "feedback": "Brief overall assessment (2-3 sentences)",
  "issues": [
    "Specific issue 1 if any",
    "Specific issue 2 if any"
  ]
}

SCORING GUIDELINES:
- 9-10: Excellent alignment, no issues
- 7-8.9: Good quality, minor improvements possible
- 5-6.9: Acceptable but has notable issues
- Below 5: Does not meet criteria (is_valid = false)

Set is_valid to false if score is below 6.0 or if there are critical alignment issues.
```

---

## Endpoint 3: Generate Task Images

### `POST /generate-task-images`

Generates illustrative images based on the task text.

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <firebase_token>
```

### Request Body
```json
{
  "task_text": {
    "title": "A tankolás problémája",
    "story_text": "Péter autóval utazik Budapestről Debrecenbe...",
    "questions": [
      "Mennyi benzinre van szükség az útra?",
      "Mennyit kell fizetnie a benzinért..."
    ],
    "metadata": {
      "curriculum_path": "math:grade_9_10:algebra:equations:linear_equations",
      "difficulty_level": "medium",
      "educational_model": "constructive",
      "target_group": "mixed"
    }
  },
  "number_of_images": 1
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "images": [
    {
      "id": "img_1703521234_abc123",
      "url": "https://storage.googleapis.com/eduforge/tasks/images/img_1703521234_abc123.png",
      "prompt": "Modern illustration of a car at a gas station, Hungarian setting, educational style",
      "metadata": {
        "width": 1024,
        "height": 768,
        "format": "png"
      }
    }
  ]
}
```

### Response (No Images - 200)
```json
{
  "success": true,
  "images": []
}
```

### Response (Error - 400/500)
```json
{
  "success": false,
  "message": "Failed to generate images",
  "error": "Detailed error message"
}
```

### Image Generation Prompt Template

```
Generate an educational illustration for a mathematical problem.

CONTEXT:
Title: {task_title}
Story: {task_story_text}

REQUIREMENTS:
1. Style: Clean, modern, educational
2. Audience: Hungarian {target_group} students, grades {grade_level}
3. Content: Illustrate the problem scenario (NOT the solution)
4. Tone: Engaging but professional
5. Colors: Vibrant but not distracting
6. Text: Minimal or no text in image
7. Cultural context: Hungarian setting

The image should help students visualize the problem without giving away the answer.

PROMPT: {generated_image_prompt}
```

**Technical Implementation Notes:**
- Use DALL-E 3 or Stable Diffusion XL
- Target resolution: 1024x768 or 1024x1024
- Store in Cloud Storage with public URL
- Include safety filters
- Generate image prompt first, then image
- Handle number_of_images = 0 (return empty array)

---

## Endpoint 4: Generate Task Solution

### `POST /generate-task-solution`

Generates detailed step-by-step solution for the task.

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <firebase_token>
```

### Request Body
```json
{
  "task_text": {
    "title": "A tankolás problémája",
    "story_text": "Péter autóval utazik Budapestről Debrecenbe. Az autója átlagosan 7 liter benzint fogyaszt 100 kilométeren. A távolság 220 kilométer. A benzin ára 580 Ft/liter. Péter indulás előtt 15 liter benzin van a tankban.",
    "questions": [
      "Mennyi benzinre van szükség az útra?",
      "Mennyit kell fizetnie a benzinért, ha teletankolja az autót indulás előtt (a tank kapacitása 50 liter)?"
    ],
    "metadata": {
      "curriculum_path": "math:grade_9_10:algebra:equations:linear_equations",
      "difficulty_level": "medium",
      "educational_model": "constructive"
    }
  },
  "precision_settings": {
    "constant_precision": 2,
    "intermediate_precision": 4,
    "final_answer_precision": 2,
    "use_exact_values": false
  },
  "educational_model": "constructive"
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "solution_data": {
    "solution_steps": [
      {
        "step_number": 1,
        "title": "Benzinigény kiszámítása",
        "description": "Először számítsuk ki, hogy mennyi benzin kell a 220 km-es útra, ha a fogyasztás 7 liter/100 km.",
        "formula": "benzinigény = (távolság / 100) × fogyasztás",
        "calculation": "(220 / 100) × 7 = 2.2 × 7 = 15.4",
        "result": "15.4 liter",
        "explanation": "Az autó 100 kilométerenként 7 litert fogyaszt, ezért 220 km-re arányosan számolva 15.4 liter benzinre van szükség."
      },
      {
        "step_number": 2,
        "title": "Hiányzó benzinmennyiség",
        "description": "Péternek 15 liter benzinje van, de 15.4 literre lenne szüksége. Teletankol, a tank kapacitása 50 liter.",
        "formula": "tankolás = tank_kapacitás - jelenlegi_mennyiség",
        "calculation": "50 - 15 = 35",
        "result": "35 liter",
        "explanation": "A teletankoláshoz 35 liter benzint kell vásárolnia."
      },
      {
        "step_number": 3,
        "title": "Tankolási költség",
        "description": "Számítsuk ki, mennyibe kerül 35 liter benzin 580 Ft/liter áron.",
        "formula": "költség = mennyiség × ár",
        "calculation": "35 × 580 = 20,300",
        "result": "20,300 Ft",
        "explanation": "A tankolás teljes költsége 20,300 forint."
      }
    ],
    "final_answer": "1. Az útra 15.4 liter benzin szükséges. 2. A teletankolás (35 liter) költsége 20,300 Ft.",
    "verification": "Ellenőrzés: 220 km / 100 × 7 = 15.4 liter ✓. Tankolás: 50 - 15 = 35 liter ✓. Költség: 35 × 580 = 20,300 Ft ✓",
    "common_mistakes": [
      "A távolságot és a fogyasztást összekeverni",
      "Elfelejteni, hogy 100 km-re vonatkozik a fogyasztás",
      "A jelenlegi benzinmennyiséget figyelmen kívül hagyni"
    ],
    "pedagogical_notes": {
      "key_concepts": [
        "Arányos osztás",
        "Lineáris összefüggések",
        "Egységváltás és arányítás"
      ],
      "prerequisite_knowledge": [
        "Alapműveletek törtekkel",
        "Százalékszámítás alapjai"
      ],
      "extension_questions": [
        "Hogyan változna az eredmény, ha a fogyasztás 20%-kal csökkenne?",
        "Mennyi lenne a teljes út költsége oda-vissza?"
      ]
    }
  }
}
```

### Response (Error - 400/500)
```json
{
  "success": false,
  "message": "Failed to generate solution",
  "error": "Detailed error message"
}
```

### AI Prompt Template

```
You are an expert mathematics teacher creating detailed, pedagogically sound solutions.

TASK INFORMATION:
Title: {task_title}
Story: {task_story_text}
Questions: {task_questions}

EDUCATIONAL CONTEXT:
- Educational Model: {educational_model}
- Difficulty Level: {difficulty_level}
- Grade Level: {grade_level}
- Curriculum Topic: {topic_name}

PRECISION SETTINGS:
- Constants: {constant_precision} decimal places
- Intermediate calculations: {intermediate_precision} decimal places
- Final answers: {final_answer_precision} decimal places
- Use exact values: {use_exact_values}

INSTRUCTIONS:
Create a step-by-step solution following the {educational_model} approach:

For CONSTRUCTIVE approach:
- Guide students to build understanding from prior knowledge
- Emphasize connections between concepts
- Show why each step follows logically

For EXPLORATIVE approach:
- Encourage discovery and pattern recognition
- Highlight multiple solution paths
- Foster inquiry and experimentation

For TRADITIONAL approach:
- Clear, sequential steps
- Emphasis on formulas and procedures
- Standard problem-solving methods

OUTPUT FORMAT (JSON):
{
  "solution_steps": [
    {
      "step_number": <number>,
      "title": "Brief step title",
      "description": "What we're doing in this step and why",
      "formula": "Mathematical formula (if applicable)",
      "calculation": "Detailed calculation with numbers",
      "result": "Result with unit",
      "explanation": "Why this step matters and how it connects to the problem"
    }
  ],
  "final_answer": "Complete answer to all questions, clearly stated",
  "verification": "How to check if the answer is correct",
  "common_mistakes": [
    "Mistake students often make 1",
    "Mistake students often make 2",
    "Mistake students often make 3"
  ],
  "pedagogical_notes": {
    "key_concepts": ["Concept 1", "Concept 2"],
    "prerequisite_knowledge": ["What students need to know"],
    "extension_questions": ["How to extend learning"]
  }
}

REQUIREMENTS:
1. Each step must be clear and self-contained
2. Use appropriate precision according to settings
3. Include units in all numerical answers
4. Explanations should match the educational model
5. Language: Hungarian
6. Show all intermediate calculations
7. Verification should be practical and student-friendly
8. Common mistakes should be specific to this problem type
9. Pedagogical notes should guide teachers
```

---

## Frontend Integration

### Environment Configuration

The frontend supports disabling image generation via environment variable:

```bash
# .env.local
NEXT_PUBLIC_DISABLE_IMAGE_GENERATION=true
```

When this flag is set to `true`:
- The `generateTaskImages()` function returns an empty images array
- No API call is made to `/generate-task-images`
- The task generation workflow continues normally without images

This is useful for:
- Development/testing when image generation is not yet implemented
- Reducing costs during development
- Environments where image generation is not required

### Frontend Service Usage

The frontend calls `generateTaskComplete()` which orchestrates all 4 steps:

```typescript
const result = await generateTaskComplete(request, firebaseToken, (step) => {
  // Progress callback
  console.log(step.message); // "Feladat generálása..."
  console.log(step.progress); // 0-100
});

// Result structure:
{
  taskText: GeneratedTaskText,
  solution: GeneratedSolution,
  images: GeneratedImages,
  taskId: string
}
```

### Retry Logic

- Step 2 (review) may trigger retry of Step 1
- Maximum 2 generation attempts
- If both attempts fail review, use the last generated task
- Steps 3 and 4 execute in parallel after successful generation

---

## Error Handling

All endpoints should return consistent error format:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Detailed technical error (for logging)",
  "code": "ERROR_CODE" // Optional error code
}
```

Common error codes:
- `AUTH_REQUIRED`: Missing or invalid token
- `INVALID_INPUT`: Request validation failed
- `AI_SERVICE_ERROR`: AI service unavailable
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `GENERATION_FAILED`: Task generation failed after retries

---

## Authentication

All endpoints require Firebase Authentication token:
```
Authorization: Bearer <firebase_id_token>
```

Backend should verify token and extract user information:
```javascript
const decodedToken = await admin.auth().verifyIdToken(token);
const userId = decodedToken.uid;
const userEmail = decodedToken.email;
```

---

## Rate Limiting

Recommended rate limits:
- `/generate-task-text`: 10 requests per minute per user
- `/review-task`: 20 requests per minute per user
- `/generate-task-images`: 5 requests per minute per user (image generation is expensive)
- `/generate-task-solution`: 10 requests per minute per user

---

## Monitoring & Logging

Log the following for each request:
- User ID
- Request timestamp
- Endpoint
- Request parameters (curriculum_path, difficulty_level, etc.)
- Processing time
- Success/failure
- AI model used
- Token usage (for cost tracking)

For Step 2 (review), additionally log:
- Review score
- Validation result (is_valid)
- Whether retry was triggered

---

## Implementation Priority

1. **Phase 1**: Implement endpoints 1 and 4 (text generation and solution)
   - These are the core functionality
   - Can return empty array for images initially

2. **Phase 2**: Implement endpoint 2 (review/validation)
   - Add quality assurance layer
   - Implement retry logic

3. **Phase 3**: Implement endpoint 3 (image generation)
   - Most complex and expensive
   - Requires image storage setup

---

## Testing Recommendations

1. **Unit Tests**: Test each endpoint independently
2. **Integration Tests**: Test complete workflow with mocked AI
3. **End-to-End Tests**: Test with actual AI services (use test/dev mode)
4. **Performance Tests**: Measure response times, especially for image generation
5. **Quality Tests**: Manually review generated tasks for curriculum alignment

---

## Cost Optimization

- Cache common curriculum patterns
- Use cheaper models for review step
- Batch process when possible
- Implement request deduplication (same params within 5 minutes)
- Use image generation service in economy mode for development

---

## Future Enhancements

1. **Task Templates**: Pre-defined templates for common problem types
2. **Difficulty Auto-Adjustment**: AI adjusts difficulty based on student performance
3. **Multilingual Support**: Generate tasks in multiple languages
4. **Collaborative Review**: Teacher feedback improves AI prompts
5. **Task Variations**: Generate similar tasks for practice
