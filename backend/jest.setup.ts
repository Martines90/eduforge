/**
 * Jest setup file - runs before all tests
 * Configures global mocks and test environment
 */

// Mock firebase-admin globally to prevent FieldValue errors
jest.mock("firebase-admin", () => ({
  firestore: Object.assign(
    jest.fn(() => ({
      collection: jest.fn(),
    })),
    {
      FieldValue: {
        serverTimestamp: jest.fn(() => new Date()),
        increment: jest.fn((n: number) => n),
        delete: jest.fn(() => undefined),
        arrayUnion: jest.fn((...elements: any[]) => elements),
        arrayRemove: jest.fn((...elements: any[]) => elements),
      },
      Timestamp: {
        now: jest.fn(() => ({ toDate: () => new Date() })),
        fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
      },
    }
  ),
  auth: jest.fn(() => ({
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    getUser: jest.fn(),
  })),
  credential: {
    cert: jest.fn(),
    applicationDefault: jest.fn(),
  },
  initializeApp: jest.fn(() => ({
    name: '[DEFAULT]',
  })),
  app: jest.fn(() => ({
    name: '[DEFAULT]',
  })),
  apps: [],
}));
