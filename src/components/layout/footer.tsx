"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TestTubeDiagonal, ShieldCheck } from "lucide-react";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <TestTubeDiagonal className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold">
                {t("common.appName")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Zero data retention. Your privacy, guaranteed.</span>
            </div>
          </div>

          <nav className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border/50 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            {t("disclaimer.banner")}
          </p>
        </div>
      </div>
    </footer>
  );
}
