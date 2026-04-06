import { useTranslations } from "next-intl";
import { AnalysisForm } from "@/components/analyze/analysis-form";

export default function AnalyzePage() {
  const t = useTranslations("analyze");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AnalysisForm />
    </div>
  );
}
