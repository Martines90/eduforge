# 🎯 CURRICULUM ALIGNMENT - MANDATORY RULES

## ⚠️ CRITICAL REQUIREMENT

**THE MOST IMPORTANT RULE:** Your task **MUST directly address the specific curriculum topic** provided in the JSON input.

**DO NOT create tasks about different topics, even if they sound cool, historical, or interesting.**

---

## 📋 BEFORE WRITING ANYTHING - CHECKLIST

Complete this checklist BEFORE you begin creating the task:

### ✅ Step 1: READ THE CURRICULUM TOPIC CAREFULLY

1. **Read `curriculum_topic.name`** - This is THE topic you must teach
   - Example: "Quadratic Equations - Solving by Factoring"
   - Example: "Don Juan Character Analysis in Tirso de Molina"
   - Example: "Chemical Reactions - Stoichiometry"

2. **Read `curriculum_topic.short_description`** - This explains what the topic is about
   - Example: "Students learn to solve quadratic equations by factoring and finding roots"
   - Example: "Analysis of Don Juan's character traits through textual evidence"
   - Example: "Calculating quantities of reactants and products in chemical reactions"

3. **Read ALL `curriculum_topic.example_tasks`** - These show the exact type of work expected
   - These are NOT suggestions - they define the SCOPE of what students should do
   - Your task should be SIMILAR IN TYPE to these examples
   - Different scenario, same skill requirement

### ✅ Step 2: IDENTIFY THE CORE SKILL

**What is the student actually supposed to DO?**

Examples:
- **Quadratic Equations**: Solve ax² + bx + c = 0 by factoring or using the formula
- **Don Juan Analysis**: Identify character traits by analyzing dialogue and actions in the text
- **Stoichiometry**: Calculate moles, mass, or volume of substances in reactions

**Write down in one sentence:** "The student must [VERB] [OBJECT] using [SKILL]"

### ✅ Step 3: VERIFY ALIGNMENT

**Ask yourself:**

1. "Does my scenario create an authentic need for THIS SPECIFIC SKILL?"
   - ✅ YES: Ballistics expert needs quadratic equations for trajectory
   - ❌ NO: Pyramid builder using quadratic equations (anachronistic, wrong tool)

2. "Would a professional actually use THIS SKILL in THIS CONTEXT?"
   - ✅ YES: Theater director analyzes character through dialogue
   - ❌ NO: Art restorer analyzes character through visual symbols (wrong domain)

3. "Do my questions ask students to demonstrate THIS SPECIFIC SKILL?"
   - ✅ YES: "Solve for the bullet's maximum height using the quadratic formula"
   - ❌ NO: "Estimate approximately how high the bullet went" (vague, not the skill)

**If ANY answer is NO, STOP and redesign.**

---

## 🚨 COMMON ALIGNMENT FAILURES

### ❌ FAILURE TYPE 1: Cool Scenario, Wrong Topic

**Curriculum Topic**: Triangle Inscribed Circle Calculations
**What You Created**: "You are building a triangular roof. Calculate the area divided into rectangular sections for solar panels."
**Why It Failed**: The topic is about INSCRIBED CIRCLES, not dividing triangles into rectangles!

**How to Fix**: Create a scenario where someone needs to find the radius of a circle inscribed IN a triangle (e.g., circular support beam touching all three sides of triangular truss).

### ❌ FAILURE TYPE 2: Right Subject, Wrong Sub-Topic

**Curriculum Topic**: Kinetic Energy (E = ½mv²)
**What You Created**: "Calculate the force needed to stop the car in 5 seconds."
**Why It Failed**: That's about IMPULSE (F·t = Δmv), not KINETIC ENERGY!

**How to Fix**: Ask for the kinetic energy at a given velocity, or how velocity changes affect energy.

### ❌ FAILURE TYPE 3: Historical Context Doesn't Match Topic

**Curriculum Topic**: Don Juan Literary Character Analysis
**What You Created**: "You are restoring a 17th-century fresco depicting Don Juan. Analyze the visual symbols."
**Why It Failed**: The topic is LITERARY analysis (text), not ART HISTORY (visual symbols)!

**How to Fix**: Create a scenario where someone analyzes the TEXT of "El burlador de Sevilla" (e.g., theater director, literary scholar, translator).

### ❌ FAILURE TYPE 4: Related But Not The Same

**Curriculum Topic**: French Revolution Causes
**What You Created**: "Analyze the outcomes and consequences of the French Revolution."
**Why It Failed**: Topic is about CAUSES (what led to it), not OUTCOMES (what resulted)!

**How to Fix**: Create a scenario analyzing pre-revolutionary conditions, social tensions, Enlightenment ideas as causes.

---

## ✅ ALIGNMENT VERIFICATION CHECKLIST

