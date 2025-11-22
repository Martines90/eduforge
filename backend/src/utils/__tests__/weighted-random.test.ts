/**
 * Unit tests for Weighted Random Utility
 */

import {
  weightedRandomPick,
  randomPick,
  adjustWeightsForDifficulty,
} from "../weighted-random";

describe("Weighted Random Utility", () => {
  describe("weightedRandomPick", () => {
    interface TestItem {
      id: string;
      name: string;
    }

    const items: TestItem[] = [
      { id: "a", name: "Item A" },
      { id: "b", name: "Item B" },
      { id: "c", name: "Item C" },
    ];

    it("should pick an item from the list", () => {
      const weights = { a: 1, b: 1, c: 1 };
      const result = weightedRandomPick(items, weights, (item) => item.id);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(items).toContainEqual(result);
    });

    it("should return null for empty array", () => {
      const weights = {};
      const result = weightedRandomPick<TestItem>(
        [],
        weights,
        (item) => item.id
      );

      expect(result).toBeNull();
    });

    it("should respect weights (higher weight = more likely)", () => {
      // Give 'a' much higher weight: 100 vs 1 vs 1 = ~98% vs ~1% vs ~1%
      const weights = { a: 100, b: 1, c: 1 };
      const picks: string[] = [];

      // Pick 1000 times to get statistically significant results
      for (let i = 0; i < 1000; i++) {
        const result = weightedRandomPick(items, weights, (item) => item.id);
        if (result) picks.push(result.id);
      }

      const aCount = picks.filter((id) => id === "a").length;
      const bCount = picks.filter((id) => id === "b").length;
      const cCount = picks.filter((id) => id === "c").length;

      // With weights 100:1:1, we expect ~980:~10:~10 distribution
      // 'a' should be picked at least 900 times (very conservative)
      expect(aCount).toBeGreaterThan(900);
      // 'b' and 'c' together should be less than 100
      expect(bCount + cCount).toBeLessThan(100);
      // 'a' should be MUCH more frequent than b or c individually
      expect(aCount).toBeGreaterThan(bCount * 50);
      expect(aCount).toBeGreaterThan(cCount * 50);
    });

    it("should demonstrate actual weight proportions", () => {
      // Test with 3:2:1 ratio
      const weights = { a: 3, b: 2, c: 1 };
      const picks: string[] = [];

      // Pick 6000 times for clear statistical distribution
      for (let i = 0; i < 6000; i++) {
        const result = weightedRandomPick(items, weights, (item) => item.id);
        if (result) picks.push(result.id);
      }

      const aCount = picks.filter((id) => id === "a").length;
      const bCount = picks.filter((id) => id === "b").length;
      const cCount = picks.filter((id) => id === "c").length;

      // With 3:2:1 ratio (total weight 6):
      // Expected: a=50%, b=33.3%, c=16.7%
      // In 6000 picks: a≈3000, b≈2000, c≈1000

      // Test that 'a' is roughly 1.5x more than 'b' (allow ±20% variance)
      const aToB = aCount / bCount;
      expect(aToB).toBeGreaterThan(1.2); // At least 1.2x
      expect(aToB).toBeLessThan(1.8); // At most 1.8x (expected 1.5x)

      // Test that 'b' is roughly 2x more than 'c' (allow ±25% variance)
      const bToC = bCount / cCount;
      expect(bToC).toBeGreaterThan(1.5); // At least 1.5x
      expect(bToC).toBeLessThan(2.5); // At most 2.5x (expected 2x)

      // Test that 'a' is roughly 3x more than 'c'
      const aToC = aCount / cCount;
      expect(aToC).toBeGreaterThan(2.5); // At least 2.5x
      expect(aToC).toBeLessThan(3.5); // At most 3.5x (expected 3x)
    });

    it("should use _other fallback for items without specific weights", () => {
      const weights = { a: 1, _other: 1 };
      const result = weightedRandomPick(items, weights, (item) => item.id);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it("should handle zero weights by excluding items", () => {
      const weights = { a: 0, b: 1, c: 1 };
      const picks: string[] = [];

      // Pick 10 times
      for (let i = 0; i < 10; i++) {
        const result = weightedRandomPick(items, weights, (item) => item.id);
        if (result) picks.push(result.id);
      }

      // 'a' should never be picked
      expect(picks).not.toContain("a");
    });
  });

  describe("randomPick", () => {
    it("should pick an item from array", () => {
      const items = ["apple", "banana", "orange"];
      const result = randomPick(items);

      expect(result).toBeDefined();
      expect(items).toContain(result);
    });

    it("should return null for empty array", () => {
      const result = randomPick([]);
      expect(result).toBeNull();
    });

    it("should distribute picks across all items", () => {
      const items = ["a", "b", "c"];
      const picks: string[] = [];

      // Pick many times
      for (let i = 0; i < 30; i++) {
        const result = randomPick(items);
        if (result) picks.push(result);
      }

      // All items should appear at least once (very high probability)
      expect(picks).toContain("a");
      expect(picks).toContain("b");
      expect(picks).toContain("c");
    });
  });

  describe("adjustWeightsForDifficulty", () => {
    it("should boost specified IDs", () => {
      const weights = { a: 10, b: 10, c: 10 };
      const adjusted = adjustWeightsForDifficulty(weights, ["a"], [], 2, 1);

      expect(adjusted.a).toBeGreaterThan(weights.a);
      expect(adjusted.b).toBe(weights.b);
      expect(adjusted.c).toBe(weights.c);
    });

    it("should penalize specified IDs", () => {
      const weights = { a: 10, b: 10, c: 10 };
      const adjusted = adjustWeightsForDifficulty(weights, [], ["a"], 1, 0.5);

      expect(adjusted.a).toBeLessThan(weights.a);
      expect(adjusted.b).toBe(weights.b);
      expect(adjusted.c).toBe(weights.c);
    });

    it("should handle both boost and penalize", () => {
      const weights = { a: 10, b: 10, c: 10 };
      const adjusted = adjustWeightsForDifficulty(
        weights,
        ["a"],
        ["c"],
        2,
        0.5
      );

      expect(adjusted.a).toBeGreaterThan(weights.a);
      expect(adjusted.b).toBe(weights.b);
      expect(adjusted.c).toBeLessThan(weights.c);
    });

    it("should not modify original weights object", () => {
      const weights = { a: 10, b: 10, c: 10 };
      const originalA = weights.a;

      adjustWeightsForDifficulty(weights, ["a"], [], 2, 1);

      expect(weights.a).toBe(originalA); // Original unchanged
    });

    it("should handle IDs not in weights gracefully", () => {
      const weights = { a: 10, b: 10 };
      const adjusted = adjustWeightsForDifficulty(
        weights,
        ["nonexistent"],
        [],
        2,
        1
      );

      expect(adjusted.a).toBe(weights.a);
      expect(adjusted.b).toBe(weights.b);
    });
  });
});
