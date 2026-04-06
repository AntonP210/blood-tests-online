"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TestTubeDiagonal, ShieldCheck } from "lucide-react";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground sm:h-7 sm:w-7">
                <TestTubeDiagonal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="text-sm font-bold">
                {t("common.appName")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>{t("footer.privacyTagline")}</span>
            </div>
          </div>

          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
            >
              {t("common.privacyPolicy")}
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
            >
              {t("common.termsOfService")}
            </Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-border/50 pt-4 sm:mt-8 sm:pt-6">
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
            {t("disclaimer.banner")}
          </p>
        </div>
      </div>
    </footer>
  );
}
