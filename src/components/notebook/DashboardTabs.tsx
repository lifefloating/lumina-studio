"use client";

import { ImageStudio } from "@/components/notebook/image-studio/ImageStudio";
import { PresentationDashboard } from "@/components/notebook/presentation/components/PresentationDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Presentation } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DashboardTabs() {
  const { t } = useTranslation();

  return (
    <Tabs
      defaultValue="presentation"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6"
    >
      <TabsList className="mx-auto h-11 rounded-xl p-1">
        <TabsTrigger
          value="presentation"
          className="gap-2 rounded-lg px-4 text-sm"
        >
          <Presentation className="size-4" />
          {t("dashboard.tabPresentation")}
        </TabsTrigger>
        <TabsTrigger value="image" className="gap-2 rounded-lg px-4 text-sm">
          <ImageIcon className="size-4" />
          {t("dashboard.tabImage")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="presentation" className="mt-0 focus-visible:outline-none">
        <PresentationDashboard />
      </TabsContent>
      <TabsContent value="image" className="mt-0 focus-visible:outline-none">
        <ImageStudio />
      </TabsContent>
    </Tabs>
  );
}
