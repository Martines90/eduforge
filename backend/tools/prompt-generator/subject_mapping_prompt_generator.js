#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Subject Mapping Prompt Generator
 *
 * Generates comprehensive prompts for ChatGPT to create curriculum mapping data
 * for various subjects and countries.
 *
 * Usage:
 *   node subject_mapping_prompt_generator.js --country-code=HU --subject=mathematics
 *   node subject_mapping_prompt_generator.js --country-code=MX --subject=biology
 */

// Country configurations
const COUNTRIES = {
  HU: {
    name: 'Hungary',
    officialCurriculum: 'Nemzeti Alaptanterv (NAT)',
    primaryLanguage: 'Hungarian',
    educationAuthority: 'Ministry of Education and Culture (Oktatási és Kulturális Minisztérium)',
    gradeLevels: {
      '9-10': 'Középiskola 9-10. évfolyam',
      '11-12': 'Középiskola 11-12. évfolyam'
    }
  },
  MX: {
    name: 'Mexico',
    officialCurriculum: 'Secretaría de Educación Pública (SEP) Curriculum',
    primaryLanguage: 'Spanish',
    educationAuthority: 'Secretaría de Educación Pública (SEP)',
    gradeLevels: {
      '9-10': 'Educación Media Superior - Primero y Segundo Semestre',
      '11-12': 'Educación Media Superior - Tercero y Cuarto Semestre'
    }
  },
  US: {
    name: 'United States',
    officialCurriculum: 'Common Core State Standards / Next Generation Science Standards (NGSS)',
    primaryLanguage: 'English',
    educationAuthority: 'State Boards of Education (following Common Core / NGSS)',
    gradeLevels: {
      '9-10': 'High School - Grades 9-10 (Freshman & Sophomore)',
      '11-12': 'High School - Grades 11-12 (Junior & Senior)'
    }
  },
  UK: {
    name: 'United Kingdom',
    officialCurriculum: 'National Curriculum for England / GCSE and A-Level Standards',
    primaryLanguage: 'English',
    educationAuthority: 'Department for Education (DfE)',
    gradeLevels: {
      '9-10': 'Key Stage 4 - Years 10-11 (GCSE)',
      '11-12': 'Key Stage 5 - Years 12-13 (A-Level)'
    }
  },
  DE: {
    name: 'Germany',
    officialCurriculum: 'Bildungsstandards und Lehrpläne der Kultusministerkonferenz',
    primaryLanguage: 'German',
    educationAuthority: 'Kultusministerkonferenz (KMK)',
    gradeLevels: {
      '9-10': 'Sekundarstufe I - Klassen 9-10',
      '11-12': 'Sekundarstufe II - Klassen 11-12 (Oberstufe)'
    }
  }
};

