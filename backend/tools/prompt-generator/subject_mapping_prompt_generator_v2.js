#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { getGradesForCountry } = require("./grades-config");

/**
 * Subject Mapping Prompt Generator V2
 *
 * COUNTRY-AWARE VERSION: Uses shared grades configuration
 *
 * Generates prompts for each country/grade/subject combination
 * Output structure: [country_code]/[grade_value]/[subject].txt
 *
 * Usage:
 *   node subject_mapping_prompt_generator_v2.js --country-code=HU --grade=grade_9_12 --subject=mathematics
 *   node subject_mapping_prompt_generator_v2.js --country-code=MX  // All grades and subjects for Mexico
 *   node subject_mapping_prompt_generator_v2.js // All countries, all grades, all subjects
 */

// Country configurations
const COUNTRIES = {
  HU: {
    name: "Hungary",
    officialCurriculum: "Nemzeti Alaptanterv (NAT)",
    primaryLanguage: "Hungarian",
    educationAuthority:
      "Ministry of Education and Culture (Oktatási és Kulturális Minisztérium)",
  },
  MX: {
    name: "Mexico",
    officialCurriculum: "Secretaría de Educación Pública (SEP) Curriculum",
    primaryLanguage: "Spanish",
    educationAuthority: "Secretaría de Educación Pública (SEP)",
  },
  US: {
    name: "United States",
    officialCurriculum:
      "Common Core State Standards / Next Generation Science Standards (NGSS)",
    primaryLanguage: "English",
    educationAuthority:
      "State Boards of Education (following Common Core / NGSS)",
  },
};

