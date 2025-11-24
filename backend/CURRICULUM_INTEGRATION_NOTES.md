# Curriculum Integration - Implementation Notes

## Overview

The curriculum mapper has been successfully integrated to extract example tasks from the Hungarian math curriculum JSON file (`hu_math_grade_9_12.json`) based on the client-provided `curriculum_path`.

## JSON Structure Understanding

### File Structure

The curriculum JSON has this structure:

```json
{
  "grade_9_10": [
    {
      "key": "halmazok",
      "name": "Halmazok",
      "short_description": "...",
      "sub_topics": [
        {
          "key": "halmaz_fogalma",
          "name": "...",
          "sub_topics": [
            {
              "key": "halmaz_megadas_felsorolassal",
              "name": "...",
              "example_tasks": [
                "Task 1...",
                "Task 2...",
                // ... 5-6 or more tasks
              ]
            }
          ]
        }
      ]
    }
  ],
  "grade_11_12": [...]
}
```

### Key Points

1. **Root Level**: Object with grade keys (`grade_9_10`, `grade_11_12`)
2. **Grade Level**: Arrays of main topic objects
3. **Nested Structure**: Topics can have `sub_topics` arrays with unlimited depth
4. **Example Tasks**: Array property `example_tasks` containing 5-6+ curriculum exercises
5. **Purged File**: Has `"example_tasks (COMPLETED)"` instead of `example_tasks` (empty arrays)

## Curriculum Path Format

**Format**: `math:grade_9_10:topic1:topic2:topic3...`

**Examples**:
- `math:grade_9_10:halmazok:halmaz_fogalma:halmaz_megadas_felsorolassal`
- `math:grade_9_10:halmazok:halmazok_kozotti_viszonyok:reszhalmaz`
- `math:grade_9_10:halmazok:halmazmuveletek:unio`

**Navigation**:
1. Remove `math` prefix
2. First segment is grade level (`grade_9_10`)
3. Remaining segments navigate through `sub_topics` arrays

## Implementation Details

### Updated Files

#### `/src/utils/curriculum-mapper.helper.ts`

**Key Changes**:
1. Fixed JSON parsing to handle root object structure
2. Implemented proper tree navigation through arrays
3. Added support for both `example_tasks` and `"example_tasks (COMPLETED)"` properties
4. Made `short_description` optional in interface

**Navigation Logic**:
```typescript
// 1. Load JSON and get grade-level array
const gradeTopics = curriculumData[gradeKey]; // Array

// 2. Navigate through nested sub_topics
for each segment in path:
  currentTopics = currentTopics.find(t => t.key === segment)
  if last segment:
    return foundTopic
  else:
    currentTopics = foundTopic.sub_topics
```

**Dual Property Support**:
```typescript
// Works with both property names
const exampleTasks = topic.example_tasks || topic["example_tasks (COMPLETED)"] || [];
```

#### `/src/utils/system-prompt-builder.helper.ts`

**Updates**:
- Added logic to extract example tasks from either property name
- Ensures example tasks are always included in the JSON input
- Handles missing or empty example task arrays gracefully

### Interface Updates

```typescript
export interface CurriculumTopic {
  key: string;
  name: string;
  short_description?: string; // Made optional
  example_tasks?: string[];
  "example_tasks (COMPLETED)"?: string[]; // Added for purged file
  sub_topics?: CurriculumTopic[];
}
```

## How It Works in Practice

### 1. Client Sends Request

```json
{
  "curriculum_path": "math:grade_9_10:halmazok:halmaz_fogalma:halmaz_megadas_felsorolassal",
  "country_code": "HU",
  // ... other config
}
```

### 2. System Extracts Curriculum Data

```typescript
const pathResult = getCurriculumTopicByPath(request.curriculum_path);

// Result:
{
  topic: {
    key: "halmaz_megadas_felsorolassal",
    name: "Halmaz megadása felsorolással",
    short_description: "Véges halmazok elemeinek explicit felsorolása",
    example_tasks: [
      "Add meg felsorolással a 10-nél kisebb pozitív páratlan számok halmazát!",
      "Írd fel a magyar ábécé magánhangzóinak halmazát!",
      // ... 3 more tasks
    ]
  },
  parentTopics: [...], // Full hierarchy
  fullPath: "math:grade_9_10:halmazok:..."
}
```

### 3. System Builds Enhanced Prompt

The curriculum data is formatted into the system prompt:

