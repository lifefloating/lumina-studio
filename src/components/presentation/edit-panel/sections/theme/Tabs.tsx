"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ThemeModalTabsProps {
  activeTab: "standard" | "public";
  onTabChange: (tab: "standard" | "public") => void;
}

export function ThemeModalTabs({
  activeTab,
  onTabChange,
}: ThemeModalTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 pt-4">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => onTabChange("standard")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "standard"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("themeModal.lumina")}
        </button>
        <button
          onClick={() => onTabChange("public")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "public"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("themeModal.public")}
        </button>
      </div>
    </div>
  );
}