// Subject configurations (same as before)
const SUBJECTS = {
  mathematics: {
    name: "Mathematics",
    labels: { HU: "Matematika", MX: "Matemáticas", US: "Mathematics" },
    emoji: "🔢",
    category: "stem",
    specificGuidance: `
### Subject-Specific Requirements for Mathematics:

Core Topics to Include:
- Algebra (equations, inequalities, functions, polynomials)
- Geometry (plane geometry, solid geometry, coordinate geometry, transformations)
- Trigonometry (angles, functions, identities, applications)
- Calculus (limits, derivatives, integrals) [for higher grades]
- Statistics and Probability (data analysis, distributions, inference)
- Number Theory (divisibility, primes, modular arithmetic)
- Sequences and Series
- Mathematical Logic and Proof Techniques

Pedagogical Considerations:
- Progress from concrete to abstract reasoning
- Include both pure mathematics and real-world applications
- Ensure example tasks cover: calculation, proof, problem-solving, and modeling
- Balance procedural fluency with conceptual understanding
- Include visual/geometric representations where applicable

Example Task Types:
- Computation and calculation problems
- Proof and reasoning tasks
- Applied word problems from real-world contexts
- Multi-step problem-solving
- Pattern recognition and generalization
`,
  },
  physics: {
    name: "Physics",
    labels: { HU: "Fizika", MX: "Física", US: "Physics" },
    emoji: "⚛️",
    category: "stem",
    specificGuidance: `
### Subject-Specific Requirements for Physics:

Core Topics to Include:
- Mechanics (kinematics, dynamics, energy, momentum)
- Thermodynamics (heat, temperature, laws of thermodynamics)
- Waves and Optics (wave properties, sound, light, reflection, refraction)
- Electricity and Magnetism (circuits, electromagnetic induction, fields)
- Modern Physics (atomic structure, quantum mechanics, relativity) [for higher grades]
- Nuclear Physics (radioactivity, nuclear reactions)

Pedagogical Considerations:
- Connect theoretical concepts with experimental methods
- Include both qualitative reasoning and quantitative problem-solving
- Reference laboratory experiments common in the country's curriculum
- Emphasize the relationship between mathematics and physics
- Include safety considerations for practical work

Example Task Types:
- Quantitative problem-solving with formulas
- Conceptual explanation questions
- Experiment design and analysis
- Graph interpretation and analysis
- Real-world applications (technology, engineering, nature)
`,
  },
  chemistry: {
    name: "Chemistry",
    labels: { HU: "Kémia", MX: "Química", US: "Chemistry" },
    emoji: "🧪",
    category: "stem",
    specificGuidance: `
### Subject-Specific Requirements for Chemistry:

Core Topics to Include:
- Atomic Structure and Periodic Table
- Chemical Bonding (ionic, covalent, metallic)
- Chemical Reactions (types, equations, stoichiometry)
- States of Matter (gases, liquids, solids, phase changes)
- Solutions and Concentration
- Acids and Bases
- Thermochemistry (enthalpy, entropy, free energy)
- Electrochemistry (redox reactions, electrochemical cells)
- Organic Chemistry (hydrocarbons, functional groups) [for higher grades]
- Chemical Equilibrium and Kinetics

Pedagogical Considerations:
- Balance macro-level observations with molecular-level explanations
- Include laboratory techniques and safety protocols
- Connect chemistry to everyday life and industry
- Include both theoretical concepts and practical applications
- Reference standard nomenclature and notation

Example Task Types:
- Balancing chemical equations
- Stoichiometric calculations
- Laboratory procedure design
- Conceptual explanations of chemical phenomena
- Problem-solving involving concentrations, yields, and equilibrium
`,
  },
  biology: {
    name: "Biology",
    labels: { HU: "Biológia", MX: "Biología", US: "Biology" },
    emoji: "🧬",
    category: "stem",
    specificGuidance: `
### Subject-Specific Requirements for Biology:

Core Topics to Include:
- Cell Biology (structure, function, organelles, cell division)
- Genetics (Mendelian genetics, DNA, molecular genetics)
- Evolution and Natural Selection
- Ecology (ecosystems, populations, biodiversity)
- Human Biology (anatomy, physiology, organ systems)
- Plant Biology (structure, photosynthesis, reproduction)
- Microbiology (bacteria, viruses, fungi)
- Biochemistry (proteins, enzymes, metabolism)

Pedagogical Considerations:
- Connect different levels of biological organization (molecular → organism → ecosystem)
- Include taxonomy and classification systems
- Reference local ecosystems and species where appropriate
- Include microscopy and laboratory investigation skills
- Address ethical considerations in biology (especially genetics and ecology)

Example Task Types:
- Diagram labeling and interpretation
- Experimental design and hypothesis testing
- Classification and identification tasks
- Process explanations (photosynthesis, respiration, mitosis, etc.)
- Data analysis from experiments or field studies
- Application to health, medicine, and environmental issues
`,
  },
  history: {
    name: "History",
    labels: { HU: "Történelem", MX: "Historia", US: "History" },
    emoji: "📜",
    category: "humanities",
    specificGuidance: `
### Subject-Specific Requirements for History:

Core Topics to Include:
- National History (country's own historical development, key events, figures)
- World History (major civilizations, empires, revolutions)
- Political History (forms of government, major conflicts, diplomacy)
- Social and Cultural History (daily life, art, religion, technology)
- Economic History (trade, industrialization, economic systems)
- Modern History (20th-21st century major events, globalization)
- Historical Methods (source analysis, historiography, interpretation)

Pedagogical Considerations:
- Balance national history with world history according to curriculum emphasis
- Include primary and secondary source analysis
- Develop chronological understanding and cause-effect relationships
- Address multiple perspectives and interpretations
- Connect past events to contemporary issues

Example Task Types:
- Source analysis (primary documents, images, artifacts)
- Chronological ordering and timeline construction
- Cause-and-effect analysis
- Comparison of historical periods or events
- Essay questions requiring argumentation and evidence
- Interpretation of historical maps, graphs, and statistical data
`,
  },
  geography: {
    name: "Geography",
    labels: { HU: "Földrajz", MX: "Geografía", US: "Geography" },
    emoji: "🌍",
    category: "humanities",
    specificGuidance: `
### Subject-Specific Requirements for Geography:

Core Topics to Include:
- Physical Geography (landforms, climate, ecosystems, natural disasters)
- Human Geography (population, urbanization, migration, culture)
- Economic Geography (resources, industries, trade, development)
- Political Geography (borders, geopolitics, territorial disputes)
- Environmental Geography (sustainability, climate change, conservation)
- Cartography and GIS (map reading, spatial analysis)
- Regional Geography (continents, countries, with emphasis on home country/region)

Pedagogical Considerations:
- Integrate physical and human geography
- Use maps, satellite imagery, and geographic data
- Connect local, regional, and global scales
- Address contemporary issues (climate change, urbanization, globalization)
- Develop spatial thinking and map literacy

Example Task Types:
- Map interpretation and analysis
- Climate graph and data analysis
- Case study analysis of regions or countries
- Fieldwork and observation tasks
- Problem-solving related to environmental or development issues
- Comparison of geographic regions or phenomena
`,
  },
  literature: {
    name: "Literature",
    labels: { HU: "Irodalom", MX: "Literatura", US: "Literature" },
    emoji: "📚",
    category: "humanities",
    specificGuidance: `
### Subject-Specific Requirements for Literature:

Core Topics to Include:
- Literary Periods and Movements (national and world literature)
- Literary Genres (poetry, prose, drama, essay)
- Literary Analysis (themes, symbols, narrative techniques, style)
- Major Authors and Works (canonical texts from the country's literature)
- Literary Theory and Criticism
- Comparative Literature (connections between texts and authors)
- Language and Style Analysis
- Creative Writing and Expression

Pedagogical Considerations:
- Emphasize canonical works from the country's national literature
- Include representative works from world literature
- Develop close reading and analytical writing skills
- Address cultural and historical contexts of literary works
- Include both classical and contemporary literature
- Use texts in the original language (primary language of instruction)

Example Task Types:
- Close reading and textual analysis
- Essay writing (interpretation, comparison, argumentation)
- Poetry analysis (form, meter, literary devices)
- Character and plot analysis
- Identification of literary devices and techniques
- Contextual questions (historical, biographical, cultural)
- Creative response to literature
`,
  },
  information_technology: {
    name: "Information Technology",
    labels: { HU: "Informatika", MX: "Informática", US: "Computer Science" },
    emoji: "💻",
    category: "stem",
    specificGuidance: `
### Subject-Specific Requirements for Information Technology:

Core Topics to Include:
- Programming Fundamentals (Python, JavaScript, control structures, data structures)
- Web Development (HTML, CSS, JavaScript, frontend and backend development)
- Computer Systems (hardware, operating systems, networks, software)
- Database Management (SQL, database design, data modeling)
- Digital Literacy and Ethics (digital citizenship, cybersecurity, privacy, online safety)
- Software Engineering (testing, debugging, version control, project management)
- Emerging Technologies (cloud computing, AI/ML basics, mobile development)
- Data Science Basics (data analysis, visualization, statistics)

Pedagogical Considerations:
- Balance theoretical concepts with hands-on practical projects
- Include real-world applications and industry-relevant skills
- Progress from visual/block-based programming to text-based coding
- Emphasize problem-solving and computational thinking
- Include ethical considerations and responsible technology use
- Connect to careers and pathways in technology
- Use project-based learning and portfolio development

Example Task Types:
- Coding exercises and programming challenges
- Web development projects (building websites and applications)
- System configuration and troubleshooting tasks
- Database design and query writing
- Cybersecurity scenarios and best practices
- Collaborative software development projects
- Technical documentation and presentation
- Debugging and code review exercises
- Research and analysis of emerging technologies
`,
  },
};

