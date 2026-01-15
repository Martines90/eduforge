# Modular Template Architecture Design

## Problem Statement

The current binary STEM/Humanities template approach doesn't scale:
- Mathematics tasks need different structure than Physics tasks
- Literature analysis is fundamentally different from History source analysis
- Chemistry labs need different scenarios than Biology diagrams
- No flexibility for new subjects or evolving pedagogical needs

## Proposed Solution: Modular Template Composition

### Architecture Overview

```
Template System
├── Core Components (Shared)
│   ├── identity.md (Who is the immortal teacher?)
│   ├── curriculum_alignment.md (Mandatory alignment rules)
│   ├── scenario_quality.md (Anti-cliché, realism checks)
│   ├── output_format.md (JSON structure, character limits)
│   └── verification_checklist.md (Final validation steps)
│
├── Subject-Specific Modules
│   ├── mathematics/
│   │   ├── identity_override.md (Math-specific teacher persona)
│   │   ├── problem_types.md (Equation, geometry, probability, etc.)
│   │   ├── scenario_patterns.md (Real-world math applications)
│   │   └── question_structure.md (How to ask for solutions)
│   │
│   ├── physics/
│   │   ├── identity_override.md (Physics-specific persona)
│   │   ├── formula_guidance.md (E=mc², F=ma, etc.)
│   │   ├── units_and_precision.md (SI units, significant figures)
│   │   └── scenario_patterns.md (Experiments, real-world physics)
│   │
│   ├── chemistry/
│   │   ├── identity_override.md (Chemistry-specific persona)
│   │   ├── reaction_types.md (Balancing, stoichiometry, etc.)
│   │   ├── lab_safety.md (Safe experimental contexts)
│   │   └── scenario_patterns.md (Lab work, industrial chemistry)
│   │
│   ├── biology/
│   │   ├── identity_override.md (Biology-specific persona)
│   │   ├── system_types.md (Cells, ecology, evolution, etc.)
│   │   ├── diagram_guidance.md (How to describe biological structures)
│   │   └── scenario_patterns.md (Field work, medical contexts)
│   │
│   ├── informatics/
│   │   ├── identity_override.md (CS-specific persona)
│   │   ├── code_structure.md (Algorithms, pseudocode, syntax)
│   │   ├── problem_types.md (Logic, data structures, etc.)
│   │   └── scenario_patterns.md (Software dev, debugging, optimization)
│   │
│   ├── literature/
│   │   ├── identity_override.md (Literary scholar persona)
│   │   ├── analysis_types.md (Character, theme, symbolism, etc.)
│   │   ├── evidence_requirements.md (MUST provide text excerpts)
│   │   └── scenario_patterns.md (Scholarly, curatorial contexts)
│   │
│   ├── history/
│   │   ├── identity_override.md (Historian persona)
│   │   ├── source_types.md (Primary vs secondary, reliability)
│   │   ├── evidence_requirements.md (MUST provide documents)
│   │   └── scenario_patterns.md (Research, policy, museum contexts)
│   │
│   └── geography/
│       ├── identity_override.md (Geographer persona)
│       ├── analysis_types.md (Spatial, demographic, environmental)
│       ├── data_requirements.md (Maps, statistics, descriptions)
│       └── scenario_patterns.md (Planning, research, field work)
│
└── Template Builder Logic
    ├── template-composer.ts (Combines modules into final prompt)
    ├── subject-config.ts (Subject-specific settings)
    └── template-cache.ts (Performance optimization)
```

## Implementation Strategy

### Phase 1: Extract Common Components

**Goal**: Identify what's truly universal across all subjects

**Core Components to Extract:**
1. **Curriculum Alignment Rules** (same for all)
   - "Task MUST address specified topic"
   - Verification checklist
   - Anti-mismatch warnings

2. **Output Format Specifications** (same for all)
   - JSON structure
   - Character length requirements
   - Language/measurement system placeholders

3. **Scenario Quality Standards** (same for all)
   - Anti-cliché 80/20 rule
   - Realism verification
   - Second-person narration requirement

4. **Final Verification Checklist** (same for all)
   - Curriculum alignment check
   - Difficulty calibration check
   - Format validation check

### Phase 2: Create Subject-Specific Modules

**Each subject gets:**

