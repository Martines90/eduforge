/**
 * Weighted Random Selection Utility
 * Implements weighted random picking for story inspiration elements
 */

import { WeightCategory } from "../types";

/**
 * Performs weighted random selection from a list of items
 * @param items Array of items to select from
 * @param weights Weight configuration object with item IDs as keys
 * @param getId Function to extract ID from an item
 * @returns Randomly selected item based on weights
 */
export function weightedRandomPick<T>(
  items: T[],
  weights: WeightCategory,
  getId: (item: T) => string
): T | null {
  if (items.length === 0) {
    return null;
  }

  // Calculate total weight
  let totalWeight = 0;
  const itemWeights: { item: T; weight: number }[] = [];

  for (const item of items) {
    const id = getId(item);
    // Use specific weight or _other if not found
    const weight =
      weights[id] !== undefined ? weights[id] : weights["_other"] || 1;

    if (weight > 0) {
      totalWeight += weight;
      itemWeights.push({ item, weight });
    }
  }

  if (totalWeight === 0 || itemWeights.length === 0) {
    // Fallback to uniform random if no valid weights
    return items[Math.floor(Math.random() * items.length)];
  }

  // Pick a random value between 0 and totalWeight
  let random = Math.random() * totalWeight;

  // Find the item that corresponds to this random value
  for (const { item, weight } of itemWeights) {
    random -= weight;
    if (random <= 0) {
      return item;
    }
  }

  // Fallback (should never reach here)
  return itemWeights[itemWeights.length - 1].item;
}

/**
 * Picks multiple unique items using weighted random selection
 * @param items Array of items to select from
 * @param weights Weight configuration
 * @param getId Function to extract ID from an item
 * @param count Number of items to select
 * @returns Array of selected items
 */
export function weightedRandomPickMultiple<T>(
  items: T[],
  weights: WeightCategory,
  getId: (item: T) => string,
  count: number
): T[] {
  if (count >= items.length) {
    return [...items];
  }

  const selected: T[] = [];
  const remaining = [...items];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const picked = weightedRandomPick(remaining, weights, getId);
    if (picked) {
      selected.push(picked);
      // Remove picked item from remaining
      const index = remaining.findIndex(
        (item) => getId(item) === getId(picked)
      );
      if (index !== -1) {
        remaining.splice(index, 1);
      }
    }
  }

  return selected;
}

/**
 * Adjusts weights based on difficulty level
 * @param weights Original weights
 * @param boostIds IDs to boost
 * @param penalizeIds IDs to penalize
 * @param boostFactor Multiplier for boost (default 1.5)
 * @param penalizeFactor Multiplier for penalize (default 0.5)
 * @returns Adjusted weights
 */
export function adjustWeightsForDifficulty(
  weights: WeightCategory,
  boostIds: string[] = [],
  penalizeIds: string[] = [],
  boostFactor: number = 1.5,
  penalizeFactor: number = 0.5
): WeightCategory {
  const adjusted: WeightCategory = { ...weights };

  for (const id of boostIds) {
    if (adjusted[id] !== undefined) {
      adjusted[id] = Math.round(adjusted[id] * boostFactor);
    }
  }

  for (const id of penalizeIds) {
    if (adjusted[id] !== undefined) {
      adjusted[id] = Math.round(adjusted[id] * penalizeFactor);
    }
  }

  return adjusted;
}

/**
 * Picks a random element from an array (uniform distribution)
 * @param items Array of items
 * @returns Randomly selected item or null if array is empty
 */
export function randomPick<T>(items: T[]): T | null {
  if (items.length === 0) {
    return null;
  }
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Picks multiple random unique elements from an array
 * @param items Array of items
 * @param count Number of items to pick
 * @returns Array of selected items
 */
export function randomPickMultiple<T>(items: T[], count: number): T[] {
  if (count >= items.length) {
    return [...items];
  }

  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
