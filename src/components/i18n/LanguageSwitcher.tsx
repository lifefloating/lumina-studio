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
  normalizeLocale,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/resources";
import { Languages } from "lucide-react";
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
  const currentLocale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-2"
          aria-label={t("languageSwitcher.ariaLabel")}
          title={t("languageSwitcher.label")}
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold">
            {LANGUAGE_SHORT_LABELS[currentLocale]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("languageSwitcher.label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={currentLocale}
          onValueChange={(locale) => {
            void i18n.changeLanguage(normalizeLocale(locale));
          }}
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <DropdownMenuRadioItem key={locale} value={locale}>
              {t(LANGUAGE_LABEL_KEYS[locale])}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
