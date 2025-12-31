import { SUBSCRIPTION_CREDITS } from "../constants/credits";

export type SubscriptionTier = "trial" | "basic" | "normal" | "pro";
export type SubscriptionStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "past_due";

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number; // in euros
  currency: string;
  interval: "year" | "month";
  features: {
    viewDownloadTasks: boolean;
    customTaskCollections: number | "unlimited";
    taskCreationCredits: number;
    emailSupport: boolean;
    supportResponseTime: string; // e.g., "48 hours"
    creatorContests: boolean;
    discordAccess: boolean;
    webstoreDiscount: number; // percentage
    schoolLicense: boolean;
    additionalTeachers: number;
    schoolContest: boolean;
  };
}

export interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: FirebaseFirestore.Timestamp;
  endDate: FirebaseFirestore.Timestamp;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  cancelAtPeriodEnd?: boolean;
  schoolId?: string; // For pro tier with multiple teachers
  schoolName?: string;
  associatedTeachers?: string[]; // Array of UIDs for teachers in school (pro tier)
}

export interface CreateCheckoutSessionRequest {
  tier: SubscriptionTier;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface WebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  trial: {
    id: "trial",
    name: "Trial",
    price: 0,
    currency: "eur",
    interval: "month",
    features: {
      viewDownloadTasks: true,
      customTaskCollections: SUBSCRIPTION_CREDITS.trial,
      taskCreationCredits: SUBSCRIPTION_CREDITS.trial,
      emailSupport: true,
      supportResponseTime: "72 hours",
      creatorContests: false,
      discordAccess: false,
      webstoreDiscount: 0,
      schoolLicense: false,
      additionalTeachers: 0,
      schoolContest: false,
    },
  },
  basic: {
    id: "basic",
    name: "Basic",
    price: 99,
    currency: "eur",
    interval: "year",
    features: {
      viewDownloadTasks: true,
      customTaskCollections: 1000,
      taskCreationCredits: 0,
      emailSupport: true,
      supportResponseTime: "48 hours",
      creatorContests: false,
      discordAccess: false,
      webstoreDiscount: 0,
      schoolLicense: false,
      additionalTeachers: 0,
      schoolContest: false,
    },
  },
  normal: {
    id: "normal",
    name: "Normal",
    price: 199,
    currency: "eur",
    interval: "year",
    features: {
      viewDownloadTasks: true,
      customTaskCollections: SUBSCRIPTION_CREDITS.normal,
      taskCreationCredits: SUBSCRIPTION_CREDITS.normal,
      emailSupport: true,
      supportResponseTime: "48 hours",
      creatorContests: true,
      discordAccess: true,
      webstoreDiscount: 10,
      schoolLicense: false,
      additionalTeachers: 0,
      schoolContest: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro (School License)",
    price: 599,
    currency: "eur",
    interval: "year",
    features: {
      viewDownloadTasks: true,
      customTaskCollections: "unlimited",
      taskCreationCredits: SUBSCRIPTION_CREDITS.pro,
      emailSupport: true,
      supportResponseTime: "24 hours",
      creatorContests: true,
      discordAccess: true,
      webstoreDiscount: 15,
      schoolLicense: true,
      additionalTeachers: 10,
      schoolContest: true,
    },
  },
};
