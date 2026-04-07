import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";

export async function PricingPreview() {
  const t = await getTranslations("pricing");
  const tc = await getTranslations("common");

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
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground sm:mt-4 sm:text-lg">
          {t("subtitle")}
        </p>

        <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-6 lg:mx-auto lg:max-w-4xl">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl border p-5 transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-6 ${
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
                <h3 className="text-base font-bold sm:text-lg">{tier.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {tier.price}
                </p>
              </div>

              <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-xs sm:gap-2.5 sm:text-sm"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center sm:mt-10">
          <Button
            render={<Link href="/pricing" />}
            variant="outline"
            size="lg"
            className="w-full gap-2 rounded-full px-8 sm:w-auto"
          >
            {tc("viewPricing")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
