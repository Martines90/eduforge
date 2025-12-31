import * as authService from "../auth.service";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { getFirestore, getAuth } from "../../config/firebase.config";

// Mock dependencies
jest.mock("../../config/firebase.config");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("Auth Service", () => {
  const mockFirestore = {
    collection: jest.fn(),
  };

  const mockAuth = {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  describe("generateVerificationCode", () => {
    it("should generate a 6-digit code", () => {
      const code = authService.generateVerificationCode();

      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    });

    it("should generate unique codes", () => {
      const codes = new Set();
      for (let i = 0; i < 10; i++) {
        codes.add(authService.generateVerificationCode());
      }

      // Should have at least 8 unique codes out of 10
      expect(codes.size).toBeGreaterThan(7);
    });
  });

  describe("createVerificationCode", () => {
    it("should create and store verification code", async () => {
      const mockSet = jest.fn().mockResolvedValue(undefined);
      const mockDoc = jest.fn().mockReturnValue({ set: mockSet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      mockFirestore.collection = mockCollection;
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");

      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        role: "teacher" as const,
        country: "US",
      };

      const code = await authService.createVerificationCode(
        "test@example.com",
        userData
      );

      expect(code).toMatch(/^\d{6}$/);
      expect(mockCollection).toHaveBeenCalledWith("pendingRegistrations");
      expect(mockDoc).toHaveBeenCalledWith("test@example.com");
      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe("verifyCodeAndCreateUser", () => {
    it("should verify code and create user successfully", async () => {
      const mockPendingData = {
        code: "123456",
        expiresAt: {
          toDate: () => new Date(Date.now() + 10000), // Not expired
        },
        attempts: 0,
        pendingUserData: {
          name: "Test User",
          password: "hashed-password",
          role: "teacher",
          country: "US",
        },
      };

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockPendingData,
      });

      const mockDelete = jest.fn().mockResolvedValue(undefined);
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockSetDoc = jest.fn().mockResolvedValue(undefined);

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
          delete: mockDelete,
          set: mockSetDoc,
        }),
      });

      mockAuth.getUserByEmail.mockRejectedValue({
        code: "auth/user-not-found",
      });
      mockAuth.createUser.mockResolvedValue({ uid: "user123" });

      (jwt.sign as jest.Mock).mockReturnValue("jwt-token");

      const result = await authService.verifyCodeAndCreateUser(
        "test@example.com",
        "123456"
      );

      expect(result.uid).toBe("user123");
      expect(result.token).toBe("jwt-token");
      expect(mockAuth.createUser).toHaveBeenCalled();
    });

    it("should throw error if code is invalid", async () => {
      const mockPendingData = {
        code: "123456",
        expiresAt: {
          toDate: () => new Date(Date.now() + 10000),
        },
        attempts: 0,
      };

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockPendingData,
      });

      const mockUpdate = jest.fn().mockResolvedValue(undefined);

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
          update: mockUpdate,
        }),
      });

      await expect(
        authService.verifyCodeAndCreateUser("test@example.com", "999999")
      ).rejects.toThrow("Invalid verification code");

      expect(mockUpdate).toHaveBeenCalledWith({ attempts: 1 });
    });

    it("should throw error if code is expired", async () => {
      const mockPendingData = {
        code: "123456",
        expiresAt: {
          toDate: () => new Date(Date.now() - 10000), // Expired
        },
        attempts: 0,
      };

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockPendingData,
      });

      const mockDelete = jest.fn().mockResolvedValue(undefined);

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
          delete: mockDelete,
        }),
      });

      await expect(
        authService.verifyCodeAndCreateUser("test@example.com", "123456")
      ).rejects.toThrow("Verification code has expired");

      expect(mockDelete).toHaveBeenCalled();
    });

    it("should throw error if too many attempts", async () => {
      const mockPendingData = {
        code: "123456",
        expiresAt: {
          toDate: () => new Date(Date.now() + 10000),
        },
        attempts: 5,
      };

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockPendingData,
      });

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      await expect(
        authService.verifyCodeAndCreateUser("test@example.com", "123456")
      ).rejects.toThrow("Too many failed attempts");
    });

    it("should throw error if no pending registration found", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: false,
      });

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      await expect(
        authService.verifyCodeAndCreateUser("test@example.com", "123456")
      ).rejects.toThrow("No pending registration found for this email");
    });
  });

  describe("loginUser", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUserData = {
        uid: "user123",
        email: "test@example.com",
        name: "Test User",
        role: "teacher",
        status: "active",
        emailVerified: true,
      };

      const mockUserSnapshot = {
        empty: false,
        docs: [
          {
            data: () => mockUserData,
          },
        ],
      };

      const mockCredGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ hashedPassword: "hashed-password" }),
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      mockFirestore.collection = jest.fn((name) => {
        if (name === "users") {
          return { where: mockWhere };
        }
        return {
          doc: jest.fn().mockReturnValue({
            get: mockCredGet,
          }),
        };
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("jwt-token");

      const result = await authService.loginUser({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.user.email).toBe("test@example.com");
      expect(result.token).toBe("jwt-token");
    });

    it("should throw error for invalid email", async () => {
      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ empty: true }),
      });

      mockFirestore.collection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      await expect(
        authService.loginUser({
          email: "wrong@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw error for invalid password", async () => {
      const mockUserData = {
        uid: "user123",
        email: "test@example.com",
        status: "active",
      };

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => mockUserData }],
      };

      const mockCredGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ hashedPassword: "hashed-password" }),
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      mockFirestore.collection = jest.fn((name) => {
        if (name === "users") {
          return { where: mockWhere };
        }
        return {
          doc: jest.fn().mockReturnValue({
            get: mockCredGet,
          }),
        };
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.loginUser({
          email: "test@example.com",
          password: "wrongpassword",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw error for banned account", async () => {
      const mockUserData = {
        uid: "user123",
        email: "test@example.com",
        status: "banned",
      };

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => mockUserData }],
      };

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      mockFirestore.collection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      await expect(
        authService.loginUser({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Account has been banned");
    });
  });

  describe("getUserById", () => {
    it("should return user data for valid UID", async () => {
      const mockUserData = {
        uid: "user123",
        email: "test@example.com",
        name: "Test User",
      };

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      });

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      const result = await authService.getUserById("user123");

      expect(result).toEqual(mockUserData);
    });

    it("should return null for non-existent user", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: false,
      });

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      const result = await authService.getUserById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("verifyToken", () => {
    it("should verify valid token", () => {
      const mockDecoded = {
        uid: "user123",
        email: "test@example.com",
        role: "teacher",
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = authService.verifyToken("valid-token");

      expect(result).toEqual(mockDecoded);
    });

    it("should throw error for invalid token", () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      expect(() => authService.verifyToken("invalid-token")).toThrow(
        "Invalid token"
      );
    });
  });

  describe("initiateRegistration", () => {
    it("should successfully initiate registration for new user", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: true, // No existing user
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockDocGet = jest.fn().mockResolvedValue({
        exists: false, // No pending registration
      });

      const mockSet = jest.fn().mockResolvedValue(undefined);

      mockFirestore.collection = jest.fn((collectionName) => {
        if (collectionName === "users") {
          return { where: mockWhere };
        }
        // For pendingRegistrations
        return {
          doc: jest.fn().mockReturnValue({
            get: mockDocGet,
            set: mockSet,
          }),
        };
      });

      mockAuth.getUserByEmail.mockRejectedValue({
        code: "auth/user-not-found",
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");

      const code = await authService.initiateRegistration({
        email: "new@example.com",
        password: "password123",
        name: "New User",
        role: "general_user",
        country: "US",
      });

      expect(code).toMatch(/^\d{6}$/);
      expect(mockSet).toHaveBeenCalled();
    });

    it("should throw error if email already registered", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: false, // User exists
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: mockGet,
      });

      mockFirestore.collection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      await expect(
        authService.initiateRegistration({
          email: "existing@example.com",
          password: "password123",
          name: "Existing User",
          role: "general_user",
          country: "US",
        })
      ).rejects.toThrow("Email already registered");
    });
  });

  describe("deductTaskCredit", () => {
    it("should successfully deduct one credit from teacher account", async () => {
      const mockUserData = {
        uid: "teacher123",
        role: "teacher",
        taskCredits: 50,
      };

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      });

      const mockUpdate = jest.fn().mockResolvedValue(undefined);

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
          update: mockUpdate,
        }),
      });

      const result = await authService.deductTaskCredit("teacher123");

      expect(result).toBe(49);
      expect(mockUpdate).toHaveBeenCalledWith({
        taskCredits: 49,
        updatedAt: expect.any(Date),
      });
    });

    it("should throw error if user not found", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: false,
      });

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      await expect(authService.deductTaskCredit("nonexistent")).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw error if user is not a teacher", async () => {
      const mockUserData = {
        uid: "user123",
        role: "general_user",
        taskCredits: 10,
      };

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      });

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      await expect(authService.deductTaskCredit("user123")).rejects.toThrow(
        "Only teachers can create tasks"
      );
    });

    it("should throw error if no credits remaining", async () => {
      const mockUserData = {
        uid: "teacher123",
        role: "teacher",
        taskCredits: 0,
      };

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      });

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      await expect(authService.deductTaskCredit("teacher123")).rejects.toThrow(
        "No task creation credits remaining"
      );
    });

    it("should handle undefined taskCredits as 0", async () => {
      const mockUserData = {
        uid: "teacher123",
        role: "teacher",
        // taskCredits field missing
      };

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      });

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      await expect(authService.deductTaskCredit("teacher123")).rejects.toThrow(
        "No task creation credits remaining"
      );
    });

    it("should deduct from 1 credit to 0 successfully", async () => {
      const mockUserData = {
        uid: "teacher123",
        role: "teacher",
        taskCredits: 1,
      };

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      });

      const mockUpdate = jest.fn().mockResolvedValue(undefined);

      mockFirestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
          update: mockUpdate,
        }),
      });

      const result = await authService.deductTaskCredit("teacher123");

      expect(result).toBe(0);
      expect(mockUpdate).toHaveBeenCalledWith({
        taskCredits: 0,
        updatedAt: expect.any(Date),
      });
    });
  });
});
