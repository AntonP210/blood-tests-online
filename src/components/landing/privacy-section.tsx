"use client";

import { useTranslations } from "next-intl";
import { UserX, DatabaseZap, Lock, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: UserX,
    titleKey: "privacyNoAccount",
    descKey: "privacyNoAccountDesc",
  },
  {
    icon: DatabaseZap,
    titleKey: "privacyNoStorage",
    descKey: "privacyNoStorageDesc",
  },
  {
    icon: Lock,
    titleKey: "privacySecure",
    descKey: "privacySecureDesc",
  },
] as const;

export function PrivacySection() {
  const t = useTranslations("landing");

  return (
    <section className="relative overflow-hidden bg-foreground py-16 sm:py-24 lg:py-32">
      {/* Decorative glow behind the section */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-primary/15 blur-[120px] sm:h-[600px] sm:w-[600px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Big bold headline */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:mb-6 sm:px-4 sm:text-sm">
            <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {t("privacyPromise")}
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-background sm:text-3xl lg:text-5xl">
            {t("privacyTitle")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-background/60 sm:mt-6 sm:text-base lg:text-lg">
            {t("privacySubtitle")}
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-10 grid gap-4 sm:mt-16 sm:grid-cols-3 sm:gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.titleKey}
              className="group rounded-xl p-6 border border-background/10 bg-background/5 backdrop-blur-sm transition-colors hover:bg-background/10 sm:rounded-2xl sm:p-8"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary transition-transform group-hover:scale-110 sm:mb-5 sm:h-12 sm:w-12 sm:rounded-xl">
                <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base font-bold text-background sm:text-lg">
                {t(feature.titleKey)}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-background/55 sm:text-sm">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom promise line */}
        <p className="mt-8 text-center text-xs italic text-background/40 sm:mt-12 sm:text-sm">
          {t("privacyPromiseDesc")}
        </p>
      </div>
    </section>
  );
}
