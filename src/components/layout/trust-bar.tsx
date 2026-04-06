"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";

export function TrustBar() {
  const t = useTranslations("trustBar");

  return (
    <div className="bg-primary px-3 py-1.5 text-center text-xs font-medium text-primary-foreground sm:px-4 sm:text-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5" />
        <p>{t("message")}</p>
      </div>
    </div>
  );
}
