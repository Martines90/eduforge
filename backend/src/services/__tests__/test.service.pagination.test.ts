/**
 * Unit tests for Test Service - Pagination
 * Tests pagination functionality for getUserTests
 */

import * as testService from "../test.service";
import { getFirestore } from "../../config/firebase.config";

// Mock Firestore
jest.mock("../../config/firebase.config");

describe("Test Service - Pagination", () => {
  let mockFirestore: any;
  let mockCollection: any;
  let mockQuery: any;
  let mockQuerySnapshot: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock query snapshot
    mockQuerySnapshot = {
      size: 25,
      docs: Array.from({ length: 10 }, (_, i) => ({
        id: `test-${i}`,
        data: () => ({
          name: `Test ${i}`,
          subject: "mathematics",
          createdBy: "user-123",
          country: "HU",
          taskCount: 5,
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      })),
      empty: false,
    };

    // Create mock query
    mockQuery = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue(mockQuerySnapshot),
    };

    // Create mock collection
    mockCollection = {
      where: jest.fn().mockReturnValue(mockQuery),
    };

    // Create mock Firestore
    mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe("getUserTests with pagination", () => {
    it("should apply default limit of 50", async () => {
      await testService.getUserTests("user-123", "HU", {});

      expect(mockQuery.limit).toHaveBeenCalledWith(50);
      expect(mockQuery.offset).toHaveBeenCalledWith(0);
    });

    it("should apply custom limit", async () => {
      await testService.getUserTests("user-123", "HU", { limit: 10 });

      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it("should apply custom offset", async () => {
      await testService.getUserTests("user-123", "HU", { offset: 20 });

      expect(mockQuery.offset).toHaveBeenCalledWith(20);
    });

    it("should apply both limit and offset", async () => {
      await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 30,
      });

      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.offset).toHaveBeenCalledWith(30);
    });

    it("should return correct pagination metadata", async () => {
      const result = await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 0,
      });

      expect(result).toMatchObject({
        total: 25,
        page: 1,
        limit: 10,
        hasMore: true,
      });
    });

    it("should calculate correct page number from offset", async () => {
      const result1 = await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 0,
      });
      expect(result1.page).toBe(1);

      const result2 = await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 10,
      });
      expect(result2.page).toBe(2);

      const result3 = await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 20,
      });
      expect(result3.page).toBe(3);
    });

    it("should indicate hasMore correctly when on last page", async () => {
      mockQuerySnapshot.size = 25;

      const resultLastPage = await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 20, // page 3 of 3
      });

      expect(resultLastPage.hasMore).toBe(false);
    });

    it("should indicate hasMore correctly when not on last page", async () => {
      mockQuerySnapshot.size = 25;

      const resultFirstPage = await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 0, // page 1 of 3
      });

      expect(resultFirstPage.hasMore).toBe(true);
    });

    it("should filter by user ID", async () => {
      await testService.getUserTests("user-123", "HU", {});

      expect(mockCollection.where).toHaveBeenCalledWith(
        "createdBy",
        "==",
        "user-123"
      );
    });

    it("should filter by subject if provided", async () => {
      await testService.getUserTests("user-123", "HU", {
        subject: "physics",
      });

      expect(mockQuery.where).toHaveBeenCalledWith("subject", "==", "physics");
    });

    it("should apply sorting by recent (default)", async () => {
      await testService.getUserTests("user-123", "HU", {});

      expect(mockQuery.orderBy).toHaveBeenCalledWith("updatedAt", "desc");
    });

    it("should apply sorting by name", async () => {
      await testService.getUserTests("user-123", "HU", { sort: "name" });

      expect(mockQuery.orderBy).toHaveBeenCalledWith("name", "asc");
    });

    it("should apply sorting by taskCount", async () => {
      await testService.getUserTests("user-123", "HU", { sort: "taskCount" });

      expect(mockQuery.orderBy).toHaveBeenCalledWith("taskCount", "desc");
    });

    it("should use correct collection path for country", async () => {
      await testService.getUserTests("user-123", "HU", {});

      expect(mockFirestore.collection).toHaveBeenCalledWith(
        "countries/HU/tests"
      );
    });

    it("should return array of tests", async () => {
      const result = await testService.getUserTests("user-123", "HU", {});

      expect(Array.isArray(result.tests)).toBe(true);
      expect(result.tests.length).toBe(10);
    });

    it("should return tests with IDs", async () => {
      const result = await testService.getUserTests("user-123", "HU", {});

      result.tests.forEach((test) => {
        expect(test).toHaveProperty("id");
        expect(test.id).toMatch(/^test-\d+$/);
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle empty results", async () => {
      mockQuerySnapshot.size = 0;
      mockQuerySnapshot.docs = [];
      mockQuerySnapshot.empty = true;

      const result = await testService.getUserTests("user-123", "HU", {});

      expect(result.tests).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("should handle exactly one page of results", async () => {
      mockQuerySnapshot.size = 10;

      const result = await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 0,
      });

      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(10);
    });

    it("should handle offset beyond total items", async () => {
      mockQuerySnapshot.size = 25;
      mockQuerySnapshot.docs = [];

      const result = await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 100,
      });

      expect(result.tests).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it("should handle very large limits", async () => {
      await testService.getUserTests("user-123", "HU", { limit: 1000 });

      expect(mockQuery.limit).toHaveBeenCalledWith(1000);
    });

    it("should handle limit of 1", async () => {
      const result = await testService.getUserTests("user-123", "HU", {
        limit: 1,
        offset: 0,
      });

      expect(result.page).toBe(1);
      expect(mockQuery.limit).toHaveBeenCalledWith(1);
    });
  });

  describe("Integration scenarios", () => {
    it("should support pagination through all pages", async () => {
      mockQuerySnapshot.size = 25;

      // Page 1
      const page1 = await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 0,
      });
      expect(page1.page).toBe(1);
      expect(page1.hasMore).toBe(true);

      // Page 2
      const page2 = await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 10,
      });
      expect(page2.page).toBe(2);
      expect(page2.hasMore).toBe(true);

      // Page 3 (last page)
      const page3 = await testService.getUserTests("user-123", "HU", {
        limit: 10,
        offset: 20,
      });
      expect(page3.page).toBe(3);
      expect(page3.hasMore).toBe(false);
    });

    it("should work with filtering and pagination", async () => {
      await testService.getUserTests("user-123", "HU", {
        subject: "physics",
        limit: 10,
        offset: 5,
      });

      expect(mockQuery.where).toHaveBeenCalledWith("subject", "==", "physics");
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.offset).toHaveBeenCalledWith(5);
    });

    it("should work with sorting and pagination", async () => {
      await testService.getUserTests("user-123", "HU", {
        sort: "name",
        limit: 20,
        offset: 40,
      });

      expect(mockQuery.orderBy).toHaveBeenCalledWith("name", "asc");
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(mockQuery.offset).toHaveBeenCalledWith(40);
    });
  });
});
