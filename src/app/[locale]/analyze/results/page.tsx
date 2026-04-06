import { useTranslations } from "next-intl";
import { ResultsDisplay } from "@/components/results/results-display";

export default function ResultsPage() {
  const t = useTranslations("results");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center text-3xl font-bold tracking-tight">
        {t("title")}
      </h1>
      <ResultsDisplay />
    </div>
  );
}
