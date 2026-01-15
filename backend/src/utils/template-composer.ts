import { Subject } from "@eduforger/shared";
import * as fs from "fs";
import * as path from "path";

/**
 * Configuration for subject-specific modules
 */
interface SubjectModuleConfig {
  subject: Subject;
  modules: {
    identity: string; // e.g., "mathematics/identity.md"
    secondModule: string; // Subject-specific (problem_types, analysis_types, formula_guidance, etc.)
    evidence: string; // e.g., "mathematics/evidence_requirements.md"
    scenarios: string; // e.g., "mathematics/scenario_patterns.md"
  };
}

/**
 * Maps each subject to its specific module files
 */
const SUBJECT_MODULE_CONFIGS: Record<Subject, SubjectModuleConfig> = {
  mathematics: {
    subject: "mathematics",
    modules: {
      identity: "mathematics/identity.md",
      secondModule: "mathematics/problem_types.md",
      evidence: "mathematics/evidence_requirements.md",
      scenarios: "mathematics/scenario_patterns.md",
    },
  },
  physics: {
    subject: "physics",
    modules: {
      identity: "physics/identity.md",
      secondModule: "physics/formula_guidance.md",
      evidence: "physics/evidence_requirements.md",
      scenarios: "physics/scenario_patterns.md",
    },
  },
  chemistry: {
    subject: "chemistry",
    modules: {
      identity: "chemistry/identity.md",
      secondModule: "chemistry/reaction_types.md",
      evidence: "chemistry/evidence_requirements.md",
      scenarios: "chemistry/scenario_patterns.md",
    },
  },
  biology: {
    subject: "biology",
    modules: {
      identity: "biology/identity.md",
      secondModule: "biology/system_types.md",
      evidence: "biology/evidence_requirements.md",
      scenarios: "biology/scenario_patterns.md",
    },
  },
  informatics: {
    subject: "informatics",
    modules: {
      identity: "informatics/identity.md",
      secondModule: "informatics/problem_types.md",
      evidence: "informatics/evidence_requirements.md",
      scenarios: "informatics/scenario_patterns.md",
    },
  },
  literature: {
    subject: "literature",
    modules: {
      identity: "literature/identity.md",
      secondModule: "literature/analysis_types.md",
      evidence: "literature/evidence_requirements.md",
      scenarios: "literature/scenario_patterns.md",
    },
  },
  history: {
    subject: "history",
    modules: {
      identity: "history/identity.md",
      secondModule: "history/source_types.md",
      evidence: "history/evidence_requirements.md",
      scenarios: "history/scenario_patterns.md",
    },
  },
  geography: {
    subject: "geography",
    modules: {
      identity: "geography/identity.md",
      secondModule: "geography/analysis_types.md",
      evidence: "geography/evidence_requirements.md",
      scenarios: "geography/scenario_patterns.md",
    },
  },
};

/**
 * Core module order - these are universal and apply to all subjects
 */
const CORE_MODULES = [
  "core/01_universal_principles.md",
  "core/02_curriculum_alignment.md",
  "core/03_scenario_quality.md",
  "core/04_output_format.md",
] as const;

/**
 * Cache for compiled templates to avoid re-reading files
 */
const templateCache = new Map<Subject, string>();

/**
 * Loads a module file from the modules directory
 */
function loadModule(modulePath: string): string {
  // Try compiled path first (dist), then source path (src)
  const compiledBasePath = path.join(__dirname, "../../genai/prompts/modules");
  const sourceBasePath = path.join(__dirname, "../genai/prompts/modules");

  let fullPath = path.join(compiledBasePath, modulePath);

  // Try compiled path
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, "utf-8");
  }

  // Try source path
  fullPath = path.join(sourceBasePath, modulePath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, "utf-8");
  }

  // Module not found
  console.warn(`⚠️  Module not found: ${modulePath}`);
  return `<!-- Module not found: ${modulePath} -->`;
}

