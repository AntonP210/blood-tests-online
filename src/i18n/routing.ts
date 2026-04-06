import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "he", "ru", "es", "de", "fr"],
  defaultLocale: "en",
});
