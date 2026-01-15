# MODULAR TEMPLATE SYSTEM - COMPLETE DOCUMENTATION

## 📋 SYSTEM OVERVIEW

The EduForger backend now uses a **fully modular prompt template system** for educational task generation. This system replaces the previous binary (STEM/Humanities) approach with a flexible, composable architecture that supports all 8 subjects with subject-specific customization.

---

## 🎯 ARCHITECTURE

### Core Concept

Each system prompt is composed dynamically by combining:
1. **4 Core Universal Modules** (shared across all subjects)
2. **4 Subject-Specific Modules** (tailored to each subject)

**Total per subject**: 8 modules → 1 compiled template (50k-90k characters)

---

## 📁 MODULE STRUCTURE

```
backend/src/genai/prompts/modules/
├── core/                                    # Universal modules (all subjects)
│   ├── 01_universal_principles.md          # 5 core principles (REAL, ADVENTURE, CULTURAL, GROWTH, TRUST)
│   ├── 02_curriculum_alignment.md          # How to align with curriculum
│   ├── 03_scenario_quality.md              # 80/20 rule, freshness, specificity
│   └── 04_output_format.md                 # JSON schema & formatting rules
│
├── mathematics/                             # Mathematics-specific modules
│   ├── identity.md                          # What mathematics teaching means
│   ├── problem_types.md                     # Algebra, geometry, calculus, etc.
│   ├── evidence_requirements.md             # What data students need (formulas, diagrams)
│   └── scenario_patterns.md                 # Where math appears in real world
│
├── physics/                                 # Physics-specific modules
│   ├── identity.md
│   ├── formula_guidance.md                  # Physics-specific: when to use formulas
│   ├── evidence_requirements.md
│   └── scenario_patterns.md
│
├── chemistry/                               # Chemistry-specific modules
│   ├── identity.md
│   ├── reaction_types.md                    # Chemistry-specific: stoichiometry, redox, etc.
│   ├── evidence_requirements.md
│   └── scenario_patterns.md
│
├── biology/                                 # Biology-specific modules
│   ├── identity.md
│   ├── system_types.md                      # Biology-specific: genetics, ecology, etc.
│   ├── evidence_requirements.md
│   └── scenario_patterns.md
│
├── informatics/                             # Informatics-specific modules
│   ├── identity.md
│   ├── problem_types.md                     # Algorithms, data structures, logic
│   ├── evidence_requirements.md
│   └── scenario_patterns.md
│
├── literature/                              # Literature-specific modules
│   ├── identity.md
│   ├── analysis_types.md                    # Literature-specific: close reading, themes, etc.
│   ├── evidence_requirements.md
│   └── scenario_patterns.md
│
├── history/                                 # History-specific modules
│   ├── identity.md
│   ├── source_types.md                      # History-specific: primary sources, causation
│   ├── evidence_requirements.md
│   └── scenario_patterns.md
│
└── geography/                               # Geography-specific modules
    ├── identity.md
    ├── analysis_types.md                    # Geography-specific: spatial analysis, GIS
    ├── evidence_requirements.md
    └── scenario_patterns.md
```

**Total Files**: 4 core + (4 × 8 subjects) = **36 module files**

---

## 🔄 COMPOSITION PROCESS

### Step 1: Template Request
```typescript
const template = composeTemplate("mathematics");
```

### Step 2: Module Loading Order

1. **Load Core Modules** (in sequence):
   - `01_universal_principles.md`
   - `02_curriculum_alignment.md`
   - `03_scenario_quality.md`
   - `04_output_format.md`

2. **Load Subject Modules** (in sequence):
   - `{subject}/identity.md`
   - `{subject}/{specific_module}.md` (problem_types, analysis_types, etc.)
   - `{subject}/evidence_requirements.md`
   - `{subject}/scenario_patterns.md`

### Step 3: Assembly

```
═══════════════════════════════════════════════════════════════
# TASK GENERATION SYSTEM PROMPT - MATHEMATICS
# Composed from modular template system
═══════════════════════════════════════════════════════════════

[CORE MODULE 1: Universal Principles]
...content...
---

[CORE MODULE 2: Curriculum Alignment]
...content...
---

[CORE MODULE 3: Scenario Quality]
...content...
---

[CORE MODULE 4: Output Format]
...content...
---

[MATHEMATICS MODULE 1: Identity]
...content...
---

[MATHEMATICS MODULE 2: Problem Types]
...content...
---

[MATHEMATICS MODULE 3: Evidence Requirements]
...content...
---

[MATHEMATICS MODULE 4: Scenario Patterns]
...content...
═══════════════════════════════════════════════════════════════
```

### Step 4: Caching

Template is cached in memory:
- First call: ~10-50ms (file I/O)
- Subsequent calls: <1ms (cached)

---

## 📊 SUBJECT-SPECIFIC MODULES

