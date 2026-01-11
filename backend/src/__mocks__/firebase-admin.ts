/**
 * Mock for firebase-admin module
 * This mock ensures that all Firebase Admin SDK functionality is properly mocked in tests
 */

const mockFieldValue = {
  serverTimestamp: jest.fn(() => new Date()),
  increment: jest.fn((n: number) => n),
  delete: jest.fn(() => undefined),
  arrayUnion: jest.fn((...elements: any[]) => elements),
  arrayRemove: jest.fn((...elements: any[]) => elements),
};

const mockFirestore = {
  FieldValue: mockFieldValue,
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
  },
};

const admin = {
  firestore: Object.assign(
    jest.fn(() => ({
      collection: jest.fn(),
      doc: jest.fn(),
      batch: jest.fn(),
    })),
    {
      FieldValue: mockFieldValue,
      Timestamp: mockFirestore.Timestamp,
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
};

module.exports = admin;
