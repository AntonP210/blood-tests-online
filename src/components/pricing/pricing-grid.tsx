"use client";

import { useTranslations } from "next-intl";
import { PricingCard } from "./pricing-card";
import { PRICING_TIERS } from "@/constants/pricing";

export function PricingGrid() {
  const t = useTranslations("pricing");

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 sm:gap-5">
      {PRICING_TIERS.map((tier) => (
        <PricingCard
          key={tier.id}
          tier={tier}
          buttonLabel={
            tier.paymentMode === "subscription" ? t("subscribe") : t("buyNow")
          }
        />
      ))}
    </div>
  );
}
