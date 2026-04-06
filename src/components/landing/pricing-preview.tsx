"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";

export function PricingPreview() {
  const t = useTranslations("pricing");
  const tc = useTranslations("common");

  const tiers = [
    {
      name: t("free"),
      price: "$0",
      features: [t("freeFeature1"), t("freeFeature2"), t("freeFeature3")],
    },
    {
      name: t("monthly"),
      price: t("monthlyDesc"),
      features: [
        t("monthlyFeature1"),
        t("monthlyFeature2"),
        t("monthlyFeature3"),
      ],
      popular: true,
    },
    {
      name: t("yearly"),
      price: t("yearlyDesc"),
      features: [
        t("yearlyFeature1"),
        t("yearlyFeature2"),
        t("yearlyFeature3"),
      ],
      badge: t("bestValue"),
    },
  ];

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
          {t("subtitle")}
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-3 lg:mx-auto lg:max-w-4xl">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-6 transition-shadow hover:shadow-lg ${
                tier.popular
                  ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                  : "border-border bg-card"
              }`}
            >
              {tier.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {tier.badge}
                </Badge>
              )}
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {t("mostPopular")}
                </Badge>
              )}

              <div className="text-center">
                <h3 className="text-lg font-bold">{tier.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tier.price}
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button
            render={<Link href="/pricing" />}
            variant="outline"
            size="lg"
            className="gap-2 rounded-full px-8"
          >
            {tc("viewPricing")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