1. **Identity Module** - Who is teaching this subject?
   ```markdown
   # Mathematics Identity
   You are an immortal mathematics teacher who has:
   - Calculated alongside Euclid, Pythagoras, and Gauss
   - Applied mathematical thinking to solve real problems throughout history
   - Witnessed how mathematics shapes engineering, economics, science...
   ```

2. **Problem Structure Module** - What kinds of tasks exist?
   ```markdown
   # Mathematics Problem Types
   - Equation solving (linear, quadratic, systems)
   - Geometric calculations (area, volume, angles)
   - Probability and statistics
   - Function analysis
   - Proof construction
   ```

3. **Evidence Requirements Module** - What must be provided?
   ```markdown
   # Mathematics Evidence
   - Numerical data for calculations
   - Geometric diagrams with measurements
   - Statistical datasets
   - Function definitions with domains
   ```

4. **Scenario Patterns Module** - What contexts make sense?
   ```markdown
   # Mathematics Scenarios
   - Engineering challenges (bridge design, structural analysis)
   - Financial decisions (investment, loan calculations)
   - Scientific research (data analysis, modeling)
   - Optimization problems (efficiency, resource allocation)
   ```

### Phase 3: Template Composition System

**Dynamic Template Builder:**

```typescript
interface SubjectTemplateConfig {
  subject: Subject;

  // Core modules (always included)
  useCoreModules: boolean;

  // Subject-specific modules
  identityModule?: string;  // Custom teacher persona
  problemTypesModule?: string;  // What kinds of tasks
  evidenceModule?: string;  // What to provide
  scenarioModule?: string;  // Context patterns

  // Optional enhancements
  includeScenarioLibrary?: boolean;
  includeAntiClicheRules?: boolean;
  includeDifficultyGuidance?: boolean;

  // Subject-specific overrides
  characterLengthOverride?: { min: number; max: number };
  customValidationRules?: string[];
}

const SUBJECT_CONFIGS: Record<Subject, SubjectTemplateConfig> = {
  mathematics: {
    subject: "mathematics",
    useCoreModules: true,
    identityModule: "mathematics/identity_override.md",
    problemTypesModule: "mathematics/problem_types.md",
    evidenceModule: "mathematics/evidence_requirements.md",
    scenarioModule: "mathematics/scenario_patterns.md",
    includeScenarioLibrary: true,
    includeAntiClicheRules: true,
  },

  literature: {
    subject: "literature",
    useCoreModules: true,
    identityModule: "literature/identity_override.md",
    problemTypesModule: "literature/analysis_types.md",
    evidenceModule: "literature/evidence_requirements.md",
    scenarioModule: "literature/scenario_patterns.md",
    includeScenarioLibrary: false, // Different inspiration needed
    includeAntiClicheRules: true,
    customValidationRules: [
      "MUST provide text excerpts in full",
      "NO visual analysis for literary topics",
      "Questions must require textual evidence"
    ],
  },

  // ... other subjects
};

function buildTemplateForSubject(subject: Subject): string {
  const config = SUBJECT_CONFIGS[subject];

  let template = "";

  // 1. Add core modules (universal rules)
  if (config.useCoreModules) {
    template += loadModule("core/curriculum_alignment.md");
    template += loadModule("core/scenario_quality.md");
    template += loadModule("core/output_format.md");
  }

  // 2. Add subject-specific identity
  if (config.identityModule) {
    template += loadModule(config.identityModule);
  }

  // 3. Add problem structure guidance
  if (config.problemTypesModule) {
    template += loadModule(config.problemTypesModule);
  }

  // 4. Add evidence requirements
  if (config.evidenceModule) {
    template += loadModule(config.evidenceModule);
  }

  // 5. Add scenario patterns
  if (config.scenarioModule) {
    template += loadModule(config.scenarioModule);
  }

  // 6. Add optional libraries
  if (config.includeScenarioLibrary) {
    template += loadModule("libraries/scenario_inspiration.md");
  }

  // 7. Add final verification
  template += loadModule("core/verification_checklist.md");

  // 8. Apply subject-specific overrides
  if (config.customValidationRules) {
    template += "\n\n## SUBJECT-SPECIFIC VALIDATION RULES\n\n";
    config.customValidationRules.forEach(rule => {
      template += `- ${rule}\n`;
    });
  }

  return template;
}
```

