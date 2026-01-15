# Modular Template System - Implementation Progress

## ✅ COMPLETED: Core Universal Modules

### Created Modules (Location: `/backend/src/genai/prompts/modules/core/`)

1. **`01_universal_principles.md`** ⭐ THE MOST IMPORTANT
   - Defines the 5 core principles that EVERY subject must follow:
     1. Real-Life Authenticity
     2. Adventurous & Exciting
     3. Logical Curriculum Alignment (100% Real-World Taste)
     4. You Are The Main Character (Second-Person Narration)
     5. High Stakes - Tension & Urgency

   - These principles are **MANDATORY** for ALL subjects
   - Includes validation tests for each principle
   - Provides examples for STEM and Humanities
   - Contains "The Formula" for every task

2. **`02_curriculum_alignment.md`**
   - Mandatory alignment rules
   - Before-writing checklist
   - Common alignment failures with examples
   - Verification checklist
   - Perfect alignment examples

3. **`03_scenario_quality.md`**
   - Anti-cliché 80/20 rule
   - Fresh vs overused scenarios
   - Realism test (80% rule)
   - Second-person narration requirements
   - Red flags and green flags for quality

4. **`04_output_format.md`** (Partial)
   - JSON structure specifications
   - Description requirements
   - Language and measurement system placeholders

## 📁 DIRECTORY STRUCTURE CREATED

```
/backend/src/genai/prompts/modules/
├── core/                    ✅ Created
│   ├── 01_universal_principles.md    ✅ Done
│   ├── 02_curriculum_alignment.md    ✅ Done
│   ├── 03_scenario_quality.md        ✅ Done
│   └── 04_output_format.md           ⏳ Partial
│
├── mathematics/             ✅ Directory created
├── physics/                 ✅ Directory created
├── chemistry/               ✅ Directory created
├── biology/                 ✅ Directory created
├── informatics/             ✅ Directory created
├── literature/              ✅ Directory created
├── history/                 ✅ Directory created
└── geography/               ✅ Directory created
```

## 🔄 NEXT STEPS

### Phase 1: Complete Core Modules (30 min)
- [ ] Finish `04_output_format.md`
- [ ] Create `05_final_verification.md` (checklist before submission)

### Phase 2: Create Subject-Specific Modules (2-3 hours)

Each subject needs 4 modules:

#### **Mathematics** (High Priority)
- [ ] `identity.md` - Math teacher persona, what makes math exciting
- [ ] `problem_types.md` - Types of math problems (equations, geometry, etc.)
- [ ] `evidence_requirements.md` - What data to provide (numbers, diagrams, etc.)
- [ ] `scenario_patterns.md` - Where math is used (engineering, finance, science, etc.)

#### **Literature** (High Priority - Fix Current Issues)
- [ ] `identity.md` - Literary scholar persona
- [ ] `analysis_types.md` - Character, theme, symbolism, comparative analysis
- [ ] `evidence_requirements.md` - **MUST provide text excerpts in full**
- [ ] `scenario_patterns.md` - Scholarly, curatorial, theatrical contexts

#### **Physics**
- [ ] `identity.md`
- [ ] `formula_guidance.md` - Common formulas, when to use each
- [ ] `evidence_requirements.md` - Units, measurements, SI system
- [ ] `scenario_patterns.md` - Experiments, engineering, real-world physics

#### **Chemistry**
- [ ] `identity.md`
- [ ] `reaction_types.md` - Balancing, stoichiometry, reactions
- [ ] `evidence_requirements.md` - Chemical equations, safety data
- [ ] `scenario_patterns.md` - Lab work, industrial chemistry, safety

#### **Biology**
- [ ] `identity.md`
- [ ] `system_types.md` - Cells, ecology, evolution, anatomy
- [ ] `evidence_requirements.md` - Diagrams, data, observations
- [ ] `scenario_patterns.md` - Field work, medical, research

