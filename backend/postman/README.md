# EduForge Task Generator API - Postman Collection

This directory contains Postman collections and environments for testing the EduForge Task Generator API.

## Files

- **EduForge-Task-Generator.postman_collection.json** - Main API collection with example requests
- **EduForge-Local.postman_environment.json** - Local development environment
- **EduForge-Production.postman_environment.json** - Production environment

## Quick Start

### 1. Import to Postman

1. Open Postman
2. Click **Import** button (top left)
3. Select all three JSON files from this directory
4. Click **Import**

### 2. Select Environment

- For local development: Select **EduForge - Local Development** from the environment dropdown (top right)
- For production: Select **EduForge - Production** and update the `api_key` variable

### 3. Start Your Server

Make sure your backend server is running:

```bash
npm run dev
# Server should be running on http://localhost:3000
```

### 4. Test the API

Select any request from the collection and click **Send**!

## Available Requests

### Task Generation Requests

The collection includes 8 pre-configured task generation examples:

1. **Generate Hungarian Task (Liberal, Metric)**
   - Country: Hungary
   - Language: Hungarian
   - System: Metric (km, kg, etc.)
   - Educational Model: Liberal
   - Difficulty: Medium
   - Storage: `storage/hu/math/grade_9_10/algebra/linear_equations/solving_basic_equations/`

2. **Generate US Task (Secular, Imperial)**
   - Country: USA
   - Language: English
   - System: Imperial (miles, pounds, etc.)
   - Educational Model: Secular
   - Difficulty: Hard
   - Storage: `storage/us/math/grade_9_10/algebra/linear_equations/solving_basic_equations/`

3. **Generate German Task (Traditional, Metric)**
   - Country: Germany
   - Language: German
   - Topic: Pythagorean Theorem
   - Educational Model: Traditional
   - Difficulty: Easy
   - Storage: `storage/de/math/grade_7_8/geometry/triangles/pythagorean_theorem/`

4. **Generate French Task (Progressive, Metric)**
   - Country: France
   - Language: French
   - Topic: Calculus Derivatives
   - Educational Model: Progressive
   - Difficulty: Hard
   - No images
   - Storage: `storage/fr/math/grade_11_12/calculus/derivatives/basic_rules/`

5. **Generate Spanish Task (Conservative, Metric)**
   - Country: Spain
   - Language: Spanish
   - Topic: Fractions
   - Educational Model: Conservative
   - Difficulty: Easy
   - Storage: `storage/es/math/grade_5_6/arithmetic/fractions/addition_subtraction/`

6. **Generate UK Task (Montessori, Metric)**
   - Country: United Kingdom
   - Language: English (British)
   - Topic: Multiplication Tables
   - Educational Model: Montessori
   - Difficulty: Medium
   - Storage: `storage/gb/math/grade_3_4/multiplication/tables/advanced/`

7. **Generate Italian Task (Religious Christian, Metric)**
   - Country: Italy
   - Language: Italian
   - Topic: Statistics & Probability
   - Educational Model: Religious (Christian)
   - Difficulty: Medium
   - Storage: `storage/it/math/grade_8_9/statistics/probability/basic_concepts/`

8. **Generate Canadian Task (Waldorf, Metric)**
   - Country: Canada
   - Language: English
   - Topic: Ratios & Proportions
   - Educational Model: Waldorf
   - Difficulty: Medium
   - Storage: `storage/ca/math/grade_6_7/ratios/proportions/word_problems/`

## Request Parameters

### Required Fields

```json
{
  "curriculum_path": "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
  "country_code": "HU",
  "target_group": "mixed",
  "difficulty_level": "medium",
  "educational_model": "liberal",
  "number_of_images": 1,
  "display_template": "modern",
  "precision_settings": {
    "constant_precision": 2,
    "intermediate_precision": 3,
    "final_answer_precision": 2,
    "use_exact_values": false
  },
  "custom_keywords": ["sports", "competition"],
  "template_id": ""
}
```

### Parameter Options

**country_code**: ISO 3166-1 alpha-2 codes
- `HU` - Hungary (Metric, Hungarian)
- `US` - United States (Imperial, English)
- `GB` - United Kingdom (Metric, English)
- `DE` - Germany (Metric, German)
- `FR` - France (Metric, French)
- `ES` - Spain (Metric, Spanish)
- `IT` - Italy (Metric, Italian)
- `CA` - Canada (Metric, English)
- And many more...

**target_group**:
- `mixed` - Mixed gender group
- `boys` - Boys only
- `girls` - Girls only

**difficulty_level**:
- `easy` - Basic concepts
- `medium` - Intermediate level
- `hard` - Advanced level

**educational_model**:
- `secular` - Secular education
- `liberal` - Liberal approach
- `conservative` - Conservative approach
- `traditional` - Traditional methods
- `progressive` - Progressive education
- `religious_christian` - Christian values
- `religious_islamic` - Islamic values
- `religious_jewish` - Jewish values
- `montessori` - Montessori method
- `waldorf` - Waldorf education

