import { useTranslations } from "next-intl";
import { PricingGrid } from "@/components/pricing/pricing-grid";

export default function PricingPage() {
  const t = useTranslations("pricing");

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>
      <PricingGrid />
    </div>
  );
}
