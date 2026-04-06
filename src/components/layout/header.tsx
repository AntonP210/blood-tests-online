"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { TestTubeDiagonal, Menu, X } from "lucide-react";

export function Header() {
  const t = useTranslations("common");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:h-8 sm:w-8">
            <TestTubeDiagonal className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight sm:text-lg">
            {t("appName")}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
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

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground sm:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border/50 bg-background px-4 pb-4 pt-3 sm:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              href="/pricing"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("pricing")}
            </Link>
            <Button
              render={<Link href="/analyze" />}
              onClick={() => setMenuOpen(false)}
              size="sm"
              className="w-full rounded-full font-semibold"
            >
              {t("getStarted")}
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