// Subject configurations with specific guidance
const SUBJECTS = {
  mathematics: {
    name: 'Mathematics',
    labels: { HU: 'Matematika', MX: 'Matemáticas', US: 'Mathematics', UK: 'Mathematics', DE: 'Mathematik' },
    emoji: '🔢',
    category: 'stem',
    specificGuidance: `
### Subject-Specific Requirements for Mathematics:

**Core Topics to Include:**
- Algebra (equations, inequalities, functions, polynomials)
- Geometry (plane geometry, solid geometry, coordinate geometry, transformations)
- Trigonometry (angles, functions, identities, applications)
- Calculus (limits, derivatives, integrals) [for grades 11-12]
- Statistics and Probability (data analysis, distributions, inference)
- Number Theory (divisibility, primes, modular arithmetic)
- Sequences and Series
- Mathematical Logic and Proof Techniques

**Pedagogical Considerations:**
- Progress from concrete to abstract reasoning
- Include both pure mathematics and real-world applications
- Ensure example tasks cover: calculation, proof, problem-solving, and modeling
- Balance procedural fluency with conceptual understanding
- Include visual/geometric representations where applicable

**Example Task Types:**
- Computation and calculation problems
- Proof and reasoning tasks
- Applied word problems from real-world contexts
- Multi-step problem-solving
- Pattern recognition and generalization
`
  },
  physics: {
    name: 'Physics',
    labels: { HU: 'Fizika', MX: 'Física', US: 'Physics', UK: 'Physics', DE: 'Physik' },
    emoji: '⚛️',
    category: 'stem',
    specificGuidance: `
### Subject-Specific Requirements for Physics:

**Core Topics to Include:**
- Mechanics (kinematics, dynamics, energy, momentum)
- Thermodynamics (heat, temperature, laws of thermodynamics)
- Waves and Optics (wave properties, sound, light, reflection, refraction)
- Electricity and Magnetism (circuits, electromagnetic induction, fields)
- Modern Physics (atomic structure, quantum mechanics, relativity) [for grades 11-12]
- Nuclear Physics (radioactivity, nuclear reactions)

**Pedagogical Considerations:**
- Connect theoretical concepts with experimental methods
- Include both qualitative reasoning and quantitative problem-solving
- Reference laboratory experiments common in the country's curriculum
- Emphasize the relationship between mathematics and physics
- Include safety considerations for practical work

**Example Task Types:**
- Quantitative problem-solving with formulas
- Conceptual explanation questions
- Experiment design and analysis
- Graph interpretation and analysis
- Real-world applications (technology, engineering, nature)
`
  },
  chemistry: {
    name: 'Chemistry',
    labels: { HU: 'Kémia', MX: 'Química', US: 'Chemistry', UK: 'Chemistry', DE: 'Chemie' },
    emoji: '🧪',
    category: 'stem',
    specificGuidance: `
### Subject-Specific Requirements for Chemistry:

**Core Topics to Include:**
- Atomic Structure and Periodic Table
- Chemical Bonding (ionic, covalent, metallic)
- Chemical Reactions (types, equations, stoichiometry)
- States of Matter (gases, liquids, solids, phase changes)
- Solutions and Concentration
- Acids and Bases
- Thermochemistry (enthalpy, entropy, free energy)
- Electrochemistry (redox reactions, electrochemical cells)
- Organic Chemistry (hydrocarbons, functional groups) [for grades 11-12]
- Chemical Equilibrium and Kinetics

**Pedagogical Considerations:**
- Balance macro-level observations with molecular-level explanations
- Include laboratory techniques and safety protocols
- Connect chemistry to everyday life and industry
- Include both theoretical concepts and practical applications
- Reference standard nomenclature and notation

**Example Task Types:**
- Balancing chemical equations
- Stoichiometric calculations
- Laboratory procedure design
- Conceptual explanations of chemical phenomena
- Problem-solving involving concentrations, yields, and equilibrium
`
  },
  biology: {
    name: 'Biology',
    labels: { HU: 'Biológia', MX: 'Biología', US: 'Biology', UK: 'Biology', DE: 'Biologie' },
    emoji: '🧬',
    category: 'stem',
    specificGuidance: `
### Subject-Specific Requirements for Biology:

**Core Topics to Include:**
- Cell Biology (structure, function, organelles, cell division)
- Genetics (Mendelian genetics, DNA, molecular genetics)
- Evolution and Natural Selection
- Ecology (ecosystems, populations, biodiversity)
- Human Biology (anatomy, physiology, organ systems)
- Plant Biology (structure, photosynthesis, reproduction)
- Microbiology (bacteria, viruses, fungi)
- Biochemistry (proteins, enzymes, metabolism)

**Pedagogical Considerations:**
- Connect different levels of biological organization (molecular → organism → ecosystem)
- Include taxonomy and classification systems
- Reference local ecosystems and species where appropriate
- Include microscopy and laboratory investigation skills
- Address ethical considerations in biology (especially genetics and ecology)

**Example Task Types:**
- Diagram labeling and interpretation
- Experimental design and hypothesis testing
- Classification and identification tasks
- Process explanations (photosynthesis, respiration, mitosis, etc.)
- Data analysis from experiments or field studies
- Application to health, medicine, and environmental issues
`
  },
  history: {
    name: 'History',
    labels: { HU: 'Történelem', MX: 'Historia', US: 'History', UK: 'History', DE: 'Geschichte' },
    emoji: '📜',
    category: 'humanities',
    specificGuidance: `
### Subject-Specific Requirements for History:

**Core Topics to Include:**
- National History (country's own historical development, key events, figures)
- World History (major civilizations, empires, revolutions)
- Political History (forms of government, major conflicts, diplomacy)
- Social and Cultural History (daily life, art, religion, technology)
- Economic History (trade, industrialization, economic systems)
- Modern History (20th-21st century major events, globalization)
- Historical Methods (source analysis, historiography, interpretation)

**Pedagogical Considerations:**
- Balance national history with world history according to curriculum emphasis
- Include primary and secondary source analysis
- Develop chronological understanding and cause-effect relationships
- Address multiple perspectives and interpretations
- Connect past events to contemporary issues

**Example Task Types:**
- Source analysis (primary documents, images, artifacts)
- Chronological ordering and timeline construction
- Cause-and-effect analysis
- Comparison of historical periods or events
- Essay questions requiring argumentation and evidence
- Interpretation of historical maps, graphs, and statistical data
`
  },
  geography: {
    name: 'Geography',
    labels: { HU: 'Földrajz', MX: 'Geografía', US: 'Geography', UK: 'Geography', DE: 'Geographie' },
    emoji: '🌍',
    category: 'humanities',
    specificGuidance: `
### Subject-Specific Requirements for Geography:

**Core Topics to Include:**
- Physical Geography (landforms, climate, ecosystems, natural disasters)
- Human Geography (population, urbanization, migration, culture)
- Economic Geography (resources, industries, trade, development)
- Political Geography (borders, geopolitics, territorial disputes)
- Environmental Geography (sustainability, climate change, conservation)
- Cartography and GIS (map reading, spatial analysis)
- Regional Geography (continents, countries, with emphasis on home country/region)

**Pedagogical Considerations:**
- Integrate physical and human geography
- Use maps, satellite imagery, and geographic data
- Connect local, regional, and global scales
- Address contemporary issues (climate change, urbanization, globalization)
- Develop spatial thinking and map literacy

**Example Task Types:**
- Map interpretation and analysis
- Climate graph and data analysis
- Case study analysis of regions or countries
- Fieldwork and observation tasks
- Problem-solving related to environmental or development issues
- Comparison of geographic regions or phenomena
`
  },
  literature: {
    name: 'Literature',
    labels: { HU: 'Irodalom', MX: 'Literatura', US: 'Literature', UK: 'Literature', DE: 'Literatur' },
    emoji: '📚',
    category: 'humanities',
    specificGuidance: `
### Subject-Specific Requirements for Literature:

**Core Topics to Include:**
- Literary Periods and Movements (national and world literature)
- Literary Genres (poetry, prose, drama, essay)
- Literary Analysis (themes, symbols, narrative techniques, style)
- Major Authors and Works (canonical texts from the country's literature)
- Literary Theory and Criticism
- Comparative Literature (connections between texts and authors)
- Language and Style Analysis
- Creative Writing and Expression

**Pedagogical Considerations:**
- Emphasize canonical works from the country's national literature
- Include representative works from world literature
- Develop close reading and analytical writing skills
- Address cultural and historical contexts of literary works
- Include both classical and contemporary literature
- Use texts in the original language (primary language of instruction)

**Example Task Types:**
- Close reading and textual analysis
- Essay writing (interpretation, comparison, argumentation)
- Poetry analysis (form, meter, literary devices)
- Character and plot analysis
- Identification of literary devices and techniques
- Contextual questions (historical, biographical, cultural)
- Creative response to literature
`
  },
  informatics: {
    name: 'Informatics',
    labels: { HU: 'Informatika', MX: 'Informática', US: 'Computer Science', UK: 'Computing', DE: 'Informatik' },
    emoji: '💻',
    category: 'stem',
    specificGuidance: `
### Subject-Specific Requirements for Informatics:

**Core Topics to Include:**
- Programming Fundamentals (Python, JavaScript, control structures, data structures)
- Web Development (HTML, CSS, JavaScript, frontend and backend development)
- Computer Systems (hardware, operating systems, networks, software)
- Database Management (SQL, database design, data modeling)
- Digital Literacy and Ethics (digital citizenship, cybersecurity, privacy, online safety)
- Software Engineering (testing, debugging, version control, project management)
- Emerging Technologies (cloud computing, AI/ML basics, mobile development)
- Data Science Basics (data analysis, visualization, statistics)

**Pedagogical Considerations:**
- Balance theoretical concepts with hands-on practical projects
- Include real-world applications and industry-relevant skills
- Progress from visual/block-based programming to text-based coding
- Emphasize problem-solving and computational thinking
- Include ethical considerations and responsible technology use
- Connect to careers and pathways in technology
- Use project-based learning and portfolio development

**Example Task Types:**
- Coding exercises and programming challenges
- Web development projects (building websites and applications)
- System configuration and troubleshooting tasks
- Database design and query writing
- Cybersecurity scenarios and best practices
- Collaborative software development projects
- Technical documentation and presentation
- Debugging and code review exercises
- Research and analysis of emerging technologies
`
  }
};

