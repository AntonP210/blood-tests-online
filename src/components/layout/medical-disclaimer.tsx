"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

export function MedicalDisclaimer() {
  const t = useTranslations("disclaimer");

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-center text-[11px] font-medium leading-relaxed text-amber-800 sm:px-4 sm:py-3 sm:text-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p>{t("banner")}</p>
      </div>
    </div>
  );
}