Before submitting your task, verify:

### 1. **Topic Match**
- [ ] My task addresses the EXACT topic in `curriculum_topic.name`
- [ ] I'm not creating a task about a different (even if related) topic
- [ ] The skill required matches the `example_tasks` provided

### 2. **Skill Application**
- [ ] The scenario creates an authentic need for THIS specific skill
- [ ] A professional would actually use this skill in this context
- [ ] The questions require demonstrating this specific skill

### 3. **Evidence/Data Provided**
- [ ] I've provided ALL necessary information to solve the problem
- [ ] The provided information matches what this topic requires
  - Math: numerical values, measurements, constraints
  - Science: data, measurements, conditions, diagrams
  - Literature: text excerpts, quotes, contextual information
  - History: primary sources, documents, evidence

### 4. **Question Focus**
- [ ] Questions ask for what the topic teaches (not something else)
- [ ] Answer format matches the topic's expectations
- [ ] Difficulty appropriate for the specified level

**IF YOU CAN'T CHECK ALL BOXES, THE TASK FAILS CURRICULUM ALIGNMENT.**

---

## 🎯 THE ALIGNMENT FORMULA

```
TOPIC DEFINITION
↓
Identify the CORE SKILL students must demonstrate
↓
Find a REAL-WORLD PROFESSIONAL CONTEXT where this skill is actually used
↓
Create a SCENARIO where using this skill is natural and necessary
↓
Ask QUESTIONS that require demonstrating this specific skill
↓
VERIFY: Would this task appear in a curriculum for this topic?
```

---

## 🔍 EXAMPLES OF PERFECT ALIGNMENT

### Example 1: Mathematics - Quadratic Equations

**Topic**: Solving Quadratic Equations by Factoring
**Scenario**: Ballistics expert analyzing bullet trajectory for court case
**Data Provided**: Initial velocity, angle, time of flight
**Questions**:
- "Solve the quadratic equation h(t) = -4.9t² + 25t + 1.5 to find when the bullet hits the ground"
- "Factor the equation to find the two time values and explain which is physically meaningful"

**Why It Works**:
✅ Ballistics ACTUALLY uses quadratic equations
✅ Scenario requires solving a quadratic equation
✅ Questions ask for factoring and solving (the topic skill)
✅ Professional context where this is real work

### Example 2: Literature - Character Analysis

**Topic**: Don Juan Character Analysis in Tirso de Molina
**Scenario**: Theater director casting and interpreting "El burlador de Sevilla"
**Data Provided**: 3-4 direct quotes from the play showing Don Juan's behavior and dialogue
**Questions**:
- "Analyze these excerpts to identify Don Juan's core character traits"
- "How does Tirso use dialogue and actions to reveal Don Juan as transgressive?"

**Why It Works**:
✅ Theater directors ACTUALLY do close reading for character interpretation
✅ Scenario requires analyzing text (not visual art or history)
✅ Questions ask for literary character analysis (the topic skill)
✅ Professional context where this is real work

### Example 3: Chemistry - Stoichiometry

**Topic**: Stoichiometric Calculations in Chemical Reactions
**Scenario**: Chemical engineer responding to industrial spill, calculating neutralizing agent
**Data Provided**: Chemical equation, molar masses, amount of spilled acid
**Questions**:
- "Calculate the exact mass of Ca(OH)₂ needed to neutralize 500 kg of H₂SO₄"
- "If you only have 400 kg of Ca(OH)₂, how much acid will remain unneutralized?"

**Why It Works**:
✅ Chemical engineers ACTUALLY do stoichiometry for safety
✅ Scenario requires stoichiometric calculation
✅ Questions ask for mole/mass conversions (the topic skill)
✅ Professional context where this is real work

---

## 🚫 IF YOU FAIL ALIGNMENT

**You have created:**
- A cool story with the wrong math
- A historical context that doesn't fit the topic
- An art analysis task for a literature topic
- A task about Topic B when asked for Topic A

**This is COMPLETE FAILURE, regardless of:**
- How exciting the scenario is
- How historically accurate it is
- How well-written the task is
- How much students would enjoy it

**THE TASK MUST BE DELETED AND COMPLETELY REDESIGNED.**

---

## 📌 REMEMBER

**Alignment is NOT NEGOTIABLE.**

The 5 Universal Principles (exciting, real-life, etc.) must be achieved **WITHIN THE CONSTRAINTS** of curriculum alignment.

You don't get to:
- Create a different task because it's more exciting
- Switch topics because the scenario is cooler
- Ignore the curriculum because history is more interesting

**The curriculum topic defines WHAT students practice.**
**Your job is to make practicing THAT TOPIC exciting, real, and high-stakes.**

**NO EXCEPTIONS.**