## Benefits of Modular Approach

### 1. **Scalability**
- Adding a new subject = creating 4-5 small modules, not a massive template
- Easy to iterate on specific aspects without breaking others

### 2. **Maintainability**
- Core rules updated once, apply to all subjects
- Subject experts can focus on their domain modules
- Clear separation of concerns

### 3. **Flexibility**
- Can mix and match modules for hybrid subjects
- Easy to experiment with different approaches
- Subject-specific customization without duplication

### 4. **Quality Control**
- Easier to review small, focused modules
- Subject matter experts can validate their specific modules
- Shared core ensures consistency

### 5. **Performance**
- Can cache compiled templates per subject
- Only rebuild when modules change
- Faster than rebuilding monolithic templates

## Migration Path

### Step 1: Extract Core Components (Week 1)
- Identify truly universal rules
- Extract to separate markdown files
- Test that assembly produces same output

### Step 2: Create Subject Modules (Week 2-3)
- Start with 3 most different subjects (Math, Literature, Chemistry)
- Create identity, problem types, evidence, scenario modules
- Validate against existing good examples

### Step 3: Build Composition System (Week 3)
- Implement `template-composer.ts`
- Add caching for performance
- Update `system-prompt-builder.helper.ts` to use composer

### Step 4: Migrate Remaining Subjects (Week 4)
- Physics, Biology, Informatics
- History, Geography
- Validate each produces appropriate tasks

### Step 5: Cleanup and Documentation (Week 5)
- Remove old monolithic templates
- Document module creation process
- Create subject module authoring guide

## Example Module Structure

### Core Module: `core/curriculum_alignment.md`
```markdown
# CRITICAL REQUIREMENT: CURRICULUM ALIGNMENT

**THE MOST IMPORTANT RULE:** Your task MUST directly address the specific
curriculum topic provided in the JSON input.

🚨 CURRICULUM ALIGNMENT CHECK:
- Read curriculum_topic.name carefully
- Read curriculum_topic.short_description
- Read ALL curriculum_topic.example_tasks
- Identify what this topic requires
- Ensure your task addresses THIS topic, not a different one

**If you create a task about a different topic, you have FAILED.**
```

### Subject Module: `mathematics/problem_types.md`
```markdown
# Mathematics Problem Types

Based on the curriculum topic, identify which type of problem to create:

## 1. Equation Solving
- Linear equations: ax + b = c
- Quadratic equations: ax² + bx + c = 0
- Systems of equations
- **Provide**: All coefficients, constants
- **Ask for**: Solution values, verification

## 2. Geometric Calculations
- Area and perimeter
- Volume and surface area
- Angle relationships
- **Provide**: All measurements, diagrams
- **Ask for**: Calculated values, proofs

## 3. Function Analysis
- Domain and range
- Graphing and transformations
- Rates of change
- **Provide**: Function definitions, constraints
- **Ask for**: Analysis, evaluation

[... etc for other problem types]
```

### Subject Module: `literature/evidence_requirements.md`
```markdown
# Literature Evidence Requirements

**CRITICAL: Students MUST analyze PRIMARY TEXTUAL SOURCES you provide.**

## What You MUST Provide

### For Character Analysis:
✅ REQUIRED:
- 3-5 direct quotations from the text
- Context for each quote (act/scene, speaker, situation)
- Sufficient length to allow meaningful analysis

❌ FORBIDDEN:
- Just describing what the character does
- Asking students to analyze passages you didn't provide
- Assuming students have the full text memorized

### For Theme Analysis:
✅ REQUIRED:
- Multiple excerpts showing theme development
- Passages from different parts of the work
- Contextual information for each

[... etc for other analysis types]

## Validation Rules

Before submitting, verify:
1. Have I provided ALL text excerpts students need to analyze?
2. Are excerpts long enough for substantive analysis (3-5 sentences minimum)?
3. Did I include contextual information for each excerpt?
4. Are my questions answerable using ONLY the provided evidence?

**If you answered NO to any question, STOP and revise.**
```

## Conclusion

The modular approach provides:
- **Better quality** through subject-specific expertise
- **Easier maintenance** through clear module boundaries
- **Greater flexibility** for customization and experimentation
- **Faster development** of new subjects
- **Consistent core** standards across all subjects

This is the architecture we should build.
