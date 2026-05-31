"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionModal({
  open,
  onOpenChange,
}: SubscriptionModalProps) {
  const { t } = useTranslation();
  const plans = [
    {
      name: "Plus",
      price: "$10",
      period: t("subscription.periodMonth"),
      features: [
        t("subscription.unlimitedCreations"),
        t("subscription.plusRemoveBranding"),
        t("subscription.plusAdvancedAnimations"),
        t("subscription.plusAdvancedImageModels"),
      ],
    },
    {
      name: "Pro",
      price: "$25",
      period: t("subscription.periodMonth"),
      features: [
        t("subscription.everythingInPlus"),
        t("subscription.premiumImageModels"),
        t("subscription.customBranding"),
        t("subscription.detailedAnalytics"),
        t("subscription.apiAccess"),
      ],
      popular: true,
    },
    {
      name: "Ultra",
      price: "$100",
      period: t("subscription.periodMonth"),
      features: [
        t("subscription.everythingInPro"),
        t("subscription.mostAdvancedModels"),
        t("subscription.prioritySupport"),
        t("subscription.earlyAccess"),
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-100 max-w-6xl gap-0 p-0">
        <VisuallyHidden>
          <DialogTitle>{t("subscription.title")}</DialogTitle>
          <DialogDescription>{t("subscription.choosePlan")}</DialogDescription>
        </VisuallyHidden>
        <div className="border-b px-8 pt-8 pb-6">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("subscription.title")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("subscription.choosePlan")}
          </p>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`space-y-6 bg-background p-10 ${plan.popular ? "relative" : ""}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 left-0 bg-primary py-1 text-center text-xs font-medium text-primary-foreground">
                  {t("subscription.mostPopular")}
                </div>
              )}

              <div className={`space-y-4 ${plan.popular ? "mt-6" : ""}`}>
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {t("subscription.getStarted")}
                </Button>

                <div className="space-y-3 pt-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-muted/30 px-8 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("subscription.cancelAnytime")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
