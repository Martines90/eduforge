import { SubscriptionData } from "./subscription.types";

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: "teacher" | "general_user";
  country: string;
  subjects?: string[]; // For teachers only - multi-select
  educationalModel?: string; // For teachers only - grade/school type level
  teacherRole?: string; // For teachers only - the grade level they teach (e.g., "grade_6_8")
  recaptchaToken?: string; // reCAPTCHA verification token
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerificationCodeRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: {
      uid: string;
      email: string;
      name: string;
      emailVerified: boolean;
    };
    token?: string;
  };
  error?: string;
}

export interface UserDocument {
  uid: string;
  email: string;
  name: string;
  role: "teacher" | "general_user";
  country: string;
  subjects?: string[]; // For teachers only - multi-select, stored as array in profile
  educationalModel?: string; // For teachers only - grade/school type level
  teacherRole?: string; // For teachers only - the grade level they teach (e.g., "grade_6_8")
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