/**
 * Generate prompt for a specific country, grade, and subject
 */
function generatePrompt(countryCode, gradeConfig, subjectKey) {
  const country = COUNTRIES[countryCode];
  const subject = SUBJECTS[subjectKey];

  if (!country) {
    throw new Error(
      `Unknown country code: ${countryCode}. Available: ${Object.keys(COUNTRIES).join(", ")}`
    );
  }

  if (!subject) {
    throw new Error(
      `Unknown subject: ${subjectKey}. Available: ${Object.keys(SUBJECTS).join(", ")}`
    );
  }

  const subjectName = subject.labels[countryCode] || subject.name;
  const localLanguage = country.primaryLanguage;

  const prompt = `# Curriculum Mapping Prompt: ${subject.name} for ${country.name} (${gradeConfig.labelEN})

You are an expert curriculum analyst specializing in ${country.name}'s official national education standards for ${subject.name}.

Your task is to create a comprehensive, hierarchical JSON structure that maps the complete ${subject.name} curriculum for ${gradeConfig.labelEN} (${gradeConfig.gradeRange}, ages ${gradeConfig.ageRange}) according to ${country.name}'s official government education standards: ${country.officialCurriculum}.

---

## 1. Research and Accuracy Requirements

Authoritative Sources:
- Base your structure on the official ${country.educationAuthority} curriculum documents
- Follow the ${country.officialCurriculum} standards and framework
- Ensure accuracy to ${country.name}'s actual teaching practices and pedagogical approaches
- Use terminology and concepts standard in ${country.name}'s education system

Grade Level Context:
- Grade Range: ${gradeConfig.gradeRange}
- Local Label: ${gradeConfig.labelLocal}
- Age Range: ${gradeConfig.ageRange}
- Teacher Role: ${gradeConfig.teacherRoleLabel}

---

## 2. JSON Structure Format

Follow this exact hierarchical structure (start directly with an array):

\`\`\`json
[
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
]
\`\`\`

**IMPORTANT**: Return ONLY the JSON array. Do NOT wrap it in an object with a "${gradeConfig.value}" key.

---

## 3. Depth and Coverage Requirements

Breadth (Horizontal Coverage):
- Include 10-30 main topics to ensure COMPLETE coverage of the curriculum for ${gradeConfig.labelEN}
- Cover ALL mandatory content areas from the official curriculum
- Better to have more topics with good coverage than fewer topics with gaps

Depth (Vertical Hierarchy):
- Level 1 (Main Topics): 10-30 topics (adapt based on subject complexity and curriculum breadth)
- Level 2 (Sub Topics): 3-6 per main topic
- Level 3 (Sub Topics with example Tasks): 3-5 tasks per detailed sub topic

Total Size Target:
- Minimum 1000-1500 lines of JSON for this grade level
- Minimum 60,000-100,000 characters
- This ensures comprehensive coverage of the curriculum for ${gradeConfig.gradeRange}

**Priority**: Completeness over size constraints. If the curriculum requires 25 main topics to be fully covered, include all 25.

---

## 4. Content Quality Standards

### Language and Terminology:
- All names and descriptions MUST be in ${localLanguage}
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
- Authentic: Reflect the types of assessments and exercises used in ${country.name}
- Age-appropriate: Suitable for ages ${gradeConfig.ageRange}
- Progressive: Show increasing complexity across the 3-5 examples
- Curriculum-aligned: Match the learning objectives of the official curriculum
- Practical: Where possible, connect to real-world contexts relevant to ${country.name}
- Diverse: Cover different cognitive levels (recall, application, analysis, synthesis)
- Clear: Fully specified so a student or teacher understands what is being asked

---

${subject.specificGuidance}

---

## 5. Curriculum Alignment Checklist

Before and during your work, ensure:
- [ ] You have researched the official ${country.officialCurriculum} for ${gradeConfig.gradeRange}
- [ ] All main topics reflect mandatory content for ${gradeConfig.labelEN}
- [ ] Topic sequence matches the typical teaching order in ${country.name}
- [ ] Content is age-appropriate for ${gradeConfig.ageRange}
- [ ] Examples are relevant for ${gradeConfig.teacherRoleLabel} teaching this level
- [ ] Cultural context is appropriate (examples, references, applications)
- [ ] Language is natural and authentic for ${localLanguage}

---

## 6. Delivery Format - CHUNKED APPROACH

**IMPORTANT**: Deliver the curriculum in **5 CHUNKS** to ensure comprehensive coverage and better organization.

### Before Starting: Create a Complete Plan

Before generating any JSON, provide a detailed plan that divides the curriculum into 5 chunks:

\`\`\`markdown
# Curriculum Plan for ${subject.name} - ${country.name} (${gradeConfig.labelEN})

## Chunk 1 (Topics 1-X): [Thematic Group Name]
Main topics to include:
- Topic 1: [Topic name and brief scope]
- Topic 2: [Topic name and brief scope]
- ...

## Chunk 2 (Topics X-Y): [Thematic Group Name]
Main topics to include:
- Topic X: [Topic name and brief scope]
- ...

## Chunk 3 (Topics Y-Z): [Thematic Group Name]
Main topics to include:
- Topic Y: [Topic name and brief scope]
- ...

## Chunk 4 (Topics Z-W): [Thematic Group Name]
Main topics to include:
- Topic Z: [Topic name and brief scope]
- ...

## Chunk 5 (Topics W-end): [Thematic Group Name]
Main topics to include:
- Topic W: [Topic name and brief scope]
- ...

Total Topics: [Estimate total number]
\`\`\`

### Then Generate Each Chunk

After presenting the plan, generate each chunk sequentially. Each chunk should:
- Cover approximately 20% of the total curriculum (2-6 topics per chunk depending on subject complexity)
- Be a valid JSON array that can be concatenated with other chunks
- Include complete topic structures with all sub_topics and example_tasks

**Structure Requirements for Each Chunk**:
- Each chunk is a JSON array: \`[{...}, {...}]\`
- All chunks combined will form the complete curriculum array
- First chunk: \`[{ topic_1 }, { topic_2 }, ...]\`
- Middle chunks: \`[{ topic_x }, { topic_y }, ...]\`
- Last chunk: \`[{ topic_n-1 }, { topic_n }]\`

**Final Assembly**:
After all 5 chunks, confirm the total structure:
- Total main topics: [count]
- Total subtopics: [estimate]
- Total example tasks: [estimate]
- Estimated JSON size: [characters]

Example of CORRECT chunk format:
\`\`\`json
[
  { "key": "topic_1", "name": "...", "sub_topics": [...] },
  { "key": "topic_2", "name": "...", "sub_topics": [...] }
]
\`\`\`

**DO NOT** wrap in an object with "${gradeConfig.value}" key

---

## 7. Important Notes

- DO NOT hallucinate or invent curriculum content. If you are unsure about specific topics in ${country.name}'s curriculum for ${gradeConfig.labelEN}, indicate this and use general best practices for the subject.
- Prioritize accuracy over creativity. This data will be used for educational purposes.
- Be consistent with JSON formatting, key naming, and structure throughout.
- All content must be in ${localLanguage} except for keys.
- Focus specifically on ${gradeConfig.gradeRange} content - don't mix in content from other grade levels.

---

## Ready to Begin?

Please provide the complete curriculum mapping JSON for:
- Country: ${country.name}
- Grade Level: ${gradeConfig.labelEN} (${gradeConfig.gradeRange})
- Subject: ${subjectName}
- Language: ${localLanguage}
`;

  return prompt;
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  args.forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      params[key] = value;
    }
  });

  return params;
}