/**
 * Composes a complete system prompt template by combining:
 * 1. Core universal modules (shared across all subjects)
 * 2. Subject-specific modules (tailored to each subject)
 *
 * @param subject - The subject to create a template for
 * @returns Complete system prompt template as a string
 */
export function composeTemplate(subject: Subject): string {
  // Check cache first
  if (templateCache.has(subject)) {
    console.log(`📦 Using cached template for ${subject}`);
    return templateCache.get(subject)!;
  }

  console.log(`🔨 Composing template for ${subject}...`);

  const sections: string[] = [];

  // Add header
  sections.push(`# TASK GENERATION SYSTEM PROMPT - ${subject.toUpperCase()}`);
  sections.push(`# Composed from modular template system`);
  sections.push(``);
  sections.push(`---`);
  sections.push(``);

  // 1. Load and add all core modules (universal principles)
  console.log(`  📚 Loading ${CORE_MODULES.length} core modules...`);
  for (const coreModule of CORE_MODULES) {
    const content = loadModule(coreModule);
    if (content && !content.includes("Module not found")) {
      sections.push(content);
      sections.push(``); // Add spacing between modules
      sections.push(`---`);
      sections.push(``);
    }
  }

  // 2. Load and add subject-specific modules
  const subjectConfig = SUBJECT_MODULE_CONFIGS[subject];

  if (subjectConfig) {
    console.log(`  🎯 Loading ${subject}-specific modules...`);

    // Load in specific order:
    // 1. Identity (who you are as a teacher)
    // 2. Second module (problem types, analysis types, formulas, etc.)
    // 3. Evidence requirements (what data to provide)
    // 4. Scenario patterns (where this subject appears in real world)

    const moduleOrder = [
      subjectConfig.modules.identity,
      subjectConfig.modules.secondModule,
      subjectConfig.modules.evidence,
      subjectConfig.modules.scenarios,
    ];

    for (const modulePath of moduleOrder) {
      const content = loadModule(modulePath);
      if (content && !content.includes("Module not found")) {
        sections.push(content);
        sections.push(``);
        sections.push(`---`);
        sections.push(``);
      }
    }
  } else {
    console.warn(`⚠️  No module configuration found for subject: ${subject}`);
    console.warn(`    Falling back to generic template structure`);

    // Fallback: Add a placeholder message
    sections.push(`# ${subject.toUpperCase()} - MODULES NOT YET CREATED`);
    sections.push(``);
    sections.push(
      `Subject-specific modules for ${subject} are not yet implemented.`
    );
    sections.push(`Please create the following modules:`);
    sections.push(`- ${subject}/identity.md`);
    sections.push(`- ${subject}/<specific_module>.md`);
    sections.push(`- ${subject}/evidence_requirements.md`);
    sections.push(`- ${subject}/scenario_patterns.md`);
    sections.push(``);
  }

  // Combine all sections
  const compiledTemplate = sections.join("\n");

  // Cache the result
  templateCache.set(subject, compiledTemplate);

  console.log(`✅ Template composition complete for ${subject}`);
  console.log(`   Total length: ${compiledTemplate.length} characters`);

  return compiledTemplate;
}

/**
 * Clears the template cache (useful for development/testing)
 */
export function clearTemplateCache(): void {
  templateCache.clear();
  console.log("🗑️  Template cache cleared");
}

/**
 * Pre-loads templates for all subjects into cache
 * Useful for optimization at startup
 */
export function preloadAllTemplates(): void {
  console.log("🚀 Pre-loading all subject templates...");

  const subjects: Subject[] = [
    "mathematics",
    "physics",
    "chemistry",
    "biology",
    "informatics",
    "literature",
    "history",
    "geography",
  ];

  for (const subject of subjects) {
    try {
      composeTemplate(subject);
    } catch (error) {
      console.error(`❌ Failed to pre-load template for ${subject}:`, error);
    }
  }

  console.log(`✅ Pre-loaded ${templateCache.size} templates`);
}
