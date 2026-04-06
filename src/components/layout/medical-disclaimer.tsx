"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

export function MedicalDisclaimer() {
  const t = useTranslations("disclaimer");

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p>{t("banner")}</p>
      </div>
    </div>
  );
}
