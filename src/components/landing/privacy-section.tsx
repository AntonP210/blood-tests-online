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
    <section className="relative overflow-hidden bg-foreground py-24 sm:py-32">
      {/* Decorative glow behind the section */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/15 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Big bold headline */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            {t("privacyPromise")}
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-background sm:text-4xl lg:text-5xl">
            {t("privacyTitle")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-background/60">
            {t("privacySubtitle")}
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.titleKey}
              className="group rounded-2xl border border-background/10 bg-background/5 p-8 backdrop-blur-sm transition-colors hover:bg-background/10"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary transition-transform group-hover:scale-110">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-background">
                {t(feature.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-background/55">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom promise line */}
        <p className="mt-12 text-center text-sm italic text-background/40">
          {t("privacyPromiseDesc")}
        </p>
      </div>
    </section>
  );
}
