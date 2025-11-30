# Task Generation API V2 - 3 Variations + AI Selection

## Overview

This document specifies the **new and improved** backend API endpoints for task generation. The workflow generates **3 task variations in parallel** and uses AI to select the best one, eliminating the need for iterative retry logic.

## New Workflow Summary

1. **Step 1**: Generate **3 task text variations in parallel** (problem statements only - no images, no solutions)
2. **Step 2**: **AI selects the best task** from the 3 variations based on quality criteria
3. **Step 3**: Generate images for the selected task (if requested)
4. **Step 4**: Generate detailed solution for the selected task

Steps 3 and 4 execute in parallel for efficiency.

---

## Key Improvements Over Previous Approach

| Old Approach | New Approach |
|--------------|--------------|
| Generate 1 task → Review → Retry if failed | Generate 3 tasks in parallel → Pick best |
| Sequential with potential 2 iterations | Parallel generation, single selection |
| Max 2 task generations | Always 3 task generations |
| Review returns yes/no validation | Selection returns scores and reasoning |
| Less diverse options | More diverse, AI picks optimal |

---

## Endpoint 1: Generate Task Text (Used 3 times in parallel)

### `POST /generate-task-text`

Generates a single task text variation. **Frontend calls this 3 times in parallel** with different `variation_index` values to create diversity.

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
  "step": "task_text_only",
  "variation_index": 1
}
```

**New Field**: `variation_index` (1, 2, or 3)
- Used to seed variation in task generation
- Each variation should be meaningfully different
- Same curriculum requirements, different contexts/scenarios

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
      "estimated_time_minutes": 15,
      "variation_index": 1
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

**IMPORTANT**: This is variation #{variation_index} of 3. Create a UNIQUE scenario that:
- Addresses the same curriculum topic from a different angle
- Uses a different real-world context
- Maintains the same difficulty and educational approach
- Is meaningfully distinct from other variations

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
8. Make this variation unique and interesting

VARIATION STRATEGY:
- Variation 1: Common everyday scenario (shopping, travel, cooking, etc.)
- Variation 2: Sports/games context (sports statistics, game scores, competitions)
- Variation 3: Technology/science context (data usage, physics problems, measurements)

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
    "estimated_time_minutes": <number>,
    "variation_index": {variation_index}
  }
}

Ensure the problem:
- Aligns perfectly with the curriculum topic
- Matches the difficulty level precisely
- Encourages {educational_model} thinking
- Uses appropriate complexity for target group
- Is culturally relevant to {country_code}
- Is DIFFERENT from typical variations if this is variation 2 or 3
```

---

## Endpoint 2: Select Best Task (NEW!)

### `POST /select-best-task`

AI evaluates 3 task variations and selects the best one based on quality criteria.

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <firebase_token>
```

### Request Body
```json
{
  "task_variations": [
    {
      "title": "A tankolás problémája",
      "story_text": "Péter autóval utazik...",
      "questions": ["..."],
      "metadata": {
        "curriculum_path": "math:grade_9_10:algebra:equations:linear_equations",
        "variation_index": 1
      }
    },
    {
      "title": "Futóverseny és távolságok",
      "story_text": "Anna félmaratont fut...",
      "questions": ["..."],
      "metadata": {
        "curriculum_path": "math:grade_9_10:algebra:equations:linear_equations",
        "variation_index": 2
      }
    },
    {
      "title": "Mobiladat-használat",
      "story_text": "Balázs mobilszolgáltatója...",
      "questions": ["..."],
      "metadata": {
        "curriculum_path": "math:grade_9_10:algebra:equations:linear_equations",
        "variation_index": 3
      }
    }
  ],
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
  "selection": {
    "selected_index": 1,
    "selected_task": {
      "title": "Futóverseny és távolságok",
      "story_text": "Anna félmaratont fut...",
      "questions": ["..."],
      "metadata": {
        "curriculum_path": "math:grade_9_10:algebra:equations:linear_equations",
        "difficulty_level": "medium",
        "educational_model": "constructive",
        "target_group": "mixed",
        "variation_index": 2
      }
    },
    "reasoning": "Task 2 provides the best combination of real-world relevance, clarity, and constructive learning opportunities. The sports context is engaging for mixed audiences, and the problem structure naturally guides students to build understanding step-by-step. Task 1 was also strong but slightly less engaging. Task 3 had excellent context but slightly higher complexity than requested.",
    "scores": {
      "task_1": 8.2,
      "task_2": 9.1,
      "task_3": 7.8
    }
  }
}
```

### Response (Error - 400/500)
```json
{
  "success": false,
  "message": "Failed to select best task",
  "error": "Detailed error message"
}
```

### AI Prompt Template

```
You are an expert educational task evaluator with deep knowledge of pedagogy and curriculum design.

