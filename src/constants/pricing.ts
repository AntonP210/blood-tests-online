export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  period?: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  paymentMode: "payment" | "subscription";
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    description: "Try it out",
    price: "$0",
    features: ["2 free analyses", "Basic explanations", "No account needed"],
    paymentMode: "payment",
  },
  {
    id: "one_time",
    name: "One-Time",
    description: "Pay per analysis",
    price: "$2.99",
    features: [
      "Single analysis",
      "Detailed explanations",
      "Instant results",
    ],
    paymentMode: "payment",
  },
  {
    id: "weekly",
    name: "Weekly",
    description: "Short-term access",
    price: "$4.99",
    period: "/week",
    features: [
      "Unlimited analyses",
      "Detailed explanations",
      "7-day access",
    ],
    paymentMode: "subscription",
  },
  {
    id: "monthly",
    name: "Monthly",
    description: "Most popular",
    price: "$9.99",
    period: "/month",
    features: [
      "Unlimited analyses",
      "Detailed explanations",
      "30-day access",
    ],
    badge: "Most Popular",
    popular: true,
    paymentMode: "subscription",
  },
  {
    id: "yearly",
    name: "Yearly",
    description: "Best value",
    price: "$59.99",
    period: "/year",
    features: [
      "Unlimited analyses",
      "Detailed explanations",
      "365-day access",
    ],
    badge: "Best Value",
    paymentMode: "subscription",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    description: "Pay once, use forever",
    price: "$99.99",
    features: [
      "Unlimited analyses",
      "Detailed explanations",
      "Lifetime access",
    ],
    badge: "Best Deal",
    paymentMode: "payment",
  },
];
