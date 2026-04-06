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
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t("howItWorksTitle")}
        </h2>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.titleKey} className="group relative text-center">
              {/* Step number */}
              <div className="mx-auto mb-6 relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/25">
                  <step.icon className="h-7 w-7" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </div>

              <h3 className="text-lg font-bold">{t(step.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(step.descKey)}
              </p>

              {/* Connector arrow (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="pointer-events-none absolute top-8 right-0 hidden translate-x-1/2 text-border sm:block">
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
