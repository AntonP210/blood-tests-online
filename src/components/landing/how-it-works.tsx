"use client";

import { useTranslations } from "next-intl";
import { Upload, Brain, FileCheck } from "lucide-react";

const steps = [
  { icon: Upload, titleKey: "step1Title", descKey: "step1Description" },
  { icon: Brain, titleKey: "step2Title", descKey: "step2Description" },
  { icon: FileCheck, titleKey: "step3Title", descKey: "step3Description" },
] as const;

export function HowItWorks() {
  const t = useTranslations("landing");

  return (
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
          {t("howItWorksTitle")}
        </h2>

        <div className="mt-10 grid gap-8 sm:mt-16 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.titleKey} className="group relative text-center">
              {/* Step number */}
              <div className="mx-auto mb-4 relative sm:mb-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/25 sm:h-16 sm:w-16">
                  <step.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <span className="absolute -top-2 -end-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:h-7 sm:w-7">
                  {index + 1}
                </span>
              </div>

              <h3 className="text-base font-bold sm:text-lg">{t(step.titleKey)}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {t(step.descKey)}
              </p>

              {/* Connector arrow (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="pointer-events-none absolute top-8 end-0 hidden translate-x-1/2 text-border rtl:-scale-x-100 sm:block">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
