# Task Generator API Guide

Complete guide for the `/generate-task` endpoint with the new comprehensive request structure.

## Endpoint

```
POST /generate-task
```

## Request Structure

### Complete Example

```json
{
  "curriculum_path": "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
  "country_code": "US",
  "target_group": "mixed",
  "difficulty_level": "medium",
  "educational_model": "secular",
  "number_of_images": 2,
  "display_template": "modern",
  "precision_settings": {
    "constant_precision": 2,
    "intermediate_precision": 4,
    "final_answer_precision": 2,
    "use_exact_values": false
  },
  "custom_keywords": ["Renaissance", "architecture"],
  "template_id": ""
}
```

## Field Descriptions

### curriculum_path (required)
**Type:** `string`

Colon-separated navigation path to the specific curriculum topic.

**Format:** `subject:grade_level:category:subcategory:topic`

**Examples:**
```
"math:grade_9_10:algebra:linear_equations:solving_basic_equations"
"math:grade_11_12:geometry:circles:arc_length"
"math:grade_7_8:statistics:mean_median_mode"
"math:grade_5_6:fractions:multiplication_division"
```

### country_code (required)
**Type:** `string` (2 uppercase letters)

User country/locale code - determines language and unit system.

**Examples:**
- `"US"` - United States (Imperial units, American English)
- `"GB"` - United Kingdom (Imperial/Metric, British English)
- `"HU"` - Hungary (Metric, Hungarian)
- `"DE"` - Germany (Metric, German)
- `"JP"` - Japan (Metric, Japanese)

### target_group (required)
**Type:** `"boys" | "girls" | "mixed"`

Target audience gender specification for content customization.

**Options:**
- `"boys"` - Content tailored for boys
- `"girls"` - Content tailored for girls
- `"mixed"` - Gender-neutral content

### difficulty_level (required)
**Type:** `"easy" | "medium" | "hard"`

Task difficulty level.

**Options:**
- `"easy"` - Beginner level, basic concepts
- `"medium"` - Intermediate level, standard complexity
- `"hard"` - Advanced level, challenging problems

### educational_model (required)
**Type:** `enum`

Educational philosophy/approach that influences content style and values.

**Options:**
- `"secular"` - Non-religious, neutral approach
- `"conservative"` - Traditional values, classical approach
- `"traditional"` - Conventional teaching methods
- `"liberal"` - Progressive, open-minded approach
- `"progressive"` - Modern, innovative methods
- `"religious_christian"` - Christian values and examples
- `"religious_islamic"` - Islamic values and examples
- `"religious_jewish"` - Jewish values and examples
- `"montessori"` - Montessori educational philosophy
- `"waldorf"` - Waldorf/Steiner educational philosophy

### number_of_images (required)
**Type:** `0 | 1 | 2`

Number of illustration images to generate.

**Options:**
- `0` - Text-only task, no images
- `1` - Single illustration
- `2` - Two illustrations (different perspectives)

### display_template (required)
**Type:** `enum`

Display template for task layout and visual style.

**Options:**
- `"classic"` - Traditional textbook style
- `"modern"` - Contemporary, clean design
- `"comic"` - Comic book/graphic novel style
- `"minimal"` - Minimalist, text-focused
- `"illustrated"` - Rich visual storytelling

### precision_settings (required)
**Type:** `object`

Mathematical precision configuration.

#### constant_precision (required)
**Type:** `integer` (0-10)

Precision for mathematical constants like π.
- `2` → 3.14
- `4` → 3.1416
- `6` → 3.141593

#### intermediate_precision (required)
**Type:** `integer` (0-10)

Precision for intermediate calculations shown in solution steps.

#### final_answer_precision (required)
**Type:** `integer` (0-10)

Precision for the final answer.

#### use_exact_values (optional)
**Type:** `boolean` (default: `false`)

Whether to use exact values (fractions, π symbol) instead of decimals.
- `true` → Use π, √2, fractions
- `false` → Use decimal approximations

### custom_keywords (optional)
**Type:** `string[]`

Optional array of keywords for story inspiration and thematic elements.

**Examples:**
```json
["Renaissance", "architecture", "trade"]
["space", "astronomy", "exploration"]
["music", "rhythm", "harmony"]
["sports", "competition", "teamwork"]
```

### template_id (optional)
**Type:** `string`

Optional template ID if user has saved custom templates.

## Example Requests

### 1. Basic Algebra Task

```json
{
  "curriculum_path": "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
  "country_code": "US",
  "target_group": "mixed",
  "difficulty_level": "medium",
  "educational_model": "secular",
  "number_of_images": 2,
  "display_template": "modern",
  "precision_settings": {
    "constant_precision": 2,
    "intermediate_precision": 4,
    "final_answer_precision": 2,
    "use_exact_values": false
  },
  "custom_keywords": [],
  "template_id": ""
}
```

### 2. Advanced Geometry (Text Only)

```json
{
  "curriculum_path": "math:grade_11_12:geometry:circles:arc_length",
  "country_code": "GB",
  "target_group": "boys",
  "difficulty_level": "hard",
  "educational_model": "traditional",
  "number_of_images": 0,
  "display_template": "classic",
  "precision_settings": {
    "constant_precision": 4,
    "intermediate_precision": 6,
    "final_answer_precision": 3,
    "use_exact_values": true
  },
  "custom_keywords": ["architecture", "astronomy"],
  "template_id": ""
}
```

