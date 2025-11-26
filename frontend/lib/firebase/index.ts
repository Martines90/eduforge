// Firebase configuration
export { app, db, auth } from './config';

// Authentication services
export {
  registerUser,
  sendVerificationCode,
  verifyEmail,
  loginUser,
  logoutUser,
  getCurrentUser,
  onAuthChange,
  type RegistrationData,
} from './auth';

// User services
export {
  createUser,
  getUserById,
  getUserByEmail,
  markEmailAsVerified,
  updateUserProfile,
  type FirebaseUser,
} from './users';

// Verification services
export {
  generateVerificationCode,
  createVerificationCode,
  verifyCode,
  deleteVerificationCode,
  resendVerificationCode,
  type VerificationCode,
} from './verification';
