import { SubscriptionData } from "./subscription.types";
import type {
  RegisterRequest as SharedRegisterRequest,
  LoginRequest as SharedLoginRequest,
  VerificationCodeRequest as SharedVerificationCodeRequest,
  VerifyEmailRequest as SharedVerifyEmailRequest,
  AuthResponse as SharedAuthResponse,
  UserRole,
  Subject,
  CountryCode,
  EducationalModel,
  GradeLevel,
} from "@eduforger/shared";

// Re-export shared types for backward compatibility
export type {
  RegisterRequest,
  LoginRequest,
  VerificationCodeRequest,
  VerifyEmailRequest,
  AuthResponse,
} from "@eduforger/shared";

/**
 * User Document in Firestore (backend representation)
 * Uses shared types for consistency with frontend
 */
export interface UserDocument {
  uid: string;
  email: string;
  name: string;
  role: UserRole; // Use shared UserRole type
  country: CountryCode; // Use shared CountryCode type
  subjects?: Subject[]; // Use shared Subject type - For teachers only
  educationalModel?: EducationalModel; // Use shared EducationalModel type - For teachers only
  teacherRole?: GradeLevel; // Use shared GradeLevel type - For teachers only
  emailVerificationCode?: string;
  emailVerificationCodeExp?: FirebaseFirestore.Timestamp;
  status: "active" | "inactive" | "banned";
  emailVerified: boolean;
  subscription?: SubscriptionData;
  taskCredits?: number; // Remaining task generation credits (for teachers)
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface VerificationCodeDocument {
  email: string;
  code: string;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  attempts: number;
}