### 3. Elementary Statistics (Comic Style)

```json
{
  "curriculum_path": "math:grade_7_8:statistics:mean_median_mode",
  "country_code": "HU",
  "target_group": "girls",
  "difficulty_level": "easy",
  "educational_model": "progressive",
  "number_of_images": 2,
  "display_template": "comic",
  "precision_settings": {
    "constant_precision": 2,
    "intermediate_precision": 3,
    "final_answer_precision": 1,
    "use_exact_values": false
  },
  "custom_keywords": ["sports", "music", "friendship"],
  "template_id": ""
}
```

### 4. Religious Context (Christian)

```json
{
  "curriculum_path": "math:grade_5_6:fractions:multiplication_division",
  "country_code": "US",
  "target_group": "mixed",
  "difficulty_level": "easy",
  "educational_model": "religious_christian",
  "number_of_images": 1,
  "display_template": "illustrated",
  "precision_settings": {
    "constant_precision": 2,
    "intermediate_precision": 3,
    "final_answer_precision": 2,
    "use_exact_values": false
  },
  "custom_keywords": ["charity", "community", "service"],
  "template_id": ""
}
```

### 5. Montessori Approach

```json
{
  "curriculum_path": "math:grade_3_4:multiplication:tables",
  "country_code": "DE",
  "target_group": "mixed",
  "difficulty_level": "medium",
  "educational_model": "montessori",
  "number_of_images": 2,
  "display_template": "illustrated",
  "precision_settings": {
    "constant_precision": 2,
    "intermediate_precision": 2,
    "final_answer_precision": 0,
    "use_exact_values": false
  },
  "custom_keywords": ["nature", "hands-on", "discovery"],
  "template_id": ""
}
```

## Response Format

```json
{
  "id": "task_a1b2c3d4e5f6789012345678901234ab",
  "description": "# The Great Canal Project of 1855\n\nAs chief engineer...",
  "images": [
    {
      "id": "image_x1y2z3a4b5c6789012345678901234xy",
      "url": "/storage/tasks/task_a1b2.../images/image_x1y2....png"
    },
    {
      "id": "image_m1n2o3p4q5r6789012345678901234mn",
      "url": "/storage/tasks/task_a1b2.../images/image_m1n2....png"
    }
  ]
}
```

## cURL Examples

### Basic Request

```bash
curl -X POST http://localhost:3000/generate-task \
  -H "Content-Type: application/json" \
  -d '{
    "curriculum_path": "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
    "country_code": "US",
    "target_group": "mixed",
    "difficulty_level": "medium",
    "educational_model": "secular",
    "number_of_images": 2,
    "display_template": "modern",
    "precision_settings": {
      "constant_precision": 2,
      "intermediate_precision": 4,
      "final_answer_precision": 2,
      "use_exact_values": false
    },
    "custom_keywords": [],
    "template_id": ""
  }'
```

### With Custom Keywords

```bash
curl -X POST http://localhost:3000/generate-task \
  -H "Content-Type: application/json" \
  -d '{
    "curriculum_path": "math:grade_11_12:geometry:circles:arc_length",
    "country_code": "GB",
    "target_group": "boys",
    "difficulty_level": "hard",
    "educational_model": "traditional",
    "number_of_images": 1,
    "display_template": "classic",
    "precision_settings": {
      "constant_precision": 4,
      "intermediate_precision": 6,
      "final_answer_precision": 3,
      "use_exact_values": true
    },
    "custom_keywords": ["Renaissance", "architecture", "astronomy"],
    "template_id": ""
  }'
```

## Error Responses

### 400 Bad Request

Missing required fields or invalid values:

```json
{
  "error": "Validation Error",
  "message": "Missing required field: curriculum_path"
}
```

### 500 Internal Server Error

Server-side error during generation:

```json
{
  "error": "Generation Failed",
  "message": "OpenAI API error: Rate limit exceeded"
}
```

## Best Practices

1. **Curriculum Path**: Use consistent, hierarchical structure
2. **Country Code**: Use ISO 3166-1 alpha-2 codes
3. **Precision**: Match precision to grade level (higher grades = more precision)
4. **Keywords**: Use 2-5 relevant keywords for best results
5. **Images**: Use 0 for pure math problems, 1-2 for story-based tasks
6. **Display Template**: Match template to educational model and age group

## TypeScript Integration

```typescript
import { TaskGeneratorRequest } from './types';

const request: TaskGeneratorRequest = {
  curriculum_path: "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
  country_code: "US",
  target_group: "mixed",
  difficulty_level: "medium",
  educational_model: "secular",
  number_of_images: 2,
  display_template: "modern",
  precision_settings: {
    constant_precision: 2,
    intermediate_precision: 4,
    final_answer_precision: 2,
    use_exact_values: false
  },
  custom_keywords: ["engineering", "architecture"],
  template_id: ""
};

const response = await fetch('http://localhost:3000/generate-task', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
});

const task = await response.json();
```
