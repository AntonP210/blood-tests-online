"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("languageSwitcher");

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.replace(pathname, { locale: e.target.value });
  }

  return (
    <div className="relative flex items-center gap-1.5">
      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      <select
        value={locale}
        onChange={onChange}
        aria-label={t("label")}
        className="appearance-none bg-transparent text-xs font-medium text-muted-foreground outline-none cursor-pointer hover:text-foreground sm:text-sm"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
    </div>
  );
}
