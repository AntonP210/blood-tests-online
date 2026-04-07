import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, EyeOff, DatabaseZap } from "lucide-react";

export async function HeroSection() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");
  const th = await getTranslations("hero");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30 py-16 sm:py-24 lg:py-36">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -end-40 h-[300px] w-[300px] rounded-full bg-primary/10 blur-3xl sm:h-[500px] sm:w-[500px]" />
      <div className="pointer-events-none absolute -bottom-40 -start-40 h-[250px] w-[250px] rounded-full bg-accent/20 blur-3xl sm:h-[400px] sm:w-[400px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Privacy badge - prominent */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary sm:mb-8 sm:gap-2.5 sm:px-5 sm:py-2 sm:text-sm">
            <ShieldCheck className="h-4 w-4" />
            <span>{t("heroBadge")}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-7xl">
            {t("heroTitle")}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg lg:text-xl">
            {t("heroSubtitleLine1")}
          </p>
          <p className="mx-auto mt-3 text-base font-bold text-foreground sm:text-lg lg:text-xl">
            {t("heroSubtitleLine2")}
          </p>

          {/* Privacy trust indicators - inline */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-muted-foreground sm:mt-8 sm:gap-6 sm:text-sm">
            <span className="flex items-center gap-1.5">
              <EyeOff className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
              {th("noAccount")}
            </span>
            <span className="hidden text-border sm:inline">|</span>
            <span className="flex items-center gap-1.5">
              <DatabaseZap className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
              {th("noDataStored")}
            </span>
            <span className="hidden text-border sm:inline">|</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
              {th("encryptedDiscarded")}
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
            <Button
              render={<Link href="/analyze" />}
              size="lg"
              className="w-full gap-2 rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/25 sm:w-auto"
            >
              {tc("getStarted")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              render={<Link href="/pricing" />}
              variant="outline"
              size="lg"
              className="w-full rounded-full px-8 text-base sm:w-auto"
            >
              {tc("viewPricing")}
            </Button>
          </div>
          <p className="mt-3 text-xs font-medium text-primary/70">{t("heroFree")}</p>
        </div>
      </div>
    </section>
  );
}
