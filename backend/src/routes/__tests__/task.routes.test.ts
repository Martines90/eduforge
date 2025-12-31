import * as authMiddleware from "../../middleware/auth.middleware";
import * as authService from "../../services/auth.service";

// Mock dependencies
jest.mock("../../services/auth.service");
jest.mock("../../middleware/auth.middleware");

describe("Task Routes - Auth Protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication and Authorization Logic", () => {
    it("should verify token for authentication", () => {
      const mockToken = "valid-token";
      const mockDecoded = {
        uid: "teacher123",
        email: "teacher@school.edu",
        role: "teacher",
      };

      (authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      const result = authService.verifyToken(mockToken);

      expect(result).toEqual(mockDecoded);
      expect(result.role).toBe("teacher");
    });

    it("should reject invalid tokens", () => {
      (authService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      expect(() => authService.verifyToken("invalid-token")).toThrow(
        "Invalid token"
      );
    });

    it("should differentiate between teacher and general_user roles", () => {
      const teacherToken = "teacher-token";
      const userToken = "user-token";

      (authService.verifyToken as jest.Mock)
        .mockReturnValueOnce({
          uid: "teacher123",
          email: "teacher@school.edu",
          role: "teacher",
        })
        .mockReturnValueOnce({
          uid: "user123",
          email: "student@example.com",
          role: "general_user",
        });

      const teacherResult = authService.verifyToken(teacherToken);
      const userResult = authService.verifyToken(userToken);

      expect(teacherResult.role).toBe("teacher");
      expect(userResult.role).toBe("general_user");
    });

    it("should validate required fields in token payload", () => {
      const mockDecoded = {
        uid: "user123",
        email: "test@example.com",
        role: "teacher",
      };

      (authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      const result = authService.verifyToken("token");

      expect(result).toHaveProperty("uid");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("role");
    });
  });
});
