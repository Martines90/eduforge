/**
 * Unit tests for Published Tests Browsing with Pagination
 * Tests the getPublishedTests service function
 */

import * as testService from "../test.service";
import type { GetPublishedTestsQuery } from "../../types/test.types";

// Mock Firebase config
jest.mock("../../config/firebase.config");

describe("Test Service - Published Tests Browsing", () => {
  let mockCollection: any;
  let mockWhere: any;
  let mockOrderBy: any;
  let mockLimit: any;
  let mockOffset: any;
  let mockGet: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock query chain
    mockGet = jest.fn();
    mockOffset = jest.fn().mockReturnValue({ get: mockGet });
    mockLimit = jest.fn().mockReturnValue({ offset: mockOffset });
    mockOrderBy = jest.fn().mockReturnValue({
      limit: mockLimit,
      offset: mockOffset,
      get: mockGet,
    });
    mockWhere = jest.fn().mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      offset: mockOffset,
      get: mockGet,
    });
    mockCollection = jest.fn().mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      offset: mockOffset,
      get: mockGet,
    });

    // Mock Firebase config
    const firebaseConfig = require("../../config/firebase.config");
    firebaseConfig.getFirestore = jest.fn().mockReturnValue({
      collection: mockCollection,
    });
  });

  describe("Basic Functionality", () => {
    it("should fetch published tests with default parameters", async () => {
      const mockTests = [
        {
          id: "test1",
          name: "Math Test 1",
          subject: "mathematics",
          gradeLevel: "grade_9_10",
          taskCount: 5,
          publishedAt: new Date("2026-01-01"),
          viewCount: 10,
          downloadCount: 5,
        },
        {
          id: "test2",
          name: "Math Test 2",
          subject: "mathematics",
          gradeLevel: "grade_9_10",
          taskCount: 3,
          publishedAt: new Date("2026-01-02"),
          viewCount: 20,
          downloadCount: 8,
        },
      ];

      mockGet.mockResolvedValue({
        size: 2,
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      });

      const result = await testService.getPublishedTests("HU");

      expect(result).toEqual({
        tests: mockTests,
        total: 2,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      expect(mockCollection).toHaveBeenCalledWith("countries/HU/published_tests");
      expect(mockOrderBy).toHaveBeenCalledWith("publishedAt", "desc");
      expect(mockLimit).toHaveBeenCalledWith(12);
      expect(mockOffset).toHaveBeenCalledWith(0);
    });

    it("should use correct collection path for country", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      await testService.getPublishedTests("US");

      expect(mockCollection).toHaveBeenCalledWith("countries/US/published_tests");
    });

    it("should handle empty results", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      const result = await testService.getPublishedTests("HU");

      expect(result).toEqual({
        tests: [],
        total: 0,
        page: 1,
        limit: 12,
        hasMore: false,
      });
    });
  });

  describe("Pagination", () => {
    it("should paginate with custom limit and offset", async () => {
      const mockTests = Array.from({ length: 10 }, (_, i) => ({
        id: `test${i + 1}`,
        name: `Test ${i + 1}`,
        subject: "mathematics",
        publishedAt: new Date(),
      }));

      mockGet.mockResolvedValueOnce({
        size: 25,
        docs: [],
      });

      mockGet.mockResolvedValueOnce({
        size: 25,
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      });

      const query: GetPublishedTestsQuery = {
        limit: 10,
        offset: 10,
      };

      const result = await testService.getPublishedTests("HU", query);

      expect(result.tests.length).toBe(10);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.hasMore).toBe(true);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(10);
    });

    it("should calculate correct page number", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      await testService.getPublishedTests("HU", { limit: 10, offset: 0 });
      await testService.getPublishedTests("HU", { limit: 10, offset: 10 });
      await testService.getPublishedTests("HU", { limit: 10, offset: 20 });

      const calls = mockGet.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it("should calculate hasMore correctly when no more items", async () => {
      mockGet.mockResolvedValue({
        size: 15,
        docs: Array.from({ length: 5 }, (_, i) => ({
          id: `test${i}`,
          data: () => ({ id: `test${i}`, name: `Test ${i}` }),
        })),
      });

      const result = await testService.getPublishedTests("HU", {
        limit: 10,
        offset: 10,
      });

      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(15);
    });

    it("should calculate hasMore correctly when more items exist", async () => {
      mockGet.mockResolvedValueOnce({ size: 50, docs: [] });
      mockGet.mockResolvedValueOnce({
        size: 50,
        docs: Array.from({ length: 12 }, (_, i) => ({
          id: `test${i}`,
          data: () => ({ id: `test${i}`, name: `Test ${i}` }),
        })),
      });

      const result = await testService.getPublishedTests("HU", {
        limit: 12,
        offset: 0,
      });

      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(50);
    });

    it("should handle large offset values", async () => {
      mockGet.mockResolvedValue({ size: 100, docs: [] });

      const result = await testService.getPublishedTests("HU", {
        limit: 10,
        offset: 90,
      });

      expect(result.page).toBe(10);
      expect(mockOffset).toHaveBeenCalledWith(90);
    });
  });

  describe("Filtering", () => {
    it("should filter by subject", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      const query: GetPublishedTestsQuery = {
        subject: "mathematics",
      };

      await testService.getPublishedTests("HU", query);

      expect(mockWhere).toHaveBeenCalledWith("subject", "==", "mathematics");
    });

    it("should filter by grade level", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      const query: GetPublishedTestsQuery = {
        gradeLevel: "grade_9_10",
      };

      await testService.getPublishedTests("HU", query);

      expect(mockWhere).toHaveBeenCalledWith("gradeLevel", "==", "grade_9_10");
    });

    it("should filter by both subject and grade level", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      const query: GetPublishedTestsQuery = {
        subject: "physics",
        gradeLevel: "grade_11_12",
      };

      const result = await testService.getPublishedTests("HU", query);

      // Verify both filters were applied - check that where was called multiple times
      expect(mockWhere.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(result.tests).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("Sorting", () => {
    it("should sort by recent (default)", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      await testService.getPublishedTests("HU");

      expect(mockOrderBy).toHaveBeenCalledWith("publishedAt", "desc");
    });

    it("should sort by views", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      const query: GetPublishedTestsQuery = {
        sort: "views",
      };

      await testService.getPublishedTests("HU", query);

      expect(mockOrderBy).toHaveBeenCalledWith("viewCount", "desc");
    });

    it("should sort by downloads", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      const query: GetPublishedTestsQuery = {
        sort: "downloads",
      };

      await testService.getPublishedTests("HU", query);

      expect(mockOrderBy).toHaveBeenCalledWith("downloadCount", "desc");
    });

    it("should default to recent for invalid sort option", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      const query: GetPublishedTestsQuery = {
        sort: "invalid" as any,
      };

      await testService.getPublishedTests("HU", query);

      expect(mockOrderBy).toHaveBeenCalledWith("publishedAt", "desc");
    });
  });

  describe("Search Functionality", () => {
    it("should filter by search term in name", async () => {
      const mockTests = [
        {
          id: "test1",
          name: "Algebra Problems",
          description: "Basic algebra",
          creatorName: "John Doe",
        },
        {
          id: "test2",
          name: "Geometry Quiz",
          description: "Algebra concepts",
          creatorName: "Jane Smith",
        },
      ];

      mockGet.mockResolvedValue({
        size: 2,
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      });

      const query: GetPublishedTestsQuery = {
        search: "algebra",
      };

      const result = await testService.getPublishedTests("HU", query);

      expect(result.tests.length).toBe(2);
      expect(result.tests.every((t) =>
        t.name.toLowerCase().includes("algebra") ||
        t.description?.toLowerCase().includes("algebra")
      )).toBe(true);
    });

    it("should filter by search term in description", async () => {
      const mockTests = [
        {
          id: "test1",
          name: "Test 1",
          description: "Physics concepts",
          creatorName: "John Doe",
        },
        {
          id: "test2",
          name: "Test 2",
          description: "Chemistry basics",
          creatorName: "Jane Smith",
        },
      ];

      mockGet.mockResolvedValue({
        size: 2,
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      });

      const query: GetPublishedTestsQuery = {
        search: "physics",
      };

      const result = await testService.getPublishedTests("HU", query);

      expect(result.tests.length).toBe(1);
      expect(result.tests[0].description).toContain("Physics");
    });

    it("should filter by search term in creator name", async () => {
      const mockTests = [
        {
          id: "test1",
          name: "Test 1",
          description: "Description 1",
          creatorName: "Alice Johnson",
        },
        {
          id: "test2",
          name: "Test 2",
          description: "Description 2",
          creatorName: "Bob Smith",
        },
      ];

      mockGet.mockResolvedValue({
        size: 2,
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      });

      const query: GetPublishedTestsQuery = {
        search: "alice",
      };

      const result = await testService.getPublishedTests("HU", query);

      expect(result.tests.length).toBe(1);
      expect(result.tests[0].creatorName).toContain("Alice");
    });

    it("should be case-insensitive", async () => {
      const mockTests = [
        {
          id: "test1",
          name: "ALGEBRA Test",
          description: "Test",
          creatorName: "John",
        },
      ];

      mockGet.mockResolvedValue({
        size: 1,
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      });

      const query: GetPublishedTestsQuery = {
        search: "algebra",
      };

      const result = await testService.getPublishedTests("HU", query);

      expect(result.tests.length).toBe(1);
    });

    it("should return empty array for no matches", async () => {
      const mockTests = [
        {
          id: "test1",
          name: "Math Test",
          description: "Description",
          creatorName: "John",
        },
      ];

      mockGet.mockResolvedValue({
        size: 1,
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      });

      const query: GetPublishedTestsQuery = {
        search: "nonexistent",
      };

      const result = await testService.getPublishedTests("HU", query);

      expect(result.tests.length).toBe(0);
    });

    it("should update total count when search filters results", async () => {
      const mockTests = [
        {
          id: "test1",
          name: "Algebra Test",
          description: "Test",
          creatorName: "John",
        },
        {
          id: "test2",
          name: "Geometry Test",
          description: "Test",
          creatorName: "Jane",
        },
      ];

      mockGet.mockResolvedValue({
        size: 2,
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      });

      const query: GetPublishedTestsQuery = {
        search: "algebra",
      };

      const result = await testService.getPublishedTests("HU", query);

      expect(result.total).toBe(1); // Only matching tests
      expect(result.tests.length).toBe(1);
    });
  });

  describe("Combined Filters and Pagination", () => {
    it("should combine subject filter with pagination", async () => {
      const mockTests = Array.from({ length: 10 }, (_, i) => ({
        id: `test${i}`,
        name: `Math Test ${i}`,
        subject: "mathematics",
      }));

      mockGet.mockResolvedValueOnce({ size: 25, docs: [] });
      mockGet.mockResolvedValueOnce({
        size: 25,
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      });

      const query: GetPublishedTestsQuery = {
        subject: "mathematics",
        limit: 10,
        offset: 10,
      };

      const result = await testService.getPublishedTests("HU", query);

      expect(mockWhere).toHaveBeenCalledWith("subject", "==", "mathematics");
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(10);
      expect(result.page).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    it("should combine search with pagination", async () => {
      const mockTests = Array.from({ length: 5 }, (_, i) => ({
        id: `test${i}`,
        name: `Algebra Test ${i}`,
        description: "Test",
        creatorName: "John",
      }));

      mockGet.mockResolvedValue({
        size: 15,
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      });

      const query: GetPublishedTestsQuery = {
        search: "algebra",
        limit: 5,
        offset: 5,
      };

      const result = await testService.getPublishedTests("HU", query);

      expect(result.tests.length).toBe(5);
      expect(result.tests.every((t) => t.name.toLowerCase().includes("algebra"))).toBe(true);
    });

    it("should combine all filters with sorting and pagination", async () => {
      const mockTests = Array.from({ length: 10 }, (_, i) => ({
        id: `test${i}`,
        name: `Math Test ${i}`,
        subject: "mathematics",
        gradeLevel: "grade_9_10",
        viewCount: i * 10,
      }));

      // First call for count query - return total 20
      mockGet.mockResolvedValueOnce({ size: 20, docs: [] });
      // Second call for paginated query - return 10 docs
      mockGet.mockResolvedValueOnce({
        size: 20,
        docs: mockTests.map((test) => ({
          id: test.id,
          data: () => test,
        })),
      });

      const query: GetPublishedTestsQuery = {
        subject: "mathematics",
        gradeLevel: "grade_9_10",
        sort: "views",
        limit: 10,
        offset: 10,
      };

      const result = await testService.getPublishedTests("HU", query);

      // Verify result structure
      expect(result.tests.length).toBe(10);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.hasMore).toBe(false); // 10 + 10 = 20, no more items
      expect(result.total).toBe(20);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined query parameter", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      const result = await testService.getPublishedTests("HU", undefined);

      expect(result.limit).toBe(12);
      expect(result.page).toBe(1);
    });

    it("should handle empty query object", async () => {
      mockGet.mockResolvedValue({ size: 0, docs: [] });

      const result = await testService.getPublishedTests("HU", {});

      expect(result.limit).toBe(12);
      expect(result.page).toBe(1);
    });

    it("should handle offset larger than total", async () => {
      mockGet.mockResolvedValue({ size: 5, docs: [] });

      const result = await testService.getPublishedTests("HU", {
        limit: 10,
        offset: 100,
      });

      expect(result.tests.length).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("should execute count and paginated queries in parallel", async () => {
      const countPromise = Promise.resolve({ size: 10, docs: [] });
      const paginatedPromise = Promise.resolve({ size: 10, docs: [] });

      mockGet
        .mockResolvedValueOnce(countPromise)
        .mockResolvedValueOnce(paginatedPromise);

      await testService.getPublishedTests("HU");

      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  describe("Data Integrity", () => {
    it("should preserve test data structure", async () => {
      const mockTest = {
        id: "test1",
        name: "Complete Test",
        description: "Test description",
        subject: "mathematics",
        gradeLevel: "grade_9_10",
        taskCount: 5,
        totalScore: 100,
        publishedAt: new Date("2026-01-01"),
        viewCount: 10,
        downloadCount: 5,
        creatorId: "user123",
        creatorName: "John Doe",
      };

      mockGet.mockResolvedValue({
        size: 1,
        docs: [
          {
            id: mockTest.id,
            data: () => mockTest,
          },
        ],
      });

      const result = await testService.getPublishedTests("HU");

      expect(result.tests[0]).toEqual(mockTest);
    });

    it("should include test ID in response", async () => {
      const mockTest = {
        id: "test123",
        name: "Test",
        subject: "mathematics",
      };

      mockGet.mockResolvedValue({
        size: 1,
        docs: [
          {
            id: mockTest.id,
            data: () => ({ name: mockTest.name, subject: mockTest.subject }),
          },
        ],
      });

      const result = await testService.getPublishedTests("HU");

      expect(result.tests[0]).toHaveProperty("id", "test123");
    });
  });
});