/**
 * Generate the complete prompt for a given country and subject
 */
function generatePrompt(countryCode, subjectKey) {
  const country = COUNTRIES[countryCode];
  const subject = SUBJECTS[subjectKey];

  if (!country) {
    throw new Error(`Unknown country code: ${countryCode}. Available: ${Object.keys(COUNTRIES).join(', ')}`);
  }

  if (!subject) {
    throw new Error(`Unknown subject: ${subjectKey}. Available: ${Object.keys(SUBJECTS).join(', ')}`);
  }

  const subjectName = subject.labels[countryCode] || subject.name;
  const localLanguage = country.primaryLanguage;

  const prompt = `# Curriculum Mapping Prompt: ${subject.name} for ${country.name}

You are an expert curriculum analyst specializing in ${country.name}'s official national education standards for ${subject.name}.

Your task is to create a comprehensive, hierarchical JSON structure that maps the complete ${subject.name} curriculum for grades 9-12 according to ${country.name}'s official government education standards: **${country.officialCurriculum}**.

---

## 1. Research and Accuracy Requirements

**Authoritative Sources:**
- Base your structure on the official ${country.educationAuthority} curriculum documents
- Follow the **${country.officialCurriculum}** standards and framework
- Ensure accuracy to ${country.name}'s actual teaching practices and pedagogical approaches
- Use terminology and concepts standard in ${country.name}'s education system

**Grade Level Context:**
- Grade 9-10: ${country.gradeLevels['9-10']}
- Grade 11-12: ${country.gradeLevels['11-12']}

---

## 2. JSON Structure Format

Follow this **exact** hierarchical structure:

\`\`\`json
{
  "grade_9_10": [
    {
      "key": "unique_topic_key",
      "name": "Topic Name in ${localLanguage}",
      "short_description": "Brief description of the topic scope and key learning goals (1-2 sentences)",
      "sub_topics": [
        {
          "key": "unique_subtopic_key",
          "name": "Subtopic Name in ${localLanguage}",
          "short_description": "Brief description of what students will learn in this subtopic",
          "sub_topics": [
            {
              "key": "unique_sub_subtopic_key",
              "name": "Detailed Concept Name in ${localLanguage}",
              "short_description": "Specific learning objective or skill to be mastered",
              "example_tasks": [
                "Example task 1 that demonstrates this concept (age-appropriate and curriculum-aligned)",
                "Example task 2 with slightly different approach or difficulty",
                "Example task 3 showing practical application or real-world connection"
              ]
            }
          ]
        }
      ]
    }
  ],
  "grade_11_12": [
    // Same hierarchical structure as grade_9_10
  ]
}
\`\`\`

---

## 3. Depth and Coverage Requirements

**Breadth (Horizontal Coverage):**
- **Grade 9-10**: Include 8-12 main topics that cover the full curriculum for these grades
- **Grade 11-12**: Include 8-12 main topics that cover the full curriculum for these grades
- Total main topics across both grade levels: 16-24

**Depth (Vertical Hierarchy):**
- **Level 1 (Main Topics)**: 8-12 per grade level
- **Level 2 (Sub Topics)**: 3-6 per main topic
- **Level 3 (Detailed Sub Topics)**: 2-5 per sub topic
- **Level 4 (Example Tasks)**: 3-5 tasks per detailed sub topic

**Total Size Target:**
- **3,000-3,500 lines** of JSON
- **150,000-160,000 characters** in total
- This ensures comprehensive coverage of the entire 4-year secondary curriculum

---

## 4. Content Quality Standards

### Language and Terminology:
- **All names and descriptions MUST be in ${localLanguage}**
- Use official terminology from ${country.name}'s education system
- Keys should be in lowercase_with_underscores (English or transliterated)
- Be consistent with naming conventions throughout

### Short Descriptions:
- Keep to 1-2 sentences (concise but informative)
- Focus on learning objectives and key concepts
- Use pedagogically accurate language
- Align with official curriculum language and goals

### Example Tasks:
Each example task must be:
- **Authentic**: Reflect the types of assessments and exercises used in ${country.name}
- **Age-appropriate**: Suitable for the cognitive level of the grade
- **Progressive**: Show increasing complexity across the 3-5 examples
- **Curriculum-aligned**: Match the learning objectives of the official curriculum
- **Practical**: Where possible, connect to real-world contexts relevant to ${country.name}
- **Diverse**: Cover different cognitive levels (recall, application, analysis, synthesis)
- **Clear**: Fully specified so a student or teacher understands what is being asked

### Progression:
- Ensure logical progression from Grade 9-10 to Grade 11-12
- Build on prerequisite knowledge appropriately
- Increase complexity and abstraction in later grades
- Reflect the actual sequencing in ${country.name}'s curriculum

---

${subject.specificGuidance}

---

## 5. Curriculum Alignment Checklist

Before and during your work, ensure:
- [ ] You have researched the official ${country.officialCurriculum}
- [ ] All main topics reflect mandatory content in the curriculum
- [ ] Topic sequence matches the typical teaching order in ${country.name}
- [ ] Time allocation and emphasis match curriculum priorities
- [ ] Assessment types in example tasks reflect ${country.name}'s evaluation methods
- [ ] Cultural context is appropriate (examples, references, applications)
- [ ] Language is natural and authentic for ${localLanguage}

---

## 6. Delivery Format (In Chunks)

Since this is a large dataset (~3000-3500 lines), deliver it in manageable chunks.

### Step 1: Overview
First, provide a **complete overview** listing:
1. All main topics for grade_9_10 (with brief 1-sentence descriptions)
2. All main topics for grade_11_12 (with brief 1-sentence descriptions)
3. Confirmation that this structure aligns with ${country.officialCurriculum}
4. Estimated line count and character count for the full output

**Wait for approval before proceeding to chunks.**

### Step 2: Deliver Chunks
After approval, deliver the full JSON data in chunks as follows:

**Chunk 1**: \`grade_9_10\` array - First 2-3 main topics (complete with all sub_topics, sub_sub_topics, and example_tasks)

**Chunk 2**: \`grade_9_10\` array - Next 2-3 main topics

**Chunk 3**: \`grade_9_10\` array - Next 2-3 main topics

**Chunk 4**: \`grade_9_10\` array - Remaining main topics

**Chunk 5**: \`grade_11_12\` array - First 2-3 main topics

**Chunk 6**: \`grade_11_12\` array - Next 2-3 main topics

**Chunk 7**: \`grade_11_12\` array - Next 2-3 main topics

**Chunk 8**: \`grade_11_12\` array - Remaining main topics

**IMPORTANT**: The \`grade_9_10\` and \`grade_11_12\` keys should contain **arrays** directly, NOT objects with a "topics" key. The structure should be:
\`\`\`json
{
  "grade_9_10": [ /* array of topics */ ],
  "grade_11_12": [ /* array of topics */ ]
}
\`\`\`

### Chunk Completion Format:
After each chunk, state:

\`\`\`
✅ Chunk [X] of [TOTAL] complete.
📊 Character count for this chunk: [XXXXX]
📈 Cumulative character count: [XXXXXX] / ~160,000
🔄 Ready for next chunk? Reply 'continue' to proceed to Chunk [X+1].
\`\`\`

---

## 7. Final Validation

After delivering all chunks, provide:
1. **Total line count**
2. **Total character count**
3. **Confirmation** that all main topics from the overview are included
4. **Self-check** that content aligns with ${country.officialCurriculum}

---

## 8. Important Notes

- **DO NOT hallucinate or invent curriculum content.** If you are unsure about specific topics in ${country.name}'s curriculum, indicate this and use general best practices for the subject.
- **Prioritize accuracy over creativity.** This data will be used for educational purposes.
- **Be consistent** with JSON formatting, key naming, and structure throughout all chunks.
- **All content must be in ${localLanguage}** except for keys.

---

## Ready to Begin?

Please confirm:
1. You understand the task and requirements
2. You have identified authoritative sources for ${country.name}'s ${subject.name} curriculum
3. You are ready to provide content in ${localLanguage}
4. You will deliver an overview first, then await approval before providing chunks

**Please start with the overview (Step 1).**
`;

  return prompt;
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      params[key] = value;
    }
  });

  return params;
}

