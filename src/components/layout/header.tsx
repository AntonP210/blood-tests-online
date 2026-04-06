"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { TestTubeDiagonal } from "lucide-react";

export function Header() {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TestTubeDiagonal className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight">{t("appName")}</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("pricing")}
          </Link>
          <Button
            render={<Link href="/analyze" />}
            size="sm"
            className="rounded-full px-5 font-semibold"
          >
            {t("getStarted")}
          </Button>
        </nav>
      </div>
    </header>
  );
}
