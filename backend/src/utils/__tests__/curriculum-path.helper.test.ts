/**
 * Unit tests for Curriculum Path Helper
 * Tests path building and parsing utilities
 */

import * as path from "path";
import {
  buildCurriculumStoragePath,
  getTasksJsonPath,
  getTaskImagesDir,
  getTaskImagePath,
  parseCurriculumPath,
} from "../curriculum-path.helper";

describe("Curriculum Path Helper", () => {
  describe("buildCurriculumStoragePath", () => {
    it("should build correct path for Hungarian math curriculum", () => {
      const result = buildCurriculumStoragePath(
        "/storage",
        "HU",
        "math:grade_9_10:algebra:linear_equations:solving_basic_equations"
      );

      expect(result).toBe(
        path.join(
          "/storage",
          "hu",
          "math",
          "grade_9_10",
          "algebra",
          "linear_equations",
          "solving_basic_equations"
        )
      );
    });

    it("should build correct path for US science curriculum", () => {
      const result = buildCurriculumStoragePath(
        "/storage",
        "US",
        "science:grade_11_12:physics:mechanics:motion"
      );

      expect(result).toBe(
        path.join(
          "/storage",
          "us",
          "science",
          "grade_11_12",
          "physics",
          "mechanics",
          "motion"
        )
      );
    });

    it("should handle country codes case-insensitively", () => {
      const result1 = buildCurriculumStoragePath(
        "/storage",
        "HU",
        "math:grade_5"
      );
      const result2 = buildCurriculumStoragePath(
        "/storage",
        "hu",
        "math:grade_5"
      );
      const result3 = buildCurriculumStoragePath(
        "/storage",
        "Hu",
        "math:grade_5"
      );

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it("should handle simple curriculum paths", () => {
      const result = buildCurriculumStoragePath(
        "/storage",
        "GB",
        "math:grade_7"
      );

      expect(result).toBe(path.join("/storage", "gb", "math", "grade_7"));
    });

    it("should handle deeply nested curriculum paths", () => {
      const result = buildCurriculumStoragePath(
        "/storage",
        "DE",
        "math:grade_10:calculus:derivatives:chain_rule:complex_cases"
      );

      expect(result).toBe(
        path.join(
          "/storage",
          "de",
          "math",
          "grade_10",
          "calculus",
          "derivatives",
          "chain_rule",
          "complex_cases"
        )
      );
    });

    it("should handle empty curriculum path parts", () => {
      const result = buildCurriculumStoragePath(
        "/storage",
        "FR",
        "math::grade_8"
      );

      // Empty parts should be filtered out
      expect(result).toBe(path.join("/storage", "fr", "math", "grade_8"));
    });

    it("should work with relative storage paths", () => {
      const result = buildCurriculumStoragePath(
        "./storage",
        "ES",
        "math:grade_6:geometry"
      );

      expect(result).toBe(
        path.join("./storage", "es", "math", "grade_6", "geometry")
      );
    });
  });

  describe("getTasksJsonPath", () => {
    it("should return correct tasks.json path", () => {
      const curriculumDir = "/storage/hu/math/grade_9_10";
      const result = getTasksJsonPath(curriculumDir);

      expect(result).toBe(path.join(curriculumDir, "tasks.json"));
    });

    it("should work with relative paths", () => {
      const curriculumDir = "./storage/hu/math";
      const result = getTasksJsonPath(curriculumDir);

      expect(result).toBe(path.join(curriculumDir, "tasks.json"));
    });

    it("should work with Windows-style paths", () => {
      const curriculumDir = "C:\\storage\\hu\\math";
      const result = getTasksJsonPath(curriculumDir);

      expect(result).toBe(path.join(curriculumDir, "tasks.json"));
    });
  });

  describe("getTaskImagesDir", () => {
    it("should return correct images directory path", () => {
      const curriculumDir = "/storage/hu/math/grade_9_10";
      const taskId = "task_abc123";
      const result = getTaskImagesDir(curriculumDir, taskId);

      expect(result).toBe(path.join(curriculumDir, "images", taskId));
    });

    it("should handle different task ID formats", () => {
      const curriculumDir = "/storage/us/science";

      const result1 = getTaskImagesDir(curriculumDir, "task_123");
      const result2 = getTaskImagesDir(curriculumDir, "abc-def-456");
      const result3 = getTaskImagesDir(curriculumDir, "simple_id");

      expect(result1).toBe(path.join(curriculumDir, "images", "task_123"));
      expect(result2).toBe(path.join(curriculumDir, "images", "abc-def-456"));
      expect(result3).toBe(path.join(curriculumDir, "images", "simple_id"));
    });
  });

  describe("getTaskImagePath", () => {
    it("should return correct image file path", () => {
      const curriculumDir = "/storage/hu/math/grade_9_10";
      const taskId = "task_abc123";
      const imageId = "image_001";
      const result = getTaskImagePath(curriculumDir, taskId, imageId);

      expect(result).toBe(
        path.join(curriculumDir, "images", taskId, "image_001.png")
      );
    });

    it("should always add .png extension", () => {
      const curriculumDir = "/storage/hu/math";
      const result = getTaskImagePath(curriculumDir, "task_1", "img_xyz");

      expect(result).toContain(".png");
      expect(result.endsWith(".png")).toBe(true);
    });

    it("should handle complex image IDs", () => {
      const curriculumDir = "/storage/de/science";
      const taskId = "task_complex_123";
      const imageId = "image_main_illustration_v2";
      const result = getTaskImagePath(curriculumDir, taskId, imageId);

      expect(result).toBe(
        path.join(
          curriculumDir,
          "images",
          taskId,
          "image_main_illustration_v2.png"
        )
      );
    });
  });

  describe("parseCurriculumPath", () => {
    it("should parse standard 5-part curriculum path", () => {
      const result = parseCurriculumPath(
        "math:grade_9_10:algebra:linear_equations:solving_basic_equations"
      );

      expect(result).toEqual({
        subject: "math",
        grade: "grade_9_10",
        category: "algebra",
        topic: "linear_equations",
        subtopic: "solving_basic_equations",
        parts: [
          "math",
          "grade_9_10",
          "algebra",
          "linear_equations",
          "solving_basic_equations",
        ],
      });
    });

    it("should parse shorter curriculum paths", () => {
      const result = parseCurriculumPath("science:grade_7:biology");

      expect(result).toEqual({
        subject: "science",
        grade: "grade_7",
        category: "biology",
        topic: "",
        subtopic: "",
        parts: ["science", "grade_7", "biology"],
      });
    });

    it("should handle minimal curriculum path", () => {
      const result = parseCurriculumPath("math:grade_5");

      expect(result).toEqual({
        subject: "math",
        grade: "grade_5",
        category: "",
        topic: "",
        subtopic: "",
        parts: ["math", "grade_5"],
      });
    });

    it("should handle single part curriculum path", () => {
      const result = parseCurriculumPath("math");

      expect(result).toEqual({
        subject: "math",
        grade: "",
        category: "",
        topic: "",
        subtopic: "",
        parts: ["math"],
      });
    });

    it("should handle empty curriculum path", () => {
      const result = parseCurriculumPath("");

      expect(result).toEqual({
        subject: "",
        grade: "",
        category: "",
        topic: "",
        subtopic: "",
        parts: [],
      });
    });

    it("should filter out empty parts", () => {
      const result = parseCurriculumPath("math::grade_5::");

      expect(result.parts).toEqual(["math", "grade_5"]);
      expect(result.subject).toBe("math");
      expect(result.grade).toBe("grade_5");
    });

    it("should handle longer paths (more than 5 parts)", () => {
      const result = parseCurriculumPath(
        "math:grade_10:calculus:limits:one_sided:left_limits"
      );

      expect(result).toEqual({
        subject: "math",
        grade: "grade_10",
        category: "calculus",
        topic: "limits",
        subtopic: "one_sided",
        parts: [
          "math",
          "grade_10",
          "calculus",
          "limits",
          "one_sided",
          "left_limits",
        ],
      });
      // Parts array should contain all elements
      expect(result.parts.length).toBe(6);
    });

    it("should preserve original casing", () => {
      const result = parseCurriculumPath(
        "Math:Grade_9_10:Algebra:Linear_Equations"
      );

      expect(result.subject).toBe("Math");
      expect(result.grade).toBe("Grade_9_10");
      expect(result.category).toBe("Algebra");
      expect(result.topic).toBe("Linear_Equations");
    });
  });

  describe("Integration: Full Path Building and Parsing", () => {
    it("should build and parse paths consistently", () => {
      const curriculumPath =
        "math:grade_9_10:algebra:linear_equations:solving_basic";
      const parsed = parseCurriculumPath(curriculumPath);

      // Build a storage path
      const storagePath = buildCurriculumStoragePath(
        "/storage",
        "HU",
        curriculumPath
      );

      // Verify the storage path contains all parts
      expect(storagePath).toContain("math");
      expect(storagePath).toContain("grade_9_10");
      expect(storagePath).toContain("algebra");
      expect(storagePath).toContain("linear_equations");
      expect(storagePath).toContain("solving_basic");

      // Verify parsed structure
      expect(parsed.parts.length).toBe(5);
      expect(parsed.subject).toBe("math");
    });

    it("should create complete file paths for a task", () => {
      const curriculumPath = "science:grade_11:physics:mechanics";
      const storageBase = "/app/storage";
      const countryCode = "US";
      const taskId = "task_xyz789";
      const imageId = "image_abc123";

      // Build curriculum directory
      const curriculumDir = buildCurriculumStoragePath(
        storageBase,
        countryCode,
        curriculumPath
      );

      // Get various paths
      const tasksJsonPath = getTasksJsonPath(curriculumDir);
      const imagesDir = getTaskImagesDir(curriculumDir, taskId);
      const imagePath = getTaskImagePath(curriculumDir, taskId, imageId);

      // Verify all paths are nested correctly
      expect(tasksJsonPath).toContain(curriculumDir);
      expect(imagesDir).toContain(curriculumDir);
      expect(imagePath).toContain(imagesDir);
      expect(imagePath).toContain(taskId);
      expect(imagePath).toContain(imageId);

      // Verify specific structure
      expect(tasksJsonPath.endsWith("tasks.json")).toBe(true);
      expect(imagePath.endsWith(".png")).toBe(true);
    });
  });
});