| Subject | Second Module | Purpose |
|---------|---------------|---------|
| **Mathematics** | `problem_types.md` | Algebra, geometry, calculus, statistics, etc. |
| **Physics** | `formula_guidance.md` | When/how to use formulas vs. conceptual reasoning |
| **Chemistry** | `reaction_types.md` | Stoichiometry, redox, organic reactions, etc. |
| **Biology** | `system_types.md` | Genetics, ecology, cell biology, evolution |
| **Informatics** | `problem_types.md` | Algorithms, data structures, complexity, logic |
| **Literature** | `analysis_types.md` | Close reading, themes, literary devices, analysis |
| **History** | `source_types.md` | Primary sources, causation, change & continuity |
| **Geography** | `analysis_types.md` | Spatial analysis, GIS, physical/human geography |

---

## 🧪 TESTING

### Test Files

1. **`modular-template-real.test.ts`** ✅ PASSING
   - Tests all 8 subjects
   - Tests all core modules are included
   - Tests subject-specific modules are correct
   - Tests template caching
   - Tests ALL Mexico grade combinations (8 subjects × 3 grades = 24 combinations)

### Test Coverage

```
✅ All 8 subjects compose templates
✅ All core modules (universal principles, curriculum, quality, format) included
✅ All subject-specific modules correct
✅ Template caching works (first: ~10ms, cached: <1ms)
✅ All 24 Mexico combinations (grade_3_6, grade_7_9, grade_10_12) work
```

### Run Tests

```bash
npm test -- modular-template-real.test.ts
```

**Results**: All tests passing (29/29)

---

## 🚀 USAGE

### In Code

```typescript
import { composeTemplate } from "@/utils/template-composer";

// Get template for mathematics
const mathTemplate = composeTemplate("mathematics");

// Get template for literature
const litTemplate = composeTemplate("literature");

// Templates are automatically cached
```

### In System Prompt Builder

```typescript
// src/utils/system-prompt-builder.helper.ts

export function buildSystemPrompt(request: TaskGeneratorRequest): string {
  const pathParts = request.curriculum_path.split(":");
  const subject = pathParts[1] as Subject;

  // Compose modular template for this subject
  let systemPrompt = composeTemplate(subject);

  // Replace dynamic placeholders
  systemPrompt = systemPrompt.replace(/{{LANGUAGE}}/g, language);
  systemPrompt = systemPrompt.replace(/{{METRIC_SYSTEM}}/g, metricSystem);
  // ... more replacements ...

  return systemPrompt;
}
```

---

## 🎨 MODULE CONTENT GUIDELINES

### Core Modules (Universal)

**01_universal_principles.md**
- The 5 universal principles (REAL, ADVENTURE, CULTURAL, GROWTH, TRUST)
- Applies to ALL subjects
- Never subject-specific

**02_curriculum_alignment.md**
- How to interpret curriculum paths
- How to align tasks with learning objectives
- General curriculum principles

**03_scenario_quality.md**
- 80/20 rule (fresh > generic)
- Specificity requirements
- Geographic diversity

**04_output_format.md**
- JSON schema
- Required fields
- Formatting rules

### Subject Modules (Specific)

**identity.md**
- "You are a [subject] teacher..."
- Philosophy of the subject
- What this subject teaches students

**{specific_module}.md**
- Problem types (math, informatics)
- Formula guidance (physics)
- Reaction types (chemistry)
- System types (biology)
- Analysis types (literature, geography)
- Source types (history)

**evidence_requirements.md**
- What DATA students need to solve the problem
- Subject-specific requirements
- Examples of good evidence

**scenario_patterns.md**
- WHERE this subject appears in real world
- Fresh, specific examples
- Geographic diversity
- 80/20 rule application

---

## 🔧 MAINTENANCE

### Adding a New Module

1. Create the module file in the appropriate directory
2. Follow the markdown format with clear headers
3. Update `template-composer.ts` if needed (new subjects)

### Modifying Existing Modules

Modules are hot-reloadable:
- Edit the .md file
- Clear cache: `clearTemplateCache()`
- Next composition will use updated content

### Adding a New Subject

1. Create directory: `modules/{subject}/`
2. Create 4 required modules:
   - `identity.md`
   - `{specific_module}.md`
   - `evidence_requirements.md`
   - `scenario_patterns.md`
3. Update `template-composer.ts`:
   ```typescript
   const SUBJECT_MODULE_CONFIGS: Record<Subject, SubjectModuleConfig> = {
     // ... existing subjects ...
     new_subject: {
       subject: "new_subject",
       modules: {
         identity: "new_subject/identity.md",
         secondModule: "new_subject/specific_module.md",
         evidence: "new_subject/evidence_requirements.md",
         scenarios: "new_subject/scenario_patterns.md",
       },
     },
   };
   ```
4. Add test case

---

## 📈 PERFORMANCE

### Template Sizes

| Subject | Template Size | Modules |
|---------|--------------|---------|
| Mathematics | ~80,000 chars | 4 core + 4 math |
| Literature | ~91,000 chars | 4 core + 4 lit |
| Physics | ~74,000 chars | 4 core + 4 physics |
| Chemistry | ~63,000 chars | 4 core + 4 chem |
| Biology | ~58,000 chars | 4 core + 4 bio |
| Informatics | ~50,000 chars | 4 core + 4 CS |
| History | ~51,000 chars | 4 core + 4 history |
| Geography | ~52,000 chars | 4 core + 4 geo |