TASK: Evaluate 3 task variations and select the BEST one based on the criteria below.

TASK VARIATIONS:
---
**Task 1 (Variation #{variation_1_index}):**
Title: {task_1_title}
Story: {task_1_story}
Questions: {task_1_questions}

**Task 2 (Variation #{variation_2_index}):**
Title: {task_2_title}
Story: {task_2_story}
Questions: {task_2_questions}

**Task 3 (Variation #{variation_3_index}):**
Title: {task_3_title}
Story: {task_3_story}
Questions: {task_3_questions}
---

EVALUATION CRITERIA:
- Curriculum Path: {curriculum_path}
- Expected Topic: {topic_name}
- Difficulty Level: {difficulty_level}
- Educational Model: {educational_model}
- Target Group: {target_group}

SCORING DIMENSIONS (each 0-10):
1. **Curriculum Alignment** (30% weight): Does the task perfectly address the required curriculum topic?
2. **Difficulty Appropriateness** (25% weight): Is the difficulty level exactly right for {difficulty_level}?
3. **Educational Model Fit** (20% weight): Does it support {educational_model} learning approach?
4. **Engagement & Context** (15% weight): Is the real-world context realistic, interesting, and culturally appropriate?
5. **Clarity & Solvability** (10% weight): Are the problem and questions clear, unambiguous, and solvable?

INSTRUCTIONS:
1. Evaluate each task on all 5 dimensions
2. Calculate weighted total scores for each task
3. Select the task with the highest score
4. Provide clear reasoning explaining why this task is best
5. Include the scores for all 3 tasks

OUTPUT FORMAT (JSON):
{
  "selected_index": <0, 1, or 2 (zero-indexed)>,
  "selected_task": <copy the entire selected task object>,
  "reasoning": "2-3 sentences explaining why this task was selected and noting key strengths/weaknesses of each",
  "scores": {
    "task_1": <total score 0-10>,
    "task_2": <total score 0-10>,
    "task_3": <total score 0-10>
  }
}

IMPORTANT:
- Be objective and analytical
- Small differences in scores are acceptable - select based on overall quality
- All tasks should be reasonably good (7+ scores) - you're picking the BEST
- Consider the target audience when evaluating engagement
```

---

## Endpoint 3: Generate Task Images

### `POST /generate-task-images`

Generates illustrative images for the **selected** task.

**(Same as previous specification - no changes)**

### Request/Response

See MULTI_STEP_TASK_GENERATION_API.md Endpoint 3.

**Note**: This endpoint is called AFTER task selection, using only the best task.

---

## Endpoint 4: Generate Task Solution

### `POST /generate-task-solution`

Generates detailed solution for the **selected** task.

**(Same as previous specification - no changes)**

### Request/Response

See MULTI_STEP_TASK_GENERATION_API.md Endpoint 4.

**Note**: This endpoint is called AFTER task selection, using only the best task.

---

## Frontend Integration

### Frontend Service Workflow

```typescript
// Step 1: Generate 3 variations in parallel
const variations = await generateTaskVariations(request, token, onProgress);
// Makes 3 parallel calls to /generate-task-text with variation_index: 1, 2, 3

// Step 2: AI selects the best
const selectionResult = await selectBestTask(variations, request, token, onProgress);
// Single call to /select-best-task with all 3 variations

// Step 3 & 4: Generate images and solution in parallel
const [images, solution] = await Promise.all([
  generateTaskImages(selectionResult.selected_task, numberOfImages, token),
  generateTaskSolution(selectionResult.selected_task, request, token)
]);
```

### Progress Tracking

| Step | Progress % | Message |
|------|-----------|---------|
| Start generating 3 variations | 10% | "3 feladat változat generálása párhuzamosan..." |
| Variations complete | 30% | "3 feladat változat sikeresen generálva!" |
| Start selection | 40% | "AI kiválasztja a legjobb változatot..." |
| Selection complete | 50% | "Legjobb változat kiválasztva (X. változat)!" |
| Start images & solution | 60% | "Képek és megoldás generálása..." |
| Solution progress | 80% | "Megoldás generálása..." |
| Complete | 100% | "Feladat sikeresen elkészült!" |

### Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_DISABLE_IMAGE_GENERATION=true
```

When this flag is set, image generation step returns empty array without API call.

---

## Authentication

All endpoints require Firebase Authentication token:
```
Authorization: Bearer <firebase_id_token>
```

Backend should verify token and extract user information.

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Detailed technical error (for logging)",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `AUTH_REQUIRED`: Missing or invalid token
- `INVALID_INPUT`: Request validation failed
- `AI_SERVICE_ERROR`: AI service unavailable
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `GENERATION_FAILED`: Task generation failed
- `SELECTION_FAILED`: Could not select best task

---

## Rate Limiting

Recommended rate limits:
- `/generate-task-text`: **30 requests per minute per user** (allows 3 parallel calls × 10 workflows)
- `/select-best-task`: **10 requests per minute per user**
- `/generate-task-images`: **5 requests per minute per user** (expensive)
- `/generate-task-solution`: **10 requests per minute per user**

---

## Performance Optimization

### Parallel Execution
- **3 task variations** are generated simultaneously (NOT sequentially)
- **Images + Solution** are generated simultaneously for the selected task
- Total time is dominated by the slowest operation in each parallel batch

### Expected Timings
- Parallel task generation (3 tasks): ~8-12 seconds (vs 8-12s each sequentially = 24-36s)
- Task selection: ~3-5 seconds
- Parallel images + solution: ~10-15 seconds (image generation is slowest)
- **Total workflow: ~20-30 seconds** (vs 40-60s with old sequential + retry approach)

---

## Implementation Guidance

### Backend Implementation Priority

1. **Phase 1**: Implement `/generate-task-text` with variation support
   - Add `variation_index` parameter
   - Implement prompt variations strategy
   - Test parallel generation (3 concurrent requests)

2. **Phase 2**: Implement `/select-best-task`
   - AI scoring system
   - Selection logic
   - Return full selected task object

3. **Phase 3**: Implement `/generate-task-solution`
   - Use same endpoint as before
   - Receives only the selected task

4. **Phase 4**: Implement `/generate-task-images` (if needed)
   - Most complex, can be delayed
   - Frontend handles gracefully with DISABLE flag

### Testing Strategy

**Test Variation Quality**:
```bash
# Generate 3 variations with same parameters
curl -X POST /generate-task-text -d '{"curriculum_path": "...", "variation_index": 1}'
curl -X POST /generate-task-text -d '{"curriculum_path": "...", "variation_index": 2}'
curl -X POST /generate-task-text -d '{"curriculum_path": "...", "variation_index": 3}'

# Verify:
# - All are valid for the curriculum
# - All have similar difficulty
# - Contexts/scenarios are meaningfully different
```

**Test Selection Logic**:
```bash
# Send 3 tasks with one intentionally weaker
curl -X POST /select-best-task -d '{"task_variations": [good_task, great_task, weak_task]}'

# Verify:
# - Selects the great_task
# - Scores reflect quality differences
# - Reasoning is clear and accurate
```

---

## Monitoring & Logging

Log the following for observability:

### For `/generate-task-text`:
- User ID
- Request timestamp
- Variation index
- Curriculum path
- Processing time
- Success/failure
- Token usage

### For `/select-best-task`:
- User ID
- Request timestamp
- Task scores
- Selected index
- Selection reasoning
- Processing time
- Any selection errors

### Aggregate Metrics:
- Average time for 3 parallel generations
- Distribution of selected variations (is one variation consistently winning?)
- Score distributions
- Selection consistency (same inputs → same selection?)

---

## Cost Analysis

### Per Task Generation Workflow

| Step | API Calls | Estimated Cost |
|------|-----------|----------------|
| Generate 3 variations | 3× GPT-4 calls (parallel) | ~$0.15 |
| Select best task | 1× GPT-4 call | ~$0.02 |
| Generate solution | 1× GPT-4 call | ~$0.05 |
| Generate images | 1× DALL-E 3 call | ~$0.08 |
| **Total per task** | **6 AI calls** | **~$0.30** |

### Comparison with Old Approach

| Metric | Old (Retry) | New (3 Variations) |
|--------|-------------|-------------------|
| Best case (1 generation, passes review) | $0.12 | $0.30 |
| Worst case (2 generations, retry) | $0.24 | $0.30 |
| Average | $0.18 | $0.30 |
| **Consistency** | Variable | **Fixed** |
| **Quality** | Pass/fail validation | **Best of 3** |

**Trade-off**: Slightly higher fixed cost (~67% increase on average), but:
- ✅ More consistent pricing (no variability)
- ✅ Higher quality output (best of 3)
- ✅ Faster (parallel > sequential retry)
- ✅ Better UX (predictable timing)

---

## Future Enhancements

1. **Adaptive Variation Count**: Let users choose 1, 3, or 5 variations
2. **Variation Caching**: Cache successful variations for similar requests
3. **User Feedback Loop**: Let teachers rate tasks, feed back into selection AI
4. **Variation Templates**: Pre-configured context templates (sports, science, daily life, etc.)
5. **Batch Generation**: Generate tasks for multiple topics in one request
6. **A/B Testing**: Compare old vs new approach in production with metrics

---

## Migration from V1

### Breaking Changes
- ❌ `/review-task` endpoint removed (replaced by `/select-best-task`)
- ✅ `/generate-task-text` now accepts `variation_index` parameter (optional, backwards compatible)
- ✅ `/select-best-task` is new endpoint
- ✅ `/generate-task-solution` and `/generate-task-images` unchanged

### Frontend Changes
- Frontend service completely refactored
- New `generateTaskVariations()` function
- New `selectBestTask()` function
- `generateTaskComplete()` orchestrator rewritten
- Progress step names updated

### Migration Path
1. Deploy new backend endpoints alongside old ones
2. Update frontend to use new workflow
3. A/B test in production (50/50 split)
4. Monitor quality and performance metrics
5. Migrate fully to new approach
6. Deprecate old `/review-task` endpoint

---

## FAQ

**Q: Why 3 variations instead of 2 or 5?**
A: 3 provides good diversity without excessive cost. Statistically, best-of-3 provides ~85% chance of getting a top-tier result.

**Q: Can variation_index be anything or must it be 1, 2, 3?**
A: Should be 1, 2, 3 as prompts use this for variation strategy. Backend can enforce this.

**Q: What if all 3 variations are bad?**
A: AI still selects the "best" (least bad). Consider adding minimum score threshold in selection logic.

**Q: Can we reuse variations across requests?**
A: Yes! Consider caching successful variations by curriculum_path + difficulty_level for faster subsequent generations.

**Q: What if AI always picks the same variation number?**
A: Monitor `selected_index` distribution. If biased, adjust variation prompts to increase diversity or quality of underperforming variations.
