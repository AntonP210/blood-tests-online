"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Printer, ArrowLeft } from "lucide-react";
import { useAnalysisStore } from "@/hooks/use-analysis";
import { SummarySection } from "./summary-section";
import { MarkerCard } from "./marker-card";
import { Recommendations } from "./recommendations";

export function ResultsDisplay() {
  const t = useTranslations("results");
  const td = useTranslations("disclaimer");
  const tc = useTranslations("common");
  const { result } = useAnalysisStore();

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("noResults")}</p>
        <Button
          render={<Link href="/analyze" />}
          variant="outline"
          className="mt-4"
        >
          {t("backToAnalyze")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummarySection summary={result.summary} />

      <div>
        <h2 className="mb-4 text-center text-xl font-semibold">{t("markersTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {result.markers.map((marker, index) => (
            <MarkerCard key={index} marker={marker} />
          ))}
        </div>
      </div>

      <Recommendations recommendations={result.recommendations} />

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{td("results")}</AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          {tc("printResults")}
        </Button>
        <Button
          render={<Link href="/analyze" />}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {tc("newAnalysis")}
        </Button>
      </div>
    </div>
  );
}
