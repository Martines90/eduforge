import axios from "axios";

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || "";
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export interface RecaptchaVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  score?: number;
  action?: string;
}

/**
 * Verify reCAPTCHA token with Google's API
 * @param token - The reCAPTCHA response token from the client
 * @returns Promise resolving to true if valid, false otherwise
 */
export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn(
      "[reCAPTCHA] No secret key configured. Skipping verification."
    );
    // In development, if no key is set, we can skip verification
    // In production, this should fail
    return process.env.NODE_ENV === "development";
  }

  if (!token) {
    console.error("[reCAPTCHA] No token provided");
    return false;
  }

  try {
    const response = await axios.post<RecaptchaVerificationResponse>(
      RECAPTCHA_VERIFY_URL,
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: token,
        },
      }
    );

    console.log("[reCAPTCHA] Verification response:", response.data);

    if (!response.data.success) {
      console.error(
        "[reCAPTCHA] Verification failed:",
        response.data["error-codes"]
      );
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("[reCAPTCHA] Verification error:", error.message);
    return false;
  }
}
