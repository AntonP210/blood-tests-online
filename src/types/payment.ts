export type PaymentTier =
  | "one_time"
  | "weekly"
  | "monthly"
  | "yearly"
  | "lifetime";

export interface CheckoutRequest {
  tier: PaymentTier;
}

export interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
  isPaid: boolean;
  subscriptionStatus: "active" | "inactive" | "none";
}
