"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SummarySection({ summary }: { summary: string }) {
  const t = useTranslations("results");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{t("summaryTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{summary}</p>
      </CardContent>
    </Card>
  );
}