/**
 * Generate prompt for a single subject
 */
function generateSingleSubject(countryCode, subjectKey) {
  console.log(`\n📝 Generating prompt for: ${SUBJECTS[subjectKey]?.name || subjectKey} (${COUNTRIES[countryCode]?.name || countryCode})`);

  // Generate the prompt
  const prompt = generatePrompt(countryCode, subjectKey);

  // Create output filename with country subdirectory
  const baseOutputDir = path.join(__dirname, 'prompts');
  const countryDir = path.join(baseOutputDir, countryCode.toLowerCase());
  const outputFilename = `${subjectKey}_grade_9_12.txt`;
  const outputPath = path.join(countryDir, outputFilename);

  // Ensure output directory exists
  if (!fs.existsSync(countryDir)) {
    fs.mkdirSync(countryDir, { recursive: true });
  }

  // Write prompt to file
  fs.writeFileSync(outputPath, prompt, 'utf8');

  return {
    subject: SUBJECTS[subjectKey].name,
    filename: `${countryCode.toLowerCase()}/${outputFilename}`,
    path: outputPath,
    size: prompt.length
  };
}

/**
 * Main execution
 */
function main() {
  const args = parseArgs();
  const countryCode = (args['country-code'] || args['country'] || '').toUpperCase();
  const subjectKey = (args['subject'] || '').toLowerCase();

  // Validate country code
  if (!countryCode) {
    console.error(`
❌ Error: Missing required country code

Usage:
  node subject_mapping_prompt_generator.js --country-code=COUNTRY [--subject=SUBJECT]

Examples:
  # Generate for all subjects in Mexico
  node subject_mapping_prompt_generator.js --country-code=MX

  # Generate for a specific subject
  node subject_mapping_prompt_generator.js --country-code=HU --subject=mathematics
  node subject_mapping_prompt_generator.js --country-code=MX --subject=biology

Available Countries:
  ${Object.keys(COUNTRIES).join(', ')}

Available Subjects:
  ${Object.keys(SUBJECTS).join(', ')}
`);
    process.exit(1);
  }

  // Check if country exists
  if (!COUNTRIES[countryCode]) {
    console.error(`\n❌ Error: Unknown country code: ${countryCode}\n`);
    console.error(`Available countries: ${Object.keys(COUNTRIES).join(', ')}\n`);
    process.exit(1);
  }

  try {
    // If no subject specified, generate for all subjects
    if (!subjectKey) {
      console.log(`\n🌍 Generating prompts for ALL subjects in ${COUNTRIES[countryCode].name}...\n`);

      const results = [];
      const subjectKeys = Object.keys(SUBJECTS);

      for (const key of subjectKeys) {
        const result = generateSingleSubject(countryCode, key);
        results.push(result);
      }

      // Output summary
      console.log(`\n✅ All prompts generated successfully!\n`);
      console.log(`📊 Summary:`);
      console.log(`   Country: ${COUNTRIES[countryCode].name} (${countryCode})`);
      console.log(`   Total subjects: ${results.length}`);
      console.log(`   Total size: ${results.reduce((sum, r) => sum + r.size, 0).toLocaleString()} characters\n`);

      console.log(`📄 Generated files:`);
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.subject.padEnd(15)} → ${result.filename}`);
      });

      console.log(`\n💡 Next steps:`);
      console.log(`   1. Navigate to: tools/prompt-generator/prompts/${countryCode.toLowerCase()}/`);
      console.log(`   2. Open each .txt file and copy the prompt`);
      console.log(`   3. Paste into ChatGPT (GPT-4 recommended)`);
      console.log(`   4. Follow the instructions to receive curriculum data in chunks`);
      console.log(`\n`);

    } else {
      // Generate for a single subject
      if (!SUBJECTS[subjectKey]) {
        console.error(`\n❌ Error: Unknown subject: ${subjectKey}\n`);
        console.error(`Available subjects: ${Object.keys(SUBJECTS).join(', ')}\n`);
        process.exit(1);
      }

      const result = generateSingleSubject(countryCode, subjectKey);

      // Output success message
      console.log(`\n✅ Prompt generated successfully!\n`);
      console.log(`📄 File: ${result.filename}`);
      console.log(`📁 Location: ${result.path}`);
      console.log(`📊 Size: ${result.size.toLocaleString()} characters`);
      console.log(`\n💡 Next steps:`);
      console.log(`   1. Open the generated file: ${result.path}`);
      console.log(`   2. Copy the entire prompt`);
      console.log(`   3. Paste it into ChatGPT (GPT-4 recommended)`);
      console.log(`   4. Follow the instructions to receive the curriculum data in chunks`);
      console.log(`\n`);
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generatePrompt, COUNTRIES, SUBJECTS };
