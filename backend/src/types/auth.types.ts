export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'teacher' | 'general_user';
  country: string;
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
  emailVerificationCode?: string;
  emailVerificationCodeExp?: FirebaseFirestore.Timestamp;
  status: 'active' | 'inactive' | 'banned';
  emailVerified: boolean;
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
