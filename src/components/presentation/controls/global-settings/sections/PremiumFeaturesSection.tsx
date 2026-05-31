"use client";

import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SubscriptionModal } from "../../SubscriptionModal";

export function PremiumFeaturesSection() {
  const { t } = useTranslation();
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  const handlePremiumFeatureClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSubscriptionModalOpen(true);
  };
  return (
    <>
      <SubscriptionModal
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
      />
      <div className="space-y-3">
        <Label className="text-sm font-semibold">
          {t("premium.animations")}
        </Label>
        <div
          className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
          onClick={handlePremiumFeatureClick}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{t("premium.enableAnimations")}</span>
            <span className="flex items-center gap-1 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
              <span>👑</span> {t("premium.pro")}
            </span>
          </div>
          <div className="pointer-events-none">
            <input type="checkbox" className="sr-only" />
            <div className="relative h-6 w-11 rounded-full bg-muted">
              <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-background transition-transform" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">{t("premium.branding")}</Label>
        <div
          className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
          onClick={handlePremiumFeatureClick}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{t("premium.removeBranding")}</span>
            <span className="flex items-center gap-1 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
              <span>👑</span> {t("premium.pro")}
            </span>
          </div>
          <div className="pointer-events-none">
            <input type="checkbox" className="sr-only" />
            <div className="relative h-6 w-11 rounded-full bg-muted">
              <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-background transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