**number_of_images**: `0`, `1`, or `2`

**display_template**:
- `classic` - Classic layout
- `modern` - Modern design
- `comic` - Comic style
- `minimal` - Minimalist design
- `illustrated` - Heavily illustrated

## Response Format

### Successful Response (201 Created)

```json
{
  "taskId": "task_abc123xyz",
  "storagePath": "storage/hu/math/grade_9_10/algebra/linear_equations/solving_basic_equations",
  "generatedTask": {
    "title": "A Futóverseny Időeredményei",
    "story_chunks": [
      "Egy városi futóversenyen három különböző távon indultak versenyzők...",
      "A szervezők szeretnék kiszámolni..."
    ],
    "story_text": "Egy városi futóversenyen három különböző távon indultak versenyzők...\n\nA szervezők szeretnék kiszámolni...",
    "questions": [
      "Mekkora a különbség a leggyorsabb és a leglassabb versenyző átlagsebessége között?"
    ],
    "expected_answer_formats": [
      "Szám km/h-ban, 2 tizedesjegyre kerekítve"
    ],
    "solution_steps": [
      {
        "step_number": 1,
        "title": "Adatok azonosítása",
        "description": "...",
        "formula": "v = \\frac{s}{t}",
        "calculation": "...",
        "result": "...",
        "explanation": "..."
      }
    ],
    "final_answer": "A különbség 5,25 km/h",
    "verification": "...",
    "common_mistakes": ["..."],
    "key_concepts": ["linear equations", "speed calculations"],
    "images": [
      {
        "image_id": "image_001",
        "url": "/storage/hu/math/.../images/task_abc123xyz/image_001.png",
        "type": "main",
        "aspect_ratio": "1:1"
      }
    ],
    "metadata": {
      "curriculum_path": "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
      "target_group": "mixed",
      "difficulty_level": "medium",
      "educational_model": "liberal",
      "country_code": "HU",
      "tags": ["sports", "competition"]
    },
    "is_editable": true,
    "created_at": "2025-01-23T10:30:00.000Z"
  }
}
```

## Storage Structure

Tasks are stored in a curriculum-based directory structure:

```
storage/
├── {country_code}/              # e.g., "hu", "us", "de"
│   └── {curriculum_path}/       # e.g., "math/grade_9_10/algebra/..."
│       ├── tasks.json           # List of all tasks in this location
│       ├── task_abc123.json     # Individual task data
│       ├── task_def456.json     # Another task
│       └── images/
│           ├── task_abc123/
│           │   └── image_001.png
│           └── task_def456/
│               └── image_002.png
```

### Example Storage Paths

- Hungarian algebra: `storage/hu/math/grade_9_10/algebra/linear_equations/solving_basic_equations/`
- US geometry: `storage/us/math/grade_7_8/geometry/triangles/pythagorean_theorem/`
- German calculus: `storage/de/math/grade_11_12/calculus/derivatives/basic_rules/`

**Note:** Educational model (liberal, secular, traditional, etc.) is stored as metadata within each task's JSON file, not in the directory path. This allows tasks with different educational models for the same curriculum topic to be stored together.

## Tips

### Using Variables

The collection uses Postman variables for flexibility:

- `{{base_url}}` - Base API URL (configured in environment)
- Save response data to variables for later use:
  ```javascript
  // In Tests tab of a request
  pm.environment.set("generated_task_id", pm.response.json().taskId);
  pm.environment.set("storage_path", pm.response.json().storagePath);
  ```

### Viewing Generated Files

After generating a task, check your backend's storage directory:

```bash
cd /path/to/backend
ls -la storage/hu/math/grade_9_10/algebra/linear_equations/solving_basic_equations/

# You should see:
# - tasks.json (collection index)
# - task_<id>.json (full task data)
# - images/task_<id>/*.png (task images)
```

### Testing Different Scenarios

Try modifying the requests to test:
- Different countries and languages
- Various difficulty levels
- Different number of images (0, 1, 2)
- Various educational models
- Custom keywords for story themes

## Troubleshooting

### Server Not Running
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution**: Make sure your backend server is running with `npm run dev`

### Missing OpenAI API Key
```
Error: OpenAI API key not configured
```
**Solution**: Add `OPENAI_API_KEY` to your `.env` file in the backend directory

### Task Generation Timeout
If task generation takes too long, it might be due to:
- AI API rate limits
- Slow network connection
- Large image generation (2 images take longer)

**Solution**: Try generating with fewer images or wait and retry

## Need Help?

- Check the backend logs for detailed error messages
- Verify your `.env` file has all required variables
- Make sure all npm dependencies are installed: `npm install`
- Check that the `storage` directory has write permissions

## Future Endpoints (Placeholder)

The collection includes placeholder requests for future functionality:
- `GET /tasks/:taskId` - Retrieve a specific task
- `GET /tasks` - List all tasks for a curriculum location

These will be implemented in future versions.