/**
 * Generate prompt for a single country/grade/subject combination
 */
function generateSinglePrompt(countryCode, gradeConfig, subjectKey) {
  console.log(
    `\n📝 Generating: ${countryCode}/${gradeConfig.value}/${subjectKey}`
  );

  // Generate the prompt
  const prompt = generatePrompt(countryCode, gradeConfig, subjectKey);

  // Create output directory structure: prompts/[country]/[grade]/[subject].txt
  const baseOutputDir = path.join(__dirname, "prompts");
  const countryDir = path.join(baseOutputDir, countryCode.toLowerCase());
  const gradeDir = path.join(countryDir, gradeConfig.value);
  const outputFilename = `${subjectKey}.txt`;
  const outputPath = path.join(gradeDir, outputFilename);

  // Ensure output directory exists
  if (!fs.existsSync(gradeDir)) {
    fs.mkdirSync(gradeDir, { recursive: true });
  }

  // Write prompt to file
  fs.writeFileSync(outputPath, prompt, "utf8");

  return {
    country: countryCode,
    grade: gradeConfig.value,
    gradeLabel: gradeConfig.labelEN,
    subject: SUBJECTS[subjectKey].name,
    filename: `${countryCode.toLowerCase()}/${gradeConfig.value}/${outputFilename}`,
    path: outputPath,
    size: prompt.length,
  };
}