#### **Informatics**
- [ ] `identity.md`
- [ ] `problem_types.md` - Algorithms, data structures, logic
- [ ] `evidence_requirements.md` - Pseudocode, constraints, inputs/outputs
- [ ] `scenario_patterns.md` - Software dev, debugging, optimization

#### **History**
- [ ] `identity.md`
- [ ] `source_types.md` - Primary vs secondary, reliability
- [ ] `evidence_requirements.md` - **MUST provide document quotes**
- [ ] `scenario_patterns.md` - Research, policy, museum, legal

#### **Geography**
- [ ] `identity.md`
- [ ] `analysis_types.md` - Spatial, demographic, environmental
- [ ] `evidence_requirements.md` - Maps, statistics, descriptions
- [ ] `scenario_patterns.md` - Planning, research, field work

### Phase 3: Build Template Composition System (2-3 hours)

Create: `/backend/src/utils/template-composer.ts`

```typescript
interface SubjectModuleConfig {
  subject: Subject;
  modules: {
    identity: string;           // e.g., "mathematics/identity.md"
    problemStructure: string;   // e.g., "mathematics/problem_types.md"
    evidence: string;           // e.g., "mathematics/evidence_requirements.md"
    scenarios: string;          // e.g., "mathematics/scenario_patterns.md"
  };
}

function composeTemplate(subject: Subject): string {
  // 1. Load core modules (universal)
  // 2. Load subject-specific modules
  // 3. Combine in correct order
  // 4. Return final prompt
}
```

### Phase 4: Update System Prompt Builder (1 hour)

Modify: `/backend/src/utils/system-prompt-builder.helper.ts`

Change from:
- Loading monolithic templates (`system_prompt.template.md`)

To:
- Using `template-composer.ts` to build from modules
- Cache compiled templates for performance

### Phase 5: Testing & Validation (2-3 hours)

Test each subject:
- Generate 3 sample tasks per subject
- Verify all 5 universal principles are followed
- Verify curriculum alignment
- Verify subject-specific requirements met

## 🎯 KEY DESIGN PRINCIPLES ACHIEVED

### ✅ Universal Principles Enforced

Every subject module MUST support:
1. **Real-Life Authenticity** - Would appear in documentary
2. **Adventurous & Exciting** - Students think "this is cool!"
3. **Logical Curriculum Fit** - Topic fits scenario 100% naturally
4. **You Are Main Character** - Second-person throughout
5. **High Stakes** - Real consequences matter

### ✅ Modular & Maintainable

- Core modules = updated once, apply everywhere
- Subject modules = small, focused, expert-reviewable
- Easy to add new subjects
- Easy to improve specific aspects

### ✅ Flexible & Composable

- Can mix modules for hybrid topics
- Subject experts own their modules
- Easy experimentation
- Performance via caching

## 📊 ESTIMATED COMPLETION TIME

- **Core Modules**: 30 min remaining
- **Subject Modules**: 2-3 hours (32 small files)
- **Composition System**: 2-3 hours (TypeScript logic)
- **Integration**: 1 hour (update builder)
- **Testing**: 2-3 hours (validate all subjects)

**Total**: 8-11 hours for complete implementation

## 🚀 IMMEDIATE NEXT ACTION

**Option A**: Continue creating subject modules (recommended)
- Start with Mathematics and Literature (most different)
- Validate approach works for both STEM and Humanities
- Then complete remaining 6 subjects

**Option B**: Test current humanities template first
- Generate a literature task with existing template
- See if improvements are sufficient
- Then continue with modular approach

**Option C**: Build composition system first
- Create the infrastructure
- Then fill in subject modules incrementally
- Allows parallel work on modules

## 💡 RECOMMENDATION

**Proceed with Option A**:
1. Create Mathematics modules (30 min)
2. Create Literature modules (30 min)
3. Build basic composition system (1 hour)
4. Test both subjects (30 min)
5. If successful, complete remaining 6 subjects (2 hours)
6. Full integration and testing (2 hours)

This validates the architecture early and provides quick wins.

---

**Next Command**: Would you like me to continue creating the subject-specific modules starting with Mathematics and Literature?
