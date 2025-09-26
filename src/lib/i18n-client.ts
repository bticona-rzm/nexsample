// i18n-client.ts
"use client"; // This ensures the file only runs on the client

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Direct imports of your JSON translation files
import en from "../public/locales/en/common.json";
import es from "../public/locales/es/common.json";

const resources = {
  en: { common: en },
  es: { common: es },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      lng: "en", // ← Change this dynamically later if needed
      fallbackLng: "en",
      supportedLngs: ["en", "es"],
      defaultNS: "common",
      resources,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false, // Required for avoiding hydration issues in SSR
      },
    });
}

export default i18n;