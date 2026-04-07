export interface PricingTier {
  id: string;
  nameKey: string;
  descriptionKey: string;
  price: string;
  period?: string;
  featureKeys: string[];
  badgeKey?: string;
  popular?: boolean;
  paymentMode: "payment" | "subscription";
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    nameKey: "free",
    descriptionKey: "freeDesc",
    price: "$0",
    featureKeys: ["freeFeature1", "freeFeature2", "freeFeature3"],
    paymentMode: "payment",
  },
  {
    id: "one_time",
    nameKey: "oneTime",
    descriptionKey: "oneTimeDesc",
    price: "$2.99",
    featureKeys: ["oneTimeFeature1", "oneTimeFeature2", "oneTimeFeature3"],
    paymentMode: "payment",
  },
  {
    id: "weekly",
    nameKey: "weekly",
    descriptionKey: "weeklyDesc",
    price: "$4.99",
    period: "/week",
    featureKeys: ["weeklyFeature1", "weeklyFeature2", "weeklyFeature3"],
    paymentMode: "subscription",
  },
  {
    id: "monthly",
    nameKey: "monthly",
    descriptionKey: "monthlyDesc",
    price: "$9.99",
    period: "/month",
    featureKeys: ["monthlyFeature1", "monthlyFeature2", "monthlyFeature3"],
    badgeKey: "mostPopular",
    popular: true,
    paymentMode: "subscription",
  },
  {
    id: "yearly",
    nameKey: "yearly",
    descriptionKey: "yearlyDesc",
    price: "$59.99",
    period: "/year",
    featureKeys: ["yearlyFeature1", "yearlyFeature2", "yearlyFeature3"],
    badgeKey: "bestValue",
    paymentMode: "subscription",
  },
  {
    id: "lifetime",
    nameKey: "lifetime",
    descriptionKey: "lifetimeDesc",
    price: "$99.99",
    featureKeys: ["lifetimeFeature1", "lifetimeFeature2", "lifetimeFeature3"],
    badgeKey: "bestDeal",
    paymentMode: "payment",
  },
];
