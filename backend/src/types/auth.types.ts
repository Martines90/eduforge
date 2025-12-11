export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'teacher' | 'general_user';
  country: string;
  subject?: string; // For teachers only
  educationalModel?: string; // For teachers only
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
  role: 'teacher' | 'general_user';
  country: string;
  subject?: string; // For teachers only
  educationalModel?: string; // For teachers only
  emailVerificationCode?: string;
  emailVerificationCodeExp?: FirebaseFirestore.Timestamp;
  status: 'active' | 'inactive' | 'banned';
  emailVerified: boolean;
  subscription?: {
    plan: 'trial' | 'annual' | 'none';
    status: 'active' | 'expired' | 'cancelled';
    trialStartDate?: FirebaseFirestore.Timestamp;
    trialEndDate?: FirebaseFirestore.Timestamp;
    annualStartDate?: FirebaseFirestore.Timestamp;
    annualEndDate?: FirebaseFirestore.Timestamp;
  };
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
