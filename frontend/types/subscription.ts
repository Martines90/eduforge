export type SubscriptionTier = 'trial' | 'basic' | 'normal' | 'pro';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'past_due';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: 'year' | 'month';
  features: {
    viewDownloadTasks: boolean;
    customTaskCollections: number | 'unlimited';
    taskCreationCredits: number;
    emailSupport: boolean;
    supportResponseTime: string;
    creatorContests: boolean;
    discordAccess: boolean;
    webstoreDiscount: number;
    schoolLicense: boolean;
    additionalTeachers: number;
    schoolContest: boolean;
  };
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  cancelAtPeriodEnd?: boolean;
  schoolId?: string;
  schoolName?: string;
  associatedTeachers?: string[];
}

export interface CheckoutSessionResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    url: string;
  };
}

export interface PlansResponse {
  success: boolean;
  message: string;
  data: {
    plans: SubscriptionPlan[];
  };
}
