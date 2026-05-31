"use client";

import { createI18nInstance } from "@/lib/i18n/client";
import {
  type AppLocale,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  normalizeLocale,
} from "@/lib/i18n/resources";
import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";

function getStoredLocale(initialLocale: AppLocale): AppLocale {
  try {
    const storedLocale = window.localStorage.getItem(LOCALE_COOKIE);

    if (storedLocale) {
      return normalizeLocale(storedLocale);
    }

    return normalizeLocale(window.navigator.language);
  } catch {
    return initialLocale;
  }
}

function persistLocale(locale: AppLocale) {
  document.documentElement.lang = locale;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;

  try {
    window.localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    // Storage may be unavailable in private or restricted browsing contexts.
  }
}

export function AppI18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: AppLocale;
}) {
  const [i18n] = useState(() => createI18nInstance(initialLocale));

  useEffect(() => {
    const locale = getStoredLocale(initialLocale);

    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }

    persistLocale(locale);
  }, [i18n, initialLocale]);

  useEffect(() => {
    const handleLanguageChange = (locale: string) => {
      persistLocale(normalizeLocale(locale));
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
