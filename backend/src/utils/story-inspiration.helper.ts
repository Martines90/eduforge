/**
 * Story Inspiration Helper
 * Pure utility functions for loading configs and generating weighted random story elements
 */

import * as path from "path";
import * as fs from "fs";
import {
  HeroAge,
  ErasConfig,
  LocationsConfig,
  CharactersConfig,
  SituationsConfig,
  ThemesConfig,
  AtmosphereConfig,
  FieldsConfig,
  StakesConfig,
  ConflictsConfig,
  EnvironmentsConfig,
  NarrativeConfig,
  WeightsConfig,
  SelectedInspiration,
  StoryInspirationEnhancement,
  DifficultyLevel,
  TargetGroup,
} from "../types";
import {
  weightedRandomPick,
  randomPick,
  adjustWeightsForDifficulty,
} from "./weighted-random";

// Config cache
let configsLoaded = false;
let erasConfig: ErasConfig | null = null;
let locationsConfig: LocationsConfig | null = null;
let charactersConfig: CharactersConfig | null = null;
let situationsConfig: SituationsConfig | null = null;
let themesConfig: ThemesConfig | null = null;
let atmosphereConfig: AtmosphereConfig | null = null;
let fieldsConfig: FieldsConfig | null = null;
let stakesConfig: StakesConfig | null = null;
let conflictsConfig: ConflictsConfig | null = null;
let environmentsConfig: EnvironmentsConfig | null = null;
let narrativeConfig: NarrativeConfig | null = null;
let weightsConfig: WeightsConfig | null = null;

/**
 * Loads a single config file
 */