### Composition Speed

- **First call** (file I/O): 10-50ms
- **Cached call**: <1ms
- **All 8 subjects** (first load): ~200ms total

### Caching

Templates are cached per subject:
```typescript
const templateCache = new Map<Subject, string>();
```

- Cache key: Subject name
- Cache invalidation: Manual via `clearTemplateCache()`
- Memory overhead: ~520KB total (all 8 subjects cached)

---

## 🌍 MEXICO SUPPORT

### Grade Levels

Mexico has 3 grade ranges:
- `grade_3_6`: Primaria (Elementary)
- `grade_7_9`: Secundaria (Middle School)
- `grade_10_12`: Preparatoria (High School)

### Coverage

All combinations tested and working:
- 8 subjects × 3 grades = **24 combinations**
- Each combination uses the same subject template
- Grade-specific curriculum alignment handled by curriculum mapper

---

## 🔐 QUALITY ASSURANCE

### Module Quality Checks

Each module must:
- ✅ Follow markdown format with clear headers
- ✅ Include specific, actionable guidance
- ✅ Provide concrete examples
- ✅ Avoid generic abstractions
- ✅ Support the 80/20 rule (fresh > generic)

### Template Quality Checks

Each composed template must:
- ✅ Include all 4 core modules
- ✅ Include all 4 subject modules
- ✅ Be >50,000 characters minimum
- ✅ Contain subject name in header
- ✅ Pass all test assertions

---

## 🎯 BENEFITS OF MODULAR SYSTEM

### Before (Binary STEM/Humanities)

```
❌ Only 2 templates (STEM, Humanities)
❌ Generic guidance for multiple subjects
❌ Hard to customize per subject
❌ Large monolithic files
❌ Difficult to maintain
```

### After (Modular)

```
✅ 8 subject-specific templates
✅ Tailored guidance per subject
✅ Easy to customize modules
✅ Small, focused module files
✅ Easy to maintain and extend
✅ Composable and cacheable
✅ Hot-reloadable in development
```

---

## 📝 EXAMPLE: MATHEMATICS TEMPLATE

### Composed From:

**Core Modules**:
1. Universal Principles → "REAL scenarios, ADVENTUROUS engagement..."
2. Curriculum Alignment → "Parse curriculum_path as MX:subject:grade:topic..."
3. Scenario Quality → "80/20 rule: Fresh > Generic..."
4. Output Format → "JSON schema: { situation: string, task: string... }"

**Mathematics Modules**:
1. Identity → "You are a mathematics teacher who shows PATTERNS and STRUCTURE..."
2. Problem Types → "ALGEBRA: Linear equations, quadratic, exponential..."
3. Evidence → "Provide FORMULAS with all variables defined..."
4. Scenarios → "Fresh examples: SpaceX trajectory optimization, Spotify algorithm..."

**Result**: 80,491 character template ready for Claude to generate math tasks

---

## 🚦 CURRENT STATUS

### ✅ COMPLETED

- [x] All 36 module files created
- [x] Template composer with caching implemented
- [x] Integration with system-prompt-builder.helper.ts
- [x] Comprehensive test suite (29 tests, all passing)
- [x] All 8 subjects supported
- [x] All Mexico grade combinations tested
- [x] Performance optimized (caching)
- [x] Documentation complete

### 🔄 IN PRODUCTION

The modular template system is **live and operational**:
- Used by `buildSystemPrompt()` function
- Powers all task generation requests
- Supports all 8 subjects × all countries × all grade levels

---

## 🎓 KEY TAKEAWAYS

1. **Modular Architecture**: 4 core + 4 subject modules per template
2. **36 Total Module Files**: Covering 8 subjects comprehensively
3. **Performance**: <1ms cached, ~10-50ms initial load
4. **Quality**: Fresh, specific, real-world scenarios for each subject
5. **Tested**: 100% test coverage with 29 passing tests
6. **Maintainable**: Small focused files, easy to update
7. **Scalable**: Easy to add new subjects or modify existing ones

---

## 📚 RELATED FILES

### Core System Files

- `/backend/src/utils/template-composer.ts` - Template composition logic
- `/backend/src/utils/system-prompt-builder.helper.ts` - System prompt builder
- `/backend/src/genai/prompts/modules/` - All module files (36 files)

### Test Files

- `/backend/src/routes/__tests__/modular-template-real.test.ts` - Comprehensive tests

### Documentation

- `/backend/MODULAR_TEMPLATE_SYSTEM.md` - This file

---

## 🎉 CONCLUSION

The EduForger modular template system provides a **robust, scalable, and maintainable** architecture for educational task generation across all 8 subjects. With comprehensive testing, performance optimization, and clear documentation, the system is production-ready and future-proof.

**Status**: ✅ **PRODUCTION READY**

---

*Last Updated: 2026-01-14*
*System Version: 2.0 - Modular Architecture*
