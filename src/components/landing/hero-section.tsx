"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, EyeOff, DatabaseZap } from "lucide-react";

export function HeroSection() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30 py-24 sm:py-36">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Privacy badge - prominent */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4.5 w-4.5" />
            <span>{t("heroBadge")}</span>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {t("heroTitle")}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t.rich("heroSubtitle", {
              strong: (chunks) => (
                <strong className="font-bold text-foreground">{chunks}</strong>
              ),
            })}
          </p>

          {/* Privacy trust indicators - inline */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <EyeOff className="h-4 w-4 text-primary" />
              No account
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5">
              <DatabaseZap className="h-4 w-4 text-primary" />
              No data stored
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Encrypted & discarded
            </span>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              render={<Link href="/analyze" />}
              size="lg"
              className="gap-2 rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/25"
            >
              {tc("getStarted")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              render={<Link href="/pricing" />}
              variant="outline"
              size="lg"
              className="rounded-full px-8 text-base"
            >
              {tc("viewPricing")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
