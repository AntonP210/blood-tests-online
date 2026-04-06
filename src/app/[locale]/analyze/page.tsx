import { useTranslations } from "next-intl";
import { AnalysisForm } from "@/components/analyze/analysis-form";

export default function AnalyzePage() {
  const t = useTranslations("analyze");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t("subtitle")}</p>
      </div>
      <AnalysisForm />
    </div>
  );
}
