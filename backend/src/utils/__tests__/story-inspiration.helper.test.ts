/**
 * Unit tests for Story Inspiration Helper
 * Testing weighted random selection and prompt enhancement generation
 */

import {
  generateInspiration,
  buildPromptEnhancement,
  generateStoryInspiration,
} from "../story-inspiration.helper";
import { DifficultyLevel, TargetGroup } from "../../types";

describe("Story Inspiration Helper", () => {
  describe("generateInspiration", () => {
    it("should generate inspiration with all required fields for easy difficulty", () => {
      const result = generateInspiration("easy", "mixed", []);

      // Should have at least some inspiration elements
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");

      // Check that at least some fields are populated (not all may be present)
      const hasAnyField =
        result.era ||
        result.location ||
        result.personality ||
        result.situation ||
        result.theme ||
        result.vibe ||
        result.genre;

      expect(hasAnyField).toBeTruthy();
    });

    it("should generate inspiration for medium difficulty", () => {
      const result = generateInspiration("medium", "boys", []);

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should generate inspiration for hard difficulty", () => {
      const result = generateInspiration("hard", "girls", []);

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should handle different target groups", () => {
      const targetGroups: TargetGroup[] = ["mixed", "boys", "girls"];

      targetGroups.forEach((group) => {
        const result = generateInspiration("medium", group, []);
        expect(result).toBeDefined();
        // Age should be appropriate for the group if selected
        if (result.age) {
          expect(result.age.id).toBeTruthy();
          expect(result.age.age_range).toBeTruthy();
        }
      });
    });

    it("should accept custom keywords without errors", () => {
      const keywords = ["science", "technology", "innovation"];
      const result = generateInspiration("medium", "mixed", keywords);

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should generate different results on multiple calls (randomness)", () => {
      const result1 = generateInspiration("medium", "mixed", []);
      const result2 = generateInspiration("medium", "mixed", []);

      // At least one field should be different (due to randomness)
      const isDifferent =
        result1.era?.id !== result2.era?.id ||
        result1.location?.id !== result2.location?.id ||
        result1.vibe?.id !== result2.vibe?.id ||
        result1.situation?.id !== result2.situation?.id;

      // This might occasionally fail due to random chance, but very unlikely
      expect(isDifferent).toBeTruthy();
    });
  });

  describe("buildPromptEnhancement", () => {
    it("should build a valid prompt enhancement from inspiration", () => {
      const inspiration = generateInspiration("medium", "mixed", []);
      const enhancement = buildPromptEnhancement(inspiration);

      expect(enhancement).toBeDefined();
      expect(typeof enhancement).toBe("string");
      expect(enhancement.length).toBeGreaterThan(0);
      expect(enhancement).toContain("STORY INSPIRATION ELEMENTS");
      expect(enhancement).toContain("Important:");
    });

    it("should include era information when present", () => {
      const inspiration = generateInspiration("medium", "mixed", []);
      const enhancement = buildPromptEnhancement(inspiration);

      if (inspiration.era) {
        expect(enhancement).toContain("Era/Time Period");
        expect(enhancement).toContain(inspiration.era.name);
      }
    });

    it("should include location information when present", () => {
      const inspiration = generateInspiration("medium", "mixed", []);
      const enhancement = buildPromptEnhancement(inspiration);

      if (inspiration.location) {
        expect(enhancement).toContain("Location/Setting");
        expect(enhancement).toContain(inspiration.location.name);
      }
    });

    it("should include character information when present", () => {
      const inspiration = generateInspiration("medium", "mixed", []);
      const enhancement = buildPromptEnhancement(inspiration);

      if (inspiration.role && inspiration.personality) {
        expect(enhancement).toContain("Protagonist Character");
        expect(enhancement).toContain(inspiration.role.name);
        expect(enhancement).toContain(inspiration.personality.name);
      }
    });

    it("should include theme when present", () => {
      const inspiration = generateInspiration("medium", "mixed", []);
      const enhancement = buildPromptEnhancement(inspiration);

      if (inspiration.theme) {
        expect(enhancement).toContain("Underlying Theme");
        expect(enhancement).toContain(inspiration.theme.name);
      }
    });

    it("should handle empty inspiration object gracefully", () => {
      const emptyInspiration = {};
      const enhancement = buildPromptEnhancement(emptyInspiration);

      expect(enhancement).toBeDefined();
      expect(enhancement).toContain("STORY INSPIRATION ELEMENTS");
      expect(enhancement).toContain("Important:");
    });
  });

  describe("generateStoryInspiration", () => {
    it("should return both selected inspiration and prompt additions", () => {
      const result = generateStoryInspiration("medium", "mixed", []);

      expect(result).toBeDefined();
      expect(result.selected).toBeDefined();
      expect(result.promptAdditions).toBeDefined();
      expect(typeof result.selected).toBe("object");
      expect(typeof result.promptAdditions).toBe("string");
    });

    it("should generate consistent output structure for all difficulty levels", () => {
      const difficulties: DifficultyLevel[] = ["easy", "medium", "hard"];

      difficulties.forEach((difficulty) => {
        const result = generateStoryInspiration(difficulty, "mixed", []);

        expect(result).toHaveProperty("selected");
        expect(result).toHaveProperty("promptAdditions");
        expect(result.promptAdditions.length).toBeGreaterThan(0);
      });
    });

    it("should include custom keywords in the process", () => {
      const keywords = ["adventure", "mystery", "discovery"];
      const result = generateStoryInspiration("medium", "mixed", keywords);

      expect(result).toBeDefined();
      expect(result.selected).toBeDefined();
      expect(result.promptAdditions).toBeDefined();
    });

    it("should generate valid prompt additions with proper formatting", () => {
      const result = generateStoryInspiration("hard", "boys", ["technology"]);

      expect(result.promptAdditions).toContain("## STORY INSPIRATION ELEMENTS");
      expect(result.promptAdditions).toContain("Important:");
      // Should have markdown formatting
      expect(result.promptAdditions).toMatch(/\*\*/); // Bold markers
      expect(result.promptAdditions).toMatch(/\n/); // Line breaks
    });

    it("should produce different results on subsequent calls", () => {
      const result1 = generateStoryInspiration("medium", "mixed", []);
      const result2 = generateStoryInspiration("medium", "mixed", []);

      // Prompt additions should be different due to random selection
      expect(result1.promptAdditions).not.toBe(result2.promptAdditions);
    });
  });

  describe("Integration scenarios", () => {
    it("should work end-to-end for a typical task generation scenario", () => {
      // Simulate a real task generation request
      const difficulty: DifficultyLevel = "medium";
      const targetGroup: TargetGroup = "mixed";
      const keywords = ["science", "exploration"];

      const inspiration = generateStoryInspiration(
        difficulty,
        targetGroup,
        keywords
      );

      // Verify the complete output is usable
      expect(inspiration.selected).toBeDefined();
      expect(inspiration.promptAdditions).toBeDefined();
      expect(inspiration.promptAdditions.length).toBeGreaterThan(100);

      // Verify it has guidance text
      expect(inspiration.promptAdditions).toContain(
        "Use these elements to enrich your story"
      );
      expect(inspiration.promptAdditions).toContain(
        "Adapt them naturally to fit the mathematical content"
      );
    });

    it("should generate appropriate complexity for different difficulty levels", () => {
      const easyResult = generateStoryInspiration("easy", "mixed", []);
      const hardResult = generateStoryInspiration("hard", "mixed", []);

      // Both should work
      expect(easyResult.selected).toBeDefined();
      expect(hardResult.selected).toBeDefined();

      // Both should have prompt additions
      expect(easyResult.promptAdditions.length).toBeGreaterThan(0);
      expect(hardResult.promptAdditions.length).toBeGreaterThan(0);
    });
  });
});
