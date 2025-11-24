# Task Generation Service Upgrade

## Overview

The task generation service has been significantly upgraded to use a more robust system prompt approach. The new implementation provides better context and structure by:

1. **Using the system prompt template** (`/src/genai/prompts/latest/system_prompt.template.md`)
2. **Randomly selecting 6 reference tasks** from `inspirational_reference_tasks.json` for style guidance
3. **Extracting curriculum topic information** from `hu_math_grade_9_12.json` based on the curriculum path
4. **Building a structured JSON input** that the AI processes as a user message
5. **Interpolating all context** into a comprehensive system prompt

## New Architecture

### System Prompt + User Message Approach

The new system uses OpenAI's best practice of separating:
- **System Prompt**: Contains all instructions, context, reference tasks, curriculum info, and configuration
- **User Message**: Contains a structured JSON object with the specific task to transform

This is more effective than the previous approach of building one large user prompt.

## New Files Created

### 1. `/src/utils/reference-tasks.helper.ts`

**Purpose**: Handles random selection and formatting of reference tasks from the inspirational tasks JSON.

**Key Functions**:
- `selectRandomReferenceTasks(count: number = 6)`: Randomly selects N reference tasks
- `formatReferenceTasksForPrompt(tasks: ReferenceTask[])`: Formats tasks for prompt inclusion

**Usage**:
```typescript
import { selectRandomReferenceTasks, formatReferenceTasksForPrompt } from "./utils";

const referenceTasks = selectRandomReferenceTasks(6);
const formattedText = formatReferenceTasksForPrompt(referenceTasks);
```

### 2. `/src/utils/curriculum-mapper.helper.ts`

**Purpose**: Navigates the Hungarian math curriculum JSON to extract topic information based on curriculum path.

**Key Functions**:
- `getCurriculumTopicByPath(curriculumPath: string)`: Finds a topic in the curriculum tree
- `formatCurriculumTopicForPrompt(pathResult, selectedExampleIndex?)`: Formats topic for prompt
- `getSelectedExampleTask(pathResult, selectedExampleIndex?)`: Gets a specific example task

**Usage**:
```typescript
import { getCurriculumTopicByPath, formatCurriculumTopicForPrompt } from "./utils";

const pathResult = getCurriculumTopicByPath("math:grade_9_10:halmazok:halmaz_megadas");
if (pathResult) {
  const formattedText = formatCurriculumTopicForPrompt(pathResult, 0);
  console.log(pathResult.topic.name); // "Halmaz megadása"
}
```

### 3. `/src/utils/system-prompt-builder.helper.ts`

**Purpose**: Main orchestrator that builds the complete system prompt and user message.

**Key Functions**:
- `buildSystemPrompt(request, selectedExampleIndex?)`: Builds the full system prompt with all context
- `buildUserMessage(request, selectedExampleIndex?)`: Builds the JSON user message

**Usage**:
```typescript
import { buildSystemPrompt, buildUserMessage } from "./utils";

const systemPrompt = buildSystemPrompt(request);
const userMessage = buildUserMessage(request);

// Use with text generator
await textGenerator.generateWithSystemPrompt(systemPrompt, userMessage, options);
```

## Updated Files

### `/src/services/text-generator.service.ts`

**Added**: New method `generateWithSystemPrompt()` that accepts separate system and user prompts.

```typescript
async generateWithSystemPrompt(
  systemPrompt: string,
  userPrompt: string,
  options: TextOptions = {}
): Promise<TextResult>
```

### `/src/services/task-generator.service.ts`

**Updated**: `buildTaskPrompt()` method now returns both system prompt and user message:

```typescript
private buildTaskPrompt(
  request: TaskGeneratorRequest,
  selectedExampleIndex?: number
): { systemPrompt: string; userMessage: string }
```

**Updated**: `generateTask()` method now uses the new approach:

```typescript
const { systemPrompt, userMessage } = this.buildTaskPrompt(request);
const taskResult = await this.textGenerator.generateWithSystemPrompt(
  systemPrompt,
  userMessage,
  { temperature: 0.8, maxTokens: 2000 }
);
```

### `/src/utils/index.ts`

**Added exports**:
```typescript
export * from "./reference-tasks.helper";
export * from "./curriculum-mapper.helper";
export * from "./system-prompt-builder.helper";
```

## How It Works

### 1. System Prompt Template