function loadConfig<T>(configPath: string, filename: string): T | null {
  const filePath = path.join(configPath, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Config file not found: ${filename}`);
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`❌ Error parsing ${filename}:`, error);
    return null;
  }
}

/**
 * Loads all configuration files (called once, then cached)
 */
function loadAllConfigs(): void {
  if (configsLoaded) return;

  const configPath = path.join(__dirname, "../genai/task-generation-config");

  try {
    // Load weights
    weightsConfig = loadConfig<WeightsConfig>(
      configPath,
      "story-inspiration-weights.json"
    );

    // Load vocabulary files
    const vocabPath = "inspiration-vocablulary";
    erasConfig = loadConfig<ErasConfig>(
      configPath,
      `${vocabPath}/story-inspiration-eras.json`
    );
    locationsConfig = loadConfig<LocationsConfig>(
      configPath,
      `${vocabPath}/story-inspiration-locations.json`
    );
    charactersConfig = loadConfig<CharactersConfig>(
      configPath,
      `${vocabPath}/story-inspiration-characters.json`
    );
    situationsConfig = loadConfig<SituationsConfig>(
      configPath,
      `${vocabPath}/story-inspiration-situations.json`
    );
    themesConfig = loadConfig<ThemesConfig>(
      configPath,
      `${vocabPath}/story-inspiration-themes.json`
    );
    atmosphereConfig = loadConfig<AtmosphereConfig>(
      configPath,
      `${vocabPath}/story-inspiration-atmosphere.json`
    );
    fieldsConfig = loadConfig<FieldsConfig>(
      configPath,
      `${vocabPath}/story-inspiration-fields.json`
    );
    stakesConfig = loadConfig<StakesConfig>(
      configPath,
      `${vocabPath}/story-inspiration-stakes.json`
    );
    conflictsConfig = loadConfig<ConflictsConfig>(
      configPath,
      `${vocabPath}/story-inspiration-conflicts.json`
    );
    environmentsConfig = loadConfig<EnvironmentsConfig>(
      configPath,
      `${vocabPath}/story-inspiration-environments.json`
    );
    narrativeConfig = loadConfig<NarrativeConfig>(
      configPath,
      `${vocabPath}/story-inspiration-narrative.json`
    );

    configsLoaded = true;
    console.log("✅ Story inspiration configs loaded");
  } catch (error) {
    console.error("❌ Error loading story inspiration configs:", error);
  }
}

/**
 * Adjusts weights based on difficulty level
 */
function adjustWeightsForDifficultyLevel(
  defaultWeights: WeightsConfig["default_weights"],
  difficulty: DifficultyLevel
): WeightsConfig["default_weights"] {
  const adjustment = weightsConfig?.difficulty_adjustments[difficulty];
  if (!adjustment) {
    return defaultWeights;
  }

  const adjusted = { ...defaultWeights };

  if (adjustment.prefer_simple_situations) {
    adjusted.situations = adjustWeightsForDifficulty(
      adjusted.situations,
      ["discovery", "experiment", "teaching"],
      ["battle", "fight", "trapped"],
      1.3,
      0.7
    );
  }

  if (adjustment.complex_situations) {
    adjusted.situations = adjustWeightsForDifficulty(
      adjusted.situations,
      ["infiltration", "negotiation", "sabotage"],
      ["teaching", "collaboration"],
      1.4,
      0.6
    );
  }

  if (adjustment.lighter_vibes) {
    adjusted.vibes = adjustWeightsForDifficulty(
      adjusted.vibes,
      ["lighthearted", "funny", "inspirational"],
      ["dark", "pessimistic", "gritty"],
      1.5,
      0.4
    );
  }

  return adjusted;
}

/**
 * Selects appropriate age based on target group
 */
function selectAgeForTargetGroup(_targetGroup: TargetGroup): HeroAge | null {
  if (!charactersConfig?.hero_ages) return null;

  const ages = charactersConfig.hero_ages;

  // Filter ages appropriate for target group
  const appropriateAges = ages.filter((age) => {
    return ["teenager", "young_adult", "adult", "middle_aged"].includes(age.id);
  });

  return randomPick(appropriateAges);
}

/**
 * Generates random inspiration without weights (fallback)
 */
function generateRandomInspiration(): SelectedInspiration {
  return {
    era: randomPick(erasConfig?.eras || []) || undefined,
    location: randomPick(locationsConfig?.locations || []) || undefined,
    personality:
      randomPick(charactersConfig?.hero_personalities || []) || undefined,
    role: randomPick(charactersConfig?.hero_roles || []) || undefined,
    age: randomPick(charactersConfig?.hero_ages || []) || undefined,
    situation: randomPick(situationsConfig?.situations || []) || undefined,
    theme: randomPick(themesConfig?.themes || []) || undefined,
    vibe: randomPick(atmosphereConfig?.vibes || []) || undefined,
    genre: randomPick(atmosphereConfig?.genres || []) || undefined,
    field: randomPick(fieldsConfig?.fields || []) || undefined,
    stake: randomPick(stakesConfig?.stakes || []) || undefined,
    conflict: randomPick(conflictsConfig?.conflict_types || []) || undefined,
    environment:
      randomPick(environmentsConfig?.environments || []) || undefined,
    storytellingMode:
      randomPick(narrativeConfig?.storytelling_modes || []) || undefined,
    narrativeStructure:
      randomPick(narrativeConfig?.narrative_structures || []) || undefined,
    pacing: randomPick(narrativeConfig?.pacing || []) || undefined,
  };
}

/**
 * Generates story inspiration elements using weighted random selection
 * @param difficultyLevel Task difficulty level
 * @param targetGroup Target audience
 * @param _customKeywords Optional custom keywords (currently not used for weighting)
 * @returns Selected story inspiration elements
 */
export function generateInspiration(
  difficultyLevel: DifficultyLevel,
  targetGroup: TargetGroup,
  _customKeywords: string[] = []
): SelectedInspiration {
  // Ensure configs are loaded
  loadAllConfigs();

  const selected: SelectedInspiration = {};

  if (!weightsConfig) {
    console.warn("⚠️  Weights config not loaded, using random selection");
    return generateRandomInspiration();
  }

  // Get difficulty-adjusted weights
  const weights = adjustWeightsForDifficultyLevel(
    weightsConfig.default_weights,
    difficultyLevel
  );

  // Select era
  if (erasConfig?.eras) {
    selected.era =
      weightedRandomPick(erasConfig.eras, weights.eras, (era) => era.id) ||
      undefined;
  }

  // Select location
  if (locationsConfig?.locations) {
    selected.location =
      weightedRandomPick(
        locationsConfig.locations,
        weights.locations,
        (loc) => loc.id
      ) || undefined;
  }

  // Select character elements
  if (charactersConfig) {
    selected.personality =
      weightedRandomPick(
        charactersConfig.hero_personalities || [],
        weights.hero_personalities,
        (p) => p.id
      ) || undefined;

    // Role - uniform random (no specific weights)
    selected.role = randomPick(charactersConfig.hero_roles || []) || undefined;

    // Age - adapt to target group
    selected.age = selectAgeForTargetGroup(targetGroup) || undefined;
  }

  // Select situation
  if (situationsConfig?.situations) {
    selected.situation =
      weightedRandomPick(
        situationsConfig.situations,
        weights.situations,
        (s) => s.id
      ) || undefined;
  }

  // Select theme (uniform random)
  if (themesConfig?.themes) {
    selected.theme = randomPick(themesConfig.themes) || undefined;
  }

  // Select vibe/atmosphere
  if (atmosphereConfig) {
    selected.vibe =
      weightedRandomPick(
        atmosphereConfig.vibes || [],
        weights.vibes,
        (v) => v.id
      ) || undefined;

    // Genre - uniform random
    selected.genre = randomPick(atmosphereConfig.genres || []) || undefined;
  }

  // Select field (uniform random)
  if (fieldsConfig?.fields) {
    selected.field = randomPick(fieldsConfig.fields) || undefined;
  }

  // Select stakes (uniform random)
  if (stakesConfig?.stakes) {
    selected.stake = randomPick(stakesConfig.stakes) || undefined;
  }

  // Select conflict type (uniform random)
  if (conflictsConfig?.conflict_types) {
    selected.conflict = randomPick(conflictsConfig.conflict_types) || undefined;
  }

  // Select environment (uniform random)
  if (environmentsConfig?.environments) {
    selected.environment =
      randomPick(environmentsConfig.environments) || undefined;
  }

  // Select narrative elements (uniform random)
  if (narrativeConfig) {
    selected.storytellingMode =
      randomPick(narrativeConfig.storytelling_modes || []) || undefined;
    selected.narrativeStructure =
      randomPick(narrativeConfig.narrative_structures || []) || undefined;
    selected.pacing = randomPick(narrativeConfig.pacing || []) || undefined;
  }

  return selected;
}

/**
 * Builds prompt enhancement text from selected inspiration
 * @param selected Selected inspiration elements
 * @returns Formatted prompt enhancement string
 */
export function buildPromptEnhancement(selected: SelectedInspiration): string {
  let enhancement = "\n\n## STORY INSPIRATION ELEMENTS\n";
  enhancement +=
    "Use these elements to enrich your story (adapt creatively, don't force all elements):\n\n";

  if (selected.era) {
    enhancement += `**Era/Time Period:** ${selected.era.name} (${selected.era.period})\n`;
    enhancement += `- Keywords: ${selected.era.keywords.join(", ")}\n\n`;
  }

  if (selected.location) {
    enhancement += `**Location/Setting:** ${selected.location.name}\n`;
    enhancement += `- Type: ${selected.location.type}\n`;
    if (selected.location.subcategories.length > 0) {
      const sampleLocations = selected.location.subcategories
        .slice(0, 3)
        .join(", ");
      enhancement += `- Examples: ${sampleLocations}\n\n`;
    }
  }

  if (selected.environment) {
    enhancement += `**Specific Environment:** ${selected.environment.name} (${selected.environment.category})\n`;
    const sampleSettings = selected.environment.settings.slice(0, 3).join(", ");
    enhancement += `- Settings: ${sampleSettings}\n\n`;
  }

  if (selected.field) {
    enhancement += `**Professional Field:** ${selected.field.name}\n`;
    const sampleSubcats = selected.field.subcategories.slice(0, 3).join(", ");
    enhancement += `- Subcategories: ${sampleSubcats}\n\n`;
  }

  if (selected.personality && selected.role) {
    enhancement += `**Protagonist Character:**\n`;
    enhancement += `- Role: ${selected.role.name}`;
    if (selected.role.specializations.length > 0) {
      enhancement += ` (${selected.role.specializations[0]})`;
    }
    enhancement += `\n`;
    enhancement += `- Personality: ${
      selected.personality.name
    } - ${selected.personality.traits.join(", ")}\n`;

    if (selected.age) {
      enhancement += `- Age Range: ${selected.age.age_range}\n`;
    }
    enhancement += `\n`;
  }

  if (selected.situation) {
    enhancement += `**Situation Type:** ${selected.situation.name}\n`;
    const variation = randomPick(selected.situation.variations);
    if (variation) {
      enhancement += `- Suggested variation: ${variation}\n\n`;
    }
  }

  if (selected.stake) {
    enhancement += `**Stakes:** ${selected.stake.name} (${selected.stake.intensity})\n`;
    enhancement += `- Description: ${selected.stake.description}\n`;
    const example = randomPick(selected.stake.examples);
    if (example) {
      enhancement += `- Example: ${example}\n\n`;
    }
  }

  if (selected.conflict) {
    enhancement += `**Conflict Type:** ${selected.conflict.name}\n`;
    enhancement += `- ${selected.conflict.description}\n`;
    const conflictExample = randomPick(selected.conflict.examples);
    if (conflictExample) {
      enhancement += `- Example: ${conflictExample}\n\n`;
    }
  }

  if (selected.theme) {
    enhancement += `**Underlying Theme:** ${selected.theme.name}\n`;
    enhancement += `- Message: ${selected.theme.message}\n\n`;
  }

  if (selected.vibe) {
    enhancement += `**Atmosphere/Tone:** ${selected.vibe.name} (${selected.vibe.mood})\n`;
    enhancement += `- Tone descriptors: ${selected.vibe.tone_descriptors
      .slice(0, 3)
      .join(", ")}\n\n`;
  }

  if (selected.genre) {
    enhancement += `**Genre Elements:** ${selected.genre.name}\n`;
    enhancement += `- Characteristics: ${selected.genre.characteristics.join(
      ", "
    )}\n\n`;
  }

  if (selected.storytellingMode) {
    enhancement += `**Storytelling Mode:** ${selected.storytellingMode.name}\n`;
    enhancement += `- ${selected.storytellingMode.description}\n`;
    enhancement += `- Example: "${selected.storytellingMode.example}"\n\n`;
  }

  if (selected.narrativeStructure) {
    enhancement += `**Narrative Structure:** ${selected.narrativeStructure.name}\n`;
    enhancement += `- ${selected.narrativeStructure.description}\n`;
    enhancement += `- Pattern: ${selected.narrativeStructure.pattern}\n\n`;
  }

  if (selected.pacing) {
    enhancement += `**Pacing:** ${selected.pacing.name}\n`;
    enhancement += `- Characteristics: ${selected.pacing.characteristics.join(
      ", "
    )}\n\n`;
  }

  enhancement += `**Important:** These elements are suggestions to inspire creativity. Adapt them naturally to fit the mathematical content and educational goals. Not all elements need to be explicitly included.\n`;

  return enhancement;
}

/**
 * Generates complete story inspiration enhancement
 * @param difficultyLevel Difficulty level
 * @param targetGroup Target audience
 * @param customKeywords Optional custom keywords
 * @returns Complete enhancement with selected elements and prompt text
 */
export function generateStoryInspiration(
  difficultyLevel: DifficultyLevel,
  targetGroup: TargetGroup,
  customKeywords: string[] = []
): StoryInspirationEnhancement {
  const selected = generateInspiration(
    difficultyLevel,
    targetGroup,
    customKeywords
  );
  const promptAdditions = buildPromptEnhancement(selected);

  return {
    selected,
    promptAdditions,
  };
}