```markdown
## CURRICULUM TOPIC INFORMATION

**Topic Hierarchy:**
Halmazok > Halmaz fogalma és megadása > Halmaz megadása felsorolással

**Current Topic:**
- **Key:** halmaz_megadas_felsorolassal
- **Name:** Halmaz megadása felsorolással
- **Description:** Véges halmazok elemeinek explicit felsorolása

**Example Tasks from Curriculum:**

These are traditional textbook-style problems from the Hungarian curriculum.
Your task is to transform one of these into a rich, story-driven, real-world problem.

→ **[SELECTED]** Add meg felsorolással a 10-nél kisebb pozitív páratlan számok halmazát!
2. Írd fel a magyar ábécé magánhangzóinak halmazát!
3. Legyen A := {2, 4, 6, 8}. Írd le szavakkal, milyen számok alkotják az A halmazt!
4. Igaz-e, hogy {4, 4, 4} = {4}? Indokold!
5. Igaz-e, hogy {5, 7, 9, 11} = {9, 7, 11, 5}? Mit mondhatunk a sorrendről?

**You must transform example task #1 (marked as SELECTED above) into a story-based problem.**
```

### 4. JSON Input to AI

```json
{
  "task_config": {
    "language": "Hungarian",
    "metric_system": "metric"
  },
  "curriculum_topic": {
    "key": "halmaz_megadas_felsorolassal",
    "name": "Halmaz megadása felsorolással",
    "short_description": "Véges halmazok elemeinek explicit felsorolása",
    "example_tasks": [
      "Add meg felsorolással a 10-nél kisebb pozitív páratlan számok halmazát!",
      // ... all example tasks
    ]
  },
  "selected_example_index": 0,
  "reference_style_tasks": [
    // ... 6 random reference tasks
  ],
  "task_id_hint": "halmaz_megadas_felsorolassal_001"
}
```

## Testing

### Test Results

All three test paths successfully extracted:

1. **Path**: `math:grade_9_10:halmazok:halmaz_fogalma:halmaz_megadas_felsorolassal`
   - ✅ Found: "Halmaz megadása felsorolással"
   - 5 example tasks extracted

2. **Path**: `math:grade_9_10:halmazok:halmazok_kozotti_viszonyok:reszhalmaz`
   - ✅ Found: "Részhalmaz"
   - 6 example tasks extracted

3. **Path**: `math:grade_9_10:halmazok:halmazmuveletek:unio`
   - ✅ Found: "Unió (egyesítés)"
   - 7 example tasks extracted

## Selected Example Index

The system supports selecting a specific example task:

```typescript
// In request (optional)
{
  "selected_example_index": 2  // Select the 3rd task (0-indexed)
}

// In system prompt builder
buildSystemPrompt(request, selectedExampleIndex);
buildUserMessage(request, selectedExampleIndex);
```

**Behavior**:
- If `selected_example_index` is provided and valid: uses that specific task
- If `selected_example_index` is missing or invalid: uses first task (index 0)
- The selected task is marked with `→ **[SELECTED]**` in the prompt

## File Compatibility

The system works with **both**:

1. **Original file** (`hu_math_grade_9_12.json`):
   - Property: `example_tasks`
   - Contains actual task arrays

2. **Purged file** (`hu_math_grade_9_12_purged.json`):
   - Property: `"example_tasks (COMPLETED)"`
   - Contains empty arrays
   - Currently NOT used by default

**Current configuration**: Uses the original file with actual example tasks.

## Benefits

1. **Direct Curriculum Access**: AI gets real Hungarian textbook exercises
2. **Contextual Understanding**: Full topic hierarchy provided
3. **Transformation Clarity**: AI knows exactly which exercise to transform
4. **Flexible Selection**: Can target specific example tasks
5. **Dual Property Support**: Works with both file versions
6. **Rich Context**: Combines curriculum + reference tasks + client config

## Future Enhancements

1. **Multiple Curriculum Files**: Support different subjects/grades
2. **Dynamic File Selection**: Switch between original and purged files
3. **Example Task Caching**: Cache frequently accessed topics
4. **Validation**: Add path validation before navigation
5. **Locale Support**: Different curriculum files per country
6. **Analytics**: Track which topics/examples generate best results

## Error Handling

The system gracefully handles:
- Missing curriculum files
- Invalid paths
- Missing topics
- Empty example task arrays
- Malformed JSON
- Missing properties

All errors log warnings but don't crash the application.

## Summary

The curriculum integration is now fully functional and provides:
- ✅ Accurate topic extraction from nested JSON
- ✅ All 5-6+ example tasks per topic
- ✅ Support for both property name variants
- ✅ Proper hierarchy display
- ✅ Selected task highlighting
- ✅ Seamless integration with system prompt builder
- ✅ TypeScript compilation success
- ✅ Tested and verified with real curriculum paths
