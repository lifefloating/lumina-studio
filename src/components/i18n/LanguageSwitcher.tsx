"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type AppLocale,
  DEFAULT_LOCALE,
  normalizeLocale,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/resources";
import { Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGE_LABEL_KEYS: Record<AppLocale, string> = {
  en: "languageSwitcher.english",
  "zh-CN": "languageSwitcher.simplifiedChinese",
};

const LANGUAGE_SHORT_LABELS: Record<AppLocale, string> = {
  en: "EN",
  "zh-CN": "中",
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Until mounted, render the default locale so the server-rendered markup and
  // the client's first paint match. The provider may switch the language inside
  // an effect (from a cookie or navigator.language), which would otherwise cause
  // a hydration mismatch on locale-dependent text/attributes.
  const currentLocale: AppLocale = mounted
    ? normalizeLocale(i18n.resolvedLanguage ?? i18n.language)
    : DEFAULT_LOCALE;

  // Resolve translations against the same locale used for `currentLocale` so the
  // first paint is internally consistent and matches the server.
  const tt = mounted ? t : i18n.getFixedT(DEFAULT_LOCALE);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-2"
          aria-label={tt("languageSwitcher.ariaLabel")}
          title={tt("languageSwitcher.label")}
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold">
            {LANGUAGE_SHORT_LABELS[currentLocale]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{tt("languageSwitcher.label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={currentLocale}
          onValueChange={(locale) => {
            void i18n.changeLanguage(normalizeLocale(locale));
          }}
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <DropdownMenuRadioItem key={locale} value={locale}>
              {tt(LANGUAGE_LABEL_KEYS[locale])}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