The template at `/src/genai/prompts/latest/system_prompt.template.md` contains:
- Role definition and job description
- Input format explanation
- Output JSON structure requirements
- Style and structure requirements
- Placeholders like `{{LANGUAGE}}` and `{{METRIC_SYSTEM}}`

### 2. Context Enhancement

The `buildSystemPrompt()` function:
1. Loads the template
2. Replaces placeholders (`{{LANGUAGE}}`, `{{METRIC_SYSTEM}}`)
3. Adds task configuration (target audience, difficulty, etc.)
4. Adds precision settings
5. Adds custom keywords if provided
6. Extracts and formats curriculum topic information
7. Randomly selects 6 reference tasks for style guidance
8. Appends all additional context to the template

### 3. User Message (JSON Input)

The `buildUserMessage()` function creates a structured JSON object:

```json
{
  "task_config": {
    "language": "English",
    "metric_system": "imperial"
  },
  "curriculum_topic": {
    "key": "halmaz_megadas_felsorolassal",
    "name": "Halmaz megadása felsorolással",
    "short_description": "Véges halmazok elemeinek explicit felsorolása",
    "example_tasks": [
      "Add meg felsorolással a 10-nél kisebb pozitív páratlan számok halmazát!",
      "Írd fel a magyar ábécé magánhangzóinak halmazát!"
    ]
  },
  "selected_example_index": 0,
  "reference_style_tasks": [
    { "tags": "...", "title": "...", "description": "..." },
    // ... 5 more tasks
  ],
  "task_id_hint": "halmaz_megadas_felsorolassal_001"
}
```

### 4. AI Processing

The AI receives:
- **System message**: Complete instructions + all context + reference tasks + curriculum info
- **User message**: Structured JSON with the specific task to transform

This separation helps the AI better understand:
- What its role is (system prompt)
- What specific input to process (user message)

## Benefits

1. **Better Context**: All relevant information is provided in a structured way
2. **Random Reference Tasks**: Each generation uses different style references
3. **Curriculum Integration**: Direct access to Hungarian curriculum topics and example tasks
4. **Template-Based**: Easy to update the system prompt template without code changes
5. **Cleaner Separation**: System instructions vs. user input
6. **Improved Quality**: More consistent and higher-quality task generation
7. **Flexible**: Easy to add more props or context to the system prompt

## Configuration Options

The system prompt builder supports:

- **Language & Metric System**: Auto-detected from country code
- **Task Configuration**: Target group, difficulty, educational model, display template
- **Precision Settings**: Decimal places for constants, intermediate, and final answers
- **Custom Keywords**: Mandatory keywords to incorporate into stories
- **Curriculum Path**: Automatic topic extraction and example task selection
- **Reference Tasks**: Randomly selected style guidance
- **Selected Example Index**: Choose which curriculum example to transform

## Testing

The system has been successfully compiled with TypeScript. To test:

1. Start the server: `npm run dev`
2. Make a POST request to `/api/generate-task` with a standard `TaskGeneratorRequest`
3. The service will automatically:
   - Select 6 random reference tasks
   - Extract curriculum topic info
   - Build enhanced system prompt
   - Generate task with improved context

## Example Request

```json
{
  "curriculum_path": "math:grade_9_10:halmazok:halmaz_megadas:halmaz_megadas_felsorolassal",
  "country_code": "US",
  "target_group": "mixed",
  "difficulty_level": "medium",
  "educational_model": "secular",
  "number_of_images": 2,
  "display_template": "modern",
  "precision_settings": {
    "constant_precision": 2,
    "intermediate_precision": 3,
    "final_answer_precision": 2,
    "use_exact_values": false
  },
  "custom_keywords": ["technology", "space exploration"],
  "template_id": ""
}
```

## Future Enhancements

Potential improvements:
1. Add support for selecting specific reference tasks by category
2. Cache curriculum topic lookups for performance
3. Add metrics tracking for reference task effectiveness
4. Support multiple curriculum files (not just Hungarian math)
5. Add A/B testing to compare old vs. new prompt approach
6. Add validation for curriculum paths
7. Support custom system prompt templates per educational model

## Migration Notes

**Backward Compatibility**: The old prompt-building methods are still in the codebase but no longer used. The new system is a drop-in replacement that uses the same `TaskGeneratorRequest` interface.

**No Breaking Changes**: The API interface remains the same. Clients don't need any changes.

## Conclusion

This upgrade significantly improves task generation quality by:
- Providing richer context to the AI
- Using proven system prompt + user message architecture
- Incorporating random style references
- Directly integrating curriculum data
- Making the system more maintainable and extensible
