"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqKeys = [
  { q: "faq1Q", a: "faq1A" },
  { q: "faq2Q", a: "faq2A" },
  { q: "faq3Q", a: "faq3A" },
  { q: "faq4Q", a: "faq4A" },
] as const;

export function FAQSection() {
  const t = useTranslations("landing");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-muted/50 py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
          {t("faqTitle")}
        </h2>

        <div className="mt-8 space-y-2 sm:mt-14 sm:space-y-3">
          {faqKeys.map((faq, index) => (
            <div
              key={faq.q}
              className="overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-sm sm:rounded-xl"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="flex w-full items-center justify-between px-4 py-4 text-left sm:px-6 sm:py-5"
              >
                <span className="text-sm font-semibold sm:text-base">{t(faq.q)}</span>
                <ChevronDown
                  className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 sm:h-5 sm:w-5 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4 text-xs leading-relaxed text-muted-foreground sm:px-6 sm:pb-5 sm:text-sm">
                  {t(faq.a)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
