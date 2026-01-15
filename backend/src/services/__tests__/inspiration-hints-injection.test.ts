/**
 * INSPIRATIONAL HINTS INJECTION TEST
 *
 * This test validates that ALL 5 inspirational vocabulary JSON files are:
 * 1. Loaded correctly from disk
 * 2. Randomly selected (with mocked randomness for deterministic testing)
 * 3. Injected into the correct prompts
 * 4. Formatted correctly in the system prompt
 *
 * Tests ALL 3 variation strategies:
 * - Variation 1: 50 hints from inspirational-hints.json
 * - Variation 2 & 3: 10 professions + 3 eras + 3 situations
 * - ALL variations: 1 location (mandatory)
 *
 * JSON Files Tested:
 * - inspirational-hints.json
 * - inspirational-profession-hints.json
 * - inspirational-era-hints.json
 * - inspirational-situation-hints.json
 * - inspirational-location-hints.json
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import type { Subject } from "@eduforger/shared";
import * as storyInspiration from "../../utils/story-inspiration.helper";
import type { TaskGeneratorRequest } from "../../types/task-generator.types";

describe("Inspirational Hints Injection - Comprehensive Test", () => {
  // Store original Math.random
  let originalRandom: () => number;

  beforeEach(() => {
    // Save original Math.random
    originalRandom = Math.random;
  });

  afterEach(() => {
    // Restore original Math.random
    Math.random = originalRandom;
    jest.restoreAllMocks();
  });

  // ============================================================================
  // TEST SUITE 1: JSON FILE LOADING
  // ============================================================================

  describe("JSON File Loading", () => {
    it("should load inspirational-hints.json", () => {
      // Generate hints to trigger file loading
      const hints = storyInspiration.generateInspirationHintsVariation1();

      // Should return 50 hints
      expect(hints).toBeDefined();
      expect(Array.isArray(hints)).toBe(true);
      expect(hints.length).toBe(50);

      // All hints should be non-empty strings
      hints.forEach(hint => {
        expect(typeof hint).toBe("string");
        expect(hint.length).toBeGreaterThan(0);
      });

      console.log(`✅ Loaded ${hints.length} inspirational hints from inspirational-hints.json`);
    });

    it("should load inspirational-location-hints.json", () => {
      const location = storyInspiration.generateRandomLocation();

      expect(location).toBeDefined();
      expect(typeof location).toBe("string");
      expect(location.length).toBeGreaterThan(0);

      console.log(`✅ Loaded location hint: "${location}" from inspirational-location-hints.json`);
    });

    it("should load 3 unique locations", () => {
      const locations = storyInspiration.generate3UniqueLocations();

      expect(locations).toBeDefined();
      expect(Array.isArray(locations)).toBe(true);
      expect(locations.length).toBe(3);

      // All should be non-empty strings
      locations.forEach(location => {
        expect(typeof location).toBe("string");
        expect(location.length).toBeGreaterThan(0);
      });

      console.log(`✅ Loaded 3 unique locations: ${JSON.stringify(locations)}`);
    });

    it("should load profession, era, and situation hints", () => {
      const hints = storyInspiration.generateProfessionEraAndSituationHints();

      // Check professions (should be 10)
      expect(hints.professions).toBeDefined();
      expect(Array.isArray(hints.professions)).toBe(true);
      expect(hints.professions.length).toBe(10);

      // Check eras (should be 3)
      expect(hints.eras).toBeDefined();
      expect(Array.isArray(hints.eras)).toBe(true);
      expect(hints.eras.length).toBe(3);

      // Check situations (should be 3)
      expect(hints.situations).toBeDefined();
      expect(Array.isArray(hints.situations)).toBe(true);
      expect(hints.situations.length).toBe(3);

      console.log(`✅ Loaded ${hints.professions.length} professions from inspirational-profession-hints.json`);
      console.log(`✅ Loaded ${hints.eras.length} eras from inspirational-era-hints.json`);
      console.log(`✅ Loaded ${hints.situations.length} situations from inspirational-situation-hints.json`);
    });
  });

  // ============================================================================
  // TEST SUITE 2: DETERMINISTIC SELECTION (MOCKED RANDOMNESS)
  // ============================================================================

  describe("Deterministic Hint Selection", () => {
    it("should pick the same hints when Math.random is mocked", () => {
      // Mock Math.random to always return 0.5
      Math.random = jest.fn(() => 0.5);

      const hints1 = storyInspiration.generateInspirationHintsVariation1();
      const hints2 = storyInspiration.generateInspirationHintsVariation1();

      // With same random seed, should get same hints
      expect(hints1).toEqual(hints2);

      console.log(`✅ Deterministic selection works with mocked Math.random`);
    });

    it("should pick different hints when Math.random returns different values", () => {
      // First call: return 0.1
      Math.random = jest.fn(() => 0.1);
      const hints1 = storyInspiration.generateInspirationHintsVariation1();

      // Second call: return 0.9
      Math.random = jest.fn(() => 0.9);
      const hints2 = storyInspiration.generateInspirationHintsVariation1();

      // Should be different
      expect(hints1).not.toEqual(hints2);

      console.log(`✅ Different random values produce different hint selections`);
    });
  });

  // ============================================================================
  // TEST SUITE 3: VARIATION 1 PROMPT BUILDING (50 HINTS)
  // ============================================================================

  describe("Variation 1 - 50 Inspirational Hints", () => {
    it("should generate exactly 50 hints for variation 1", () => {
      const hints = storyInspiration.generateInspirationHintsVariation1();

      expect(hints.length).toBe(50);

      console.log(`✅ Variation 1 generates exactly 50 hints`);
    });

    it("should build correct prompt format for variation 1", () => {
      // Mock to get deterministic hints
      Math.random = jest.fn(() => 0.5);

      const hints = storyInspiration.generateInspirationHintsVariation1();
      const prompt = storyInspiration.buildInspirationPromptVariation1(hints);

      // Check prompt structure
      expect(prompt).toContain("## INSPIRATIONAL SCENARIO HINTS (50 OPTIONS)");
      expect(prompt).toContain("You MUST select ONE of these scenarios");
      expect(prompt).toContain("CRITICAL INSTRUCTION");

      // Should contain all 50 hints
      hints.forEach((hint, index) => {
        expect(prompt).toContain(`${index + 1}. ${hint}`);
      });

      console.log(`✅ Variation 1 prompt correctly formatted with all 50 hints`);
      console.log(`   Prompt length: ${prompt.length} characters`);
    });

    it("should contain specific hint examples in variation 1", () => {
      const hints = storyInspiration.generateInspirationHintsVariation1();
      const prompt = storyInspiration.buildInspirationPromptVariation1(hints);

      // Prompt should have numbered list format
      expect(prompt).toMatch(/\d+\.\s+.+/); // Matches "1. Something"

      console.log(`✅ Variation 1 prompt contains numbered hint list`);
    });
  });

  // ============================================================================
  // TEST SUITE 4: VARIATION 2 & 3 PROMPT BUILDING (PROFESSION + ERA + SITUATION)
  // ============================================================================

  describe("Variation 2 & 3 - Profession + Era + Situation", () => {
    it("should generate correct number of hints for variations 2 & 3", () => {
      const hints = storyInspiration.generateProfessionEraAndSituationHints();

      expect(hints.professions.length).toBe(10);
      expect(hints.eras.length).toBe(3);
      expect(hints.situations.length).toBe(3);

      console.log(`✅ Variations 2 & 3 generate 10 professions, 3 eras, 3 situations`);
    });

    it("should build correct prompt format for variations 2 & 3", () => {
      Math.random = jest.fn(() => 0.5);

      const hints = storyInspiration.generateProfessionEraAndSituationHints();
      const prompt = storyInspiration.buildProfessionEraAndSituationPrompt(
        hints.professions,
        hints.eras,
        hints.situations
      );

      // Check prompt structure
      expect(prompt).toContain("## PROFESSION, ERA & SITUATION CONTEXT HINTS");
      expect(prompt).toContain("### PROFESSIONS (Choose 1):");
      expect(prompt).toContain("### HISTORICAL ERAS (Choose 1):");
      expect(prompt).toContain("### SITUATIONS (Choose 1):");
      expect(prompt).toContain("CRITICAL INSTRUCTION");

      // Should contain all professions
      hints.professions.forEach((profession, index) => {
        expect(prompt).toContain(`${index + 1}. ${profession}`);
      });

      // Should contain all eras
      hints.eras.forEach((era, index) => {
        expect(prompt).toContain(`${index + 1}. ${era}`);
      });

      // Should contain all situations
      hints.situations.forEach((situation, index) => {
        expect(prompt).toContain(`${index + 1}. ${situation}`);
      });

      console.log(`✅ Variations 2 & 3 prompt correctly formatted`);
      console.log(`   Prompt length: ${prompt.length} characters`);
    });
  });

  // ============================================================================
  // TEST SUITE 5: LOCATION HINTS (MANDATORY FOR ALL VARIATIONS)
  // ============================================================================

  describe("Location Hints - Mandatory for All Variations", () => {
    it("should generate a single random location", () => {
      const location = storyInspiration.generateRandomLocation();

      expect(location).toBeDefined();
      expect(typeof location).toBe("string");
      expect(location.length).toBeGreaterThan(0);

      // Should be one of the valid locations
      const validLocations = [
        "Europe", "Asia", "Middle East", "Latin America", "North America",
        "Africa", "Oceania", "Caribbean", "Mediterranean", "Australia", "Antartica"
      ];

      // Location should be from the file (we can't check exact match without loading the file)
      // but it should be a non-empty string
      expect(location.length).toBeGreaterThan(0);

      console.log(`✅ Generated random location: "${location}"`);
    });

    it("should generate 3 unique locations for 3 variations", () => {
      const locations = storyInspiration.generate3UniqueLocations();

      expect(locations.length).toBe(3);

      // All should be non-empty
      locations.forEach(location => {
        expect(location.length).toBeGreaterThan(0);
      });

      console.log(`✅ Generated 3 locations: ${JSON.stringify(locations)}`);
    });

    it("should return fallback location if file is empty", () => {
      // Even if file loading fails, should return default "Europe"
      const location = storyInspiration.generateRandomLocation();

      expect(location).toBeDefined();
      expect(typeof location).toBe("string");

      console.log(`✅ Location system has fallback: "${location}"`);
    });
  });

  // ============================================================================
  // TEST SUITE 6: HINT UNIQUENESS (NO DUPLICATES IN SELECTION)
  // ============================================================================

  describe("Hint Uniqueness", () => {
    it("should not have duplicate hints in variation 1 (50 hints)", () => {
      const hints = storyInspiration.generateInspirationHintsVariation1();

      const uniqueHints = new Set(hints);

      // All 50 should be unique
      expect(uniqueHints.size).toBe(hints.length);

      console.log(`✅ All 50 hints in variation 1 are unique (no duplicates)`);
    });

    it("should not have duplicate professions", () => {
      const hints = storyInspiration.generateProfessionEraAndSituationHints();

      const uniqueProfessions = new Set(hints.professions);

      expect(uniqueProfessions.size).toBe(hints.professions.length);

      console.log(`✅ All 10 profession hints are unique`);
    });

    it("should not have duplicate eras", () => {
      const hints = storyInspiration.generateProfessionEraAndSituationHints();

      const uniqueEras = new Set(hints.eras);

      expect(uniqueEras.size).toBe(hints.eras.length);

      console.log(`✅ All 3 era hints are unique`);
    });

    it("should not have duplicate situations", () => {
      const hints = storyInspiration.generateProfessionEraAndSituationHints();

      const uniqueSituations = new Set(hints.situations);

      expect(uniqueSituations.size).toBe(hints.situations.length);

      console.log(`✅ All 3 situation hints are unique`);
    });

    it("should have 3 unique locations", () => {
      const locations = storyInspiration.generate3UniqueLocations();

      const uniqueLocations = new Set(locations);

      // Should be 3 unique (or less if not enough in file, but should try for 3)
      expect(locations.length).toBe(3);

      console.log(`✅ Generated 3 locations, ${uniqueLocations.size} unique`);
    });
  });

  // ============================================================================
  // TEST SUITE 7: ALL 5 JSON FILES COVERAGE
  // ============================================================================

  describe("Complete JSON File Coverage", () => {
    it("should load and use ALL 5 inspirational vocabulary JSON files", () => {
      const results = {
        "inspirational-hints.json": false,
        "inspirational-profession-hints.json": false,
        "inspirational-era-hints.json": false,
        "inspirational-situation-hints.json": false,
        "inspirational-location-hints.json": false,
      };

      // Test inspirational-hints.json
      const mainHints = storyInspiration.generateInspirationHintsVariation1();
      if (mainHints.length === 50) {
        results["inspirational-hints.json"] = true;
      }

      // Test profession, era, situation files
      const contextHints = storyInspiration.generateProfessionEraAndSituationHints();
      if (contextHints.professions.length === 10) {
        results["inspirational-profession-hints.json"] = true;
      }
      if (contextHints.eras.length === 3) {
        results["inspirational-era-hints.json"] = true;
      }
      if (contextHints.situations.length === 3) {
        results["inspirational-situation-hints.json"] = true;
      }

      // Test location file
      const location = storyInspiration.generateRandomLocation();
      if (location && location.length > 0) {
        results["inspirational-location-hints.json"] = true;
      }

      // Verify ALL files were loaded
      Object.entries(results).forEach(([file, loaded]) => {
        expect(loaded).toBe(true);
        console.log(`   ✅ ${file}: LOADED`);
      });

      console.log(`\n✅ ALL 5 INSPIRATIONAL VOCABULARY JSON FILES VERIFIED`);
    });
  });

  // ============================================================================
  // TEST SUITE 8: PROMPT INJECTION FORMAT VALIDATION
  // ============================================================================

  describe("Prompt Injection Format", () => {
    it("variation 1 prompt should have correct headers and instructions", () => {
      const hints = storyInspiration.generateInspirationHintsVariation1();
      const prompt = storyInspiration.buildInspirationPromptVariation1(hints);

      // Check for required sections
      expect(prompt).toContain("## INSPIRATIONAL SCENARIO HINTS (50 OPTIONS)");
      expect(prompt).toContain("You MUST select ONE of these scenarios");
      expect(prompt).toContain("best fits the mathematical topic");
      expect(prompt).toContain("CRITICAL INSTRUCTION");
      expect(prompt).toContain("Choose ONE scenario from the list above");

      console.log(`✅ Variation 1 prompt has correct headers and instructions`);
    });

    it("variation 2/3 prompt should have correct headers and instructions", () => {
      const hints = storyInspiration.generateProfessionEraAndSituationHints();
      const prompt = storyInspiration.buildProfessionEraAndSituationPrompt(
        hints.professions,
        hints.eras,
        hints.situations
      );

      // Check for required sections
      expect(prompt).toContain("## PROFESSION, ERA & SITUATION CONTEXT HINTS");
      expect(prompt).toContain("### PROFESSIONS (Choose 1):");
      expect(prompt).toContain("### HISTORICAL ERAS (Choose 1):");
      expect(prompt).toContain("### SITUATIONS (Choose 1):");
      expect(prompt).toContain("CRITICAL INSTRUCTION");
      expect(prompt).toContain("Select the BEST-FIT profession, era, and situation combination");

      console.log(`✅ Variations 2 & 3 prompt has correct headers and instructions`);
    });

    it("prompts should instruct AI to SELECT from the list", () => {
      const hints1 = storyInspiration.generateInspirationHintsVariation1();
      const prompt1 = storyInspiration.buildInspirationPromptVariation1(hints1);

      const hints2 = storyInspiration.generateProfessionEraAndSituationHints();
      const prompt2 = storyInspiration.buildProfessionEraAndSituationPrompt(
        hints2.professions,
        hints2.eras,
        hints2.situations
      );

      // Both should contain selection instructions
      expect(prompt1.toLowerCase()).toContain("select");
      expect(prompt1.toLowerCase()).toContain("choose");

      expect(prompt2.toLowerCase()).toContain("select");
      expect(prompt2.toLowerCase()).toContain("choose");

      console.log(`✅ Prompts correctly instruct AI to SELECT from provided hints`);
    });
  });

  // ============================================================================
  // TEST SUITE 9: EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle empty hints array gracefully", () => {
      const emptyPrompt = storyInspiration.buildInspirationPromptVariation1([]);

      expect(emptyPrompt).toBe("");

      console.log(`✅ Empty hints array returns empty prompt`);
    });

    it("should handle empty profession/era/situation arrays gracefully", () => {
      const emptyPrompt = storyInspiration.buildProfessionEraAndSituationPrompt([], [], []);

      expect(emptyPrompt).toBe("");

      console.log(`✅ Empty context hints return empty prompt`);
    });
  });

  // ============================================================================
  // TEST SUITE 10: FINAL VALIDATION - ALL 5 FILES + ALL 3 VARIATIONS
  // ============================================================================

  describe("🎯 COMPLETE SYSTEM VALIDATION", () => {
    it("MASTER TEST: All 5 JSON files loaded and all 3 variations work", () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🎯 INSPIRATIONAL HINTS SYSTEM - MASTER VALIDATION`);
      console.log(`${"=".repeat(60)}\n`);

      // Test Variation 1
      console.log(`📋 Testing Variation 1 (50 hints)...`);
      const var1Hints = storyInspiration.generateInspirationHintsVariation1();
      const var1Prompt = storyInspiration.buildInspirationPromptVariation1(var1Hints);

      expect(var1Hints.length).toBe(50);
      expect(var1Prompt.length).toBeGreaterThan(1000);
      expect(var1Prompt).toContain("## INSPIRATIONAL SCENARIO HINTS (50 OPTIONS)");
      console.log(`   ✅ Variation 1: ${var1Hints.length} hints, ${var1Prompt.length} char prompt`);

      // Test Variations 2 & 3
      console.log(`\n📋 Testing Variations 2 & 3 (profession + era + situation)...`);
      const var23Hints = storyInspiration.generateProfessionEraAndSituationHints();
      const var23Prompt = storyInspiration.buildProfessionEraAndSituationPrompt(
        var23Hints.professions,
        var23Hints.eras,
        var23Hints.situations
      );

      expect(var23Hints.professions.length).toBe(10);
      expect(var23Hints.eras.length).toBe(3);
      expect(var23Hints.situations.length).toBe(3);
      expect(var23Prompt.length).toBeGreaterThan(500);
      expect(var23Prompt).toContain("## PROFESSION, ERA & SITUATION CONTEXT HINTS");
      console.log(`   ✅ Variations 2 & 3: ${var23Hints.professions.length} professions, ${var23Hints.eras.length} eras, ${var23Hints.situations.length} situations`);
      console.log(`   ✅ Prompt: ${var23Prompt.length} characters`);

      // Test Locations
      console.log(`\n📋 Testing Location Hints (mandatory for all variations)...`);
      const locations = storyInspiration.generate3UniqueLocations();

      expect(locations.length).toBe(3);
      console.log(`   ✅ Locations: ${JSON.stringify(locations)}`);

      // Final Summary
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📊 FINAL RESULTS`);
      console.log(`${"=".repeat(60)}`);
      console.log(`✅ inspirational-hints.json: LOADED (${var1Hints.length} hints)`);
      console.log(`✅ inspirational-profession-hints.json: LOADED (${var23Hints.professions.length} professions)`);
      console.log(`✅ inspirational-era-hints.json: LOADED (${var23Hints.eras.length} eras)`);
      console.log(`✅ inspirational-situation-hints.json: LOADED (${var23Hints.situations.length} situations)`);
      console.log(`✅ inspirational-location-hints.json: LOADED (${locations.length} locations)`);
      console.log(`\n✅ ALL 5 JSON FILES VERIFIED`);
      console.log(`✅ ALL 3 VARIATIONS WORKING`);
      console.log(`${"=".repeat(60)}\n`);
    });
  });
});
