"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function Recommendations({
  recommendations,
}: {
  recommendations: string[];
}) {
  const t = useTranslations("results");

  if (recommendations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recommendationsTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm text-muted-foreground">{rec}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
