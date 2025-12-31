/**
 * Unit tests for Story Inspiration Helper
 * Testing random hint selection and prompt generation
 */

import {
  generateInspirationHints,
  buildInspirationPrompt,
  generateStoryInspiration,
} from "../story-inspiration.helper";
import { DifficultyLevel, TargetGroup } from "../../types";

describe("Story Inspiration Helper", () => {
  describe("generateInspirationHints", () => {
    it("should generate 10 random hints", () => {
      const hints = generateInspirationHints();

      expect(hints).toBeDefined();
      expect(Array.isArray(hints)).toBe(true);
      expect(hints.length).toBe(10);
    });

    it("should return strings as hints", () => {
      const hints = generateInspirationHints();

      hints.forEach((hint) => {
        expect(typeof hint).toBe("string");
        expect(hint.length).toBeGreaterThan(0);
      });
    });

    it("should generate different hints on multiple calls (randomness)", () => {
      const hints1 = generateInspirationHints();
      const hints2 = generateInspirationHints();

      // At least one hint should be different due to random selection
      const hasAnyDifference = hints1.some(
        (hint, index) => hint !== hints2[index]
      );
      expect(hasAnyDifference).toBe(true);
    });

    it("should accept optional parameters without errors", () => {
      const hints = generateInspirationHints("medium", "mixed", ["science"]);

      expect(hints).toBeDefined();
      expect(hints.length).toBe(10);
    });

    it("should work with different difficulty levels", () => {
      const difficulties: DifficultyLevel[] = ["easy", "medium", "hard"];

      difficulties.forEach((difficulty) => {
        const hints = generateInspirationHints(difficulty, "mixed", []);
        expect(hints).toBeDefined();
        expect(hints.length).toBe(10);
      });
    });
  });

  describe("buildInspirationPrompt", () => {
    it("should build a valid prompt from hints array", () => {
      const hints = generateInspirationHints();
      const prompt = buildInspirationPrompt(hints);

      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    });

    it("should include header and instructions", () => {
      const hints = generateInspirationHints();
      const prompt = buildInspirationPrompt(hints);

      expect(prompt).toContain("INSPIRATIONAL SCENARIO HINTS");
      expect(prompt).toContain("CRITICAL INSTRUCTION");
      expect(prompt).toContain("You MUST select ONE of these scenarios");
    });

    it("should list all hints with numbers", () => {
      const hints = generateInspirationHints();
      const prompt = buildInspirationPrompt(hints);

      hints.forEach((hint, index) => {
        expect(prompt).toContain(`${index + 1}. ${hint}`);
      });
    });

    it("should handle empty hints array gracefully", () => {
      const prompt = buildInspirationPrompt([]);

      expect(prompt).toBeDefined();
      expect(prompt).toBe("");
    });

    it("should format prompt with markdown", () => {
      const hints = ["NASA rocket launch", "Space station operation"];
      const prompt = buildInspirationPrompt(hints);

      expect(prompt).toMatch(/\*\*/); // Bold markers
      expect(prompt).toMatch(/\n/); // Line breaks
      expect(prompt).toContain("##"); // Markdown headers
    });
  });

  describe("generateStoryInspiration", () => {
    it("should return hints and prompt additions", () => {
      const result = generateStoryInspiration("medium", "mixed", []);

      expect(result).toBeDefined();
      expect(result.hints).toBeDefined();
      expect(result.promptAdditions).toBeDefined();
      expect(Array.isArray(result.hints)).toBe(true);
      expect(typeof result.promptAdditions).toBe("string");
    });

    it("should generate 10 hints", () => {
      const result = generateStoryInspiration("medium", "mixed", []);

      expect(result.hints.length).toBe(10);
    });

    it("should generate consistent output structure for all difficulty levels", () => {
      const difficulties: DifficultyLevel[] = ["easy", "medium", "hard"];

      difficulties.forEach((difficulty) => {
        const result = generateStoryInspiration(difficulty, "mixed", []);

        expect(result).toHaveProperty("hints");
        expect(result).toHaveProperty("promptAdditions");
        expect(result.hints.length).toBe(10);
        expect(result.promptAdditions.length).toBeGreaterThan(0);
      });
    });

    it("should work with different target groups", () => {
      const targetGroups: TargetGroup[] = ["mixed", "boys", "girls"];

      targetGroups.forEach((group) => {
        const result = generateStoryInspiration("medium", group, []);
        expect(result).toBeDefined();
        expect(result.hints.length).toBe(10);
      });
    });

    it("should accept custom keywords", () => {
      const keywords = ["adventure", "mystery", "discovery"];
      const result = generateStoryInspiration("medium", "mixed", keywords);

      expect(result).toBeDefined();
      expect(result.hints.length).toBe(10);
    });

    it("should generate valid prompt additions with proper formatting", () => {
      const result = generateStoryInspiration("hard", "boys", ["technology"]);

      expect(result.promptAdditions).toContain(
        "## INSPIRATIONAL SCENARIO HINTS"
      );
      expect(result.promptAdditions).toContain("CRITICAL INSTRUCTION");
      expect(result.promptAdditions).toMatch(/\*\*/); // Bold markers
      expect(result.promptAdditions).toMatch(/\n/); // Line breaks
    });

    it("should produce different results on subsequent calls", () => {
      const result1 = generateStoryInspiration("medium", "mixed", []);
      const result2 = generateStoryInspiration("medium", "mixed", []);

      // Hints should be different due to random selection
      const hasAnyDifference = result1.hints.some(
        (hint, index) => hint !== result2.hints[index]
      );
      expect(hasAnyDifference).toBe(true);
    });

    it("should work without parameters (optional)", () => {
      const result = generateStoryInspiration();

      expect(result).toBeDefined();
      expect(result.hints.length).toBe(10);
      expect(result.promptAdditions.length).toBeGreaterThan(0);
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
      expect(inspiration.hints).toBeDefined();
      expect(inspiration.promptAdditions).toBeDefined();
      expect(inspiration.hints.length).toBe(10);
      expect(inspiration.promptAdditions.length).toBeGreaterThan(100);

      // Verify it has guidance text
      expect(inspiration.promptAdditions).toContain(
        "scenario ideas to inspire your task design"
      );
      expect(inspiration.promptAdditions).toContain(
        "Choose ONE scenario from the list"
      );
    });

    it("should generate appropriate output for different difficulty levels", () => {
      const easyResult = generateStoryInspiration("easy", "mixed", []);
      const hardResult = generateStoryInspiration("hard", "mixed", []);

      // Both should work with same structure
      expect(easyResult.hints.length).toBe(10);
      expect(hardResult.hints.length).toBe(10);
      expect(easyResult.promptAdditions.length).toBeGreaterThan(0);
      expect(hardResult.promptAdditions.length).toBeGreaterThan(0);
    });

    it("should include all hints in the prompt additions", () => {
      const result = generateStoryInspiration("medium", "mixed", []);

      result.hints.forEach((hint) => {
        expect(result.promptAdditions).toContain(hint);
      });
    });
  });
});
