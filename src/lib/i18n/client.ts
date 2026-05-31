"use client";

import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import {
  type AppLocale,
  DEFAULT_LOCALE,
  resources,
  SUPPORTED_LOCALES,
} from "./resources";

export function createI18nInstance(locale: AppLocale = DEFAULT_LOCALE) {
  const i18n = createInstance();

  void i18n.use(initReactI18next).init({
    fallbackLng: DEFAULT_LOCALE,
    initAsync: false,
    interpolation: {
      escapeValue: false,
    },
    lng: locale,
    react: {
      useSuspense: false,
    },
    resources,
    supportedLngs: SUPPORTED_LOCALES,
  });

  return i18n;
}
