"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalyzedMarker } from "@/types/blood-test";

const statusBadge: Record<string, string> = {
  normal: "bg-green-100 text-green-800",
  high: "bg-red-100 text-red-700",
  low: "bg-amber-100 text-amber-800",
  critical: "bg-red-200 text-red-900 font-semibold",
};

const statusBorder: Record<string, string> = {
  normal: "",
  high: "border-red-300 dark:border-red-800",
  low: "border-amber-300 dark:border-amber-800",
  critical: "border-red-400 ring-1 ring-red-200 dark:border-red-700 dark:ring-red-900",
};

export function MarkerCard({ marker }: { marker: AnalyzedMarker }) {
  const t = useTranslations("results");

  return (
    <Card className={statusBorder[marker.status] ?? ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{marker.name}</CardTitle>
          <Badge className={statusBadge[marker.status] ?? ""} variant="secondary">
            {t(`status.${marker.status}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("yourValue")}</span>
          <span className="font-medium">
            {marker.value} {marker.unit}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("normalRange")}</span>
          <span>{marker.normalRange} {marker.unit}</span>
        </div>
        <p className="pt-2 text-sm text-muted-foreground">
          {marker.explanation}
        </p>
      </CardContent>
    </Card>
  );
}