/**
 * Main execution
 */
function main() {
  const args = parseArgs();
  const countryCode = (
    args["country-code"] ||
    args["country"] ||
    ""
  ).toUpperCase();
  const gradeValue = args["grade"] || "";
  const subjectKey = (args["subject"] || "").toLowerCase();

  // Validate inputs
  if (countryCode && !COUNTRIES[countryCode]) {
    console.error(`\n❌ Error: Unknown country code: ${countryCode}\n`);
    console.error(`Available countries: ${Object.keys(COUNTRIES).join(", ")}\n`);
    process.exit(1);
  }

  if (subjectKey && !SUBJECTS[subjectKey]) {
    console.error(`\n❌ Error: Unknown subject: ${subjectKey}\n`);
    console.error(`Available subjects: ${Object.keys(SUBJECTS).join(", ")}\n`);
    process.exit(1);
  }

  try {
    const results = [];

    // Determine which countries to process
    const countriesToProcess = countryCode
      ? [countryCode]
      : Object.keys(COUNTRIES);

    for (const country of countriesToProcess) {
      const grades = getGradesForCountry(country);

      // Determine which grades to process
      const gradesToProcess = gradeValue
        ? grades.filter(g => g.value === gradeValue)
        : grades;

      if (gradeValue && gradesToProcess.length === 0) {
        console.error(
          `\n❌ Error: Grade ${gradeValue} not found for country ${country}\n`
        );
        console.error(
          `Available grades: ${grades.map(g => g.value).join(", ")}\n`
        );
        continue;
      }

      // Determine which subjects to process
      const subjectsToProcess = subjectKey
        ? [subjectKey]
        : Object.keys(SUBJECTS);

      // Generate prompts for all combinations
      for (const grade of gradesToProcess) {
        for (const subject of subjectsToProcess) {
          const result = generateSinglePrompt(country, grade, subject);
          results.push(result);
        }
      }
    }

    // Output summary
    console.log(`\n✅ All prompts generated successfully!\n`);
    console.log(`📊 Summary:`);
    console.log(`   Total prompts: ${results.length}`);
    console.log(
      `   Total size: ${results.reduce((sum, r) => sum + r.size, 0).toLocaleString()} characters\n`
    );

    // Group by country
    const byCountry = {};
    results.forEach((r) => {
      if (!byCountry[r.country]) byCountry[r.country] = [];
      byCountry[r.country].push(r);
    });

    console.log(`📄 Generated files by country:`);
    Object.keys(byCountry).forEach((country) => {
      console.log(`\n   ${COUNTRIES[country].name} (${country}):`);
      byCountry[country].forEach((result) => {
        console.log(
          `      ${result.gradeLabel} - ${result.subject} → ${result.filename}`
        );
      });
    });

    console.log(`\n💡 Next steps:`);
    console.log(
      `   1. Navigate to: tools/prompt-generator/prompts/[country]/[grade]/`
    );
    console.log(`   2. Open each .txt file and copy the prompt`);
    console.log(`   3. Paste into ChatGPT (GPT-4 recommended)`);
    console.log(
      `   4. Save the generated JSON as: [country]/[grade]/[subject].json`
    );
    console.log(`\n`);
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
