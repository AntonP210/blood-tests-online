"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalyzedMarker } from "@/types/blood-test";

const statusColors: Record<string, string> = {
  normal: "bg-green-100 text-green-800",
  high: "bg-orange-100 text-orange-800",
  low: "bg-blue-100 text-blue-800",
  critical: "bg-red-100 text-red-800",
};

export function MarkerCard({ marker }: { marker: AnalyzedMarker }) {
  const t = useTranslations("results");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{marker.name}</CardTitle>
          <Badge className={statusColors[marker.status] ?? ""} variant="secondary">
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
