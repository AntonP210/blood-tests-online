"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";

interface UsageData {
  used: number;
  limit: number;
  remaining: number;
  isPaid: boolean;
  subscriptionStatus: string;
}

export function UsageIndicator() {
  const t = useTranslations("usage");
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => null);
  }, []);

  if (!data) return null;

  if (data.subscriptionStatus === "active" || data.remaining === -1) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
        <Zap className="h-3.5 w-3.5" />
        <span className="font-medium">{t("unlimited")}</span>
      </div>
    );
  }

  const isLow = data.remaining <= 1 && data.remaining > 0;
  const isEmpty = data.remaining === 0;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
        isEmpty
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          : isLow
            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
            : "border-border bg-muted/50 text-muted-foreground"
      }`}
    >
      <Zap className="h-3.5 w-3.5" />
      <span className="font-medium">
        {isEmpty
          ? t("noAnalysesLeft")
          : t("analysesRemaining", { count: data.remaining, total: data.limit })}
      </span>
    </div>
  );
}
