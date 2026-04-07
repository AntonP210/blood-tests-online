import { getTranslations } from "next-intl/server";
import { Upload, Brain, FileCheck } from "lucide-react";

const steps = [
  { icon: Upload, titleKey: "step1Title", descKey: "step1Description" },
  { icon: Brain, titleKey: "step2Title", descKey: "step2Description" },
  { icon: FileCheck, titleKey: "step3Title", descKey: "step3Description" },
] as const;

export async function HowItWorks() {
  const t = await getTranslations("landing");

  return (
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
          {t("howItWorksTitle")}
        </h2>

        {/* Mobile: vertical timeline */}
        <div className="mt-10 flex flex-col gap-0 sm:hidden">
          {steps.map((step, index) => (
            <div key={step.titleKey} className="flex gap-4">
              {/* Timeline line + number */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-px flex-1 bg-border my-1" />
                )}
              </div>
              {/* Content */}
              <div className="pb-8">
                <div className="flex items-center gap-2.5">
                  <step.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold">{t(step.titleKey)}</h3>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {t(step.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: horizontal steps */}
        <div className="mt-16 hidden sm:grid sm:grid-cols-3 sm:gap-8">
          {steps.map((step, index) => (
            <div key={step.titleKey} className="group relative text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/25">
                <step.icon className="h-7 w-7" />
              </div>

              <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-primary">
                {t("stepLabel")} {index + 1}
              </span>

              <h3 className="text-lg font-bold">{t(step.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(step.descKey)}
              </p>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="pointer-events-none absolute top-8 end-0 hidden translate-x-1/2 sm:block">
                  <div className="h-px w-12 bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
