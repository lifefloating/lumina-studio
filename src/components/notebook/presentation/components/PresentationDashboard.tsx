"use client";

import { createBlankPresentation } from "@/app/_actions/notebook/presentation/presentationActions";
import { fetchPresentations } from "@/app/_actions/notebook/presentation/fetchPresentations";
import { ModelPicker } from "@/components/notebook/presentation/components/ModelPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { GENERATION_LANGUAGE_OPTIONS } from "@/lib/i18n/resources";
import { usePresentationState } from "@/states/presentation-state";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { FilePlus2, Globe, Loader2, Presentation, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function PresentationDashboard() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const {
    presentationInput,
    setPresentationInput,
    language,
    setLanguage,
    modelId,
    modelProvider,
    numSlides,
    setNumSlides,
    webSearchEnabled,
    setWebSearchEnabled,
    setCurrentPresentation,
    setPendingCreateRequest,
    setTheme,
    resetPresentationState,
  } = usePresentationState();

  const { data, isLoading } = useQuery({
    queryKey: ["presentations"],
    queryFn: () => fetchPresentations(0),
  });

  const items = data?.items ?? [];
  const dateLocale = i18n.resolvedLanguage?.startsWith("zh") ? zhCN : enUS;
  const slidesOptions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => `${index + 1}`),
    [],
  );

  const createPresentation = async () => {
    setIsCreating(true);
    const prompt = presentationInput.trim();
    const selectedLanguage = language;
    const selectedNumSlides = numSlides;
    const selectedWebSearchEnabled = webSearchEnabled;
    resetPresentationState();

    try {
      setPendingCreateRequest({
        prompt,
        language: selectedLanguage,
        modelId,
        modelProvider,
        numSlides: selectedNumSlides,
        webSearchEnabled: selectedWebSearchEnabled,
      });
      router.push("/presentation/create");
    } catch (error) {
      console.error(error);
      toast.error(t("dashboard.toastCreateFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  const createBlank = async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    const title = presentationInput.trim() || t("dashboard.blankPresentation");
    const selectedLanguage = language;

    try {
      const theme = resolvedTheme === "dark" ? "ebony" : "mystique";
      const result = await createBlankPresentation(
        title,
        theme,
        selectedLanguage,
      );

      if (!result.success || !result.presentation) {
        toast.error(result.message ?? t("dashboard.toastCreateFailed"));
        return;
      }

      setTheme(theme);
      setCurrentPresentation(result.presentation.id, result.presentation.title);
      router.replace(`/presentation/${result.presentation.id}`);
    } catch (error) {
      console.error(error);
      toast.error(t("dashboard.toastCreateFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="border-border/60 bg-background/70 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              {t("dashboard.createTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Textarea
              value={presentationInput}
              onChange={(event) => setPresentationInput(event.target.value)}
              placeholder={t("dashboard.promptPlaceholder")}
              className="min-h-36 resize-none"
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ModelPicker />

              <div className="space-y-2">
                <div className="text-sm font-medium">{t("dashboard.slides")}</div>
                <Select
                  value={String(numSlides)}
                  onValueChange={(value) => setNumSlides(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {slidesOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {t("dashboard.language")}
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENERATION_LANGUAGE_OPTIONS.map(([value, labelKey]) => (
                      <SelectItem key={value} value={value}>
                        {t(labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {t("dashboard.webSearch")}
                </div>
                <div className="flex h-10 items-center justify-between rounded-md border px-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    {webSearchEnabled
                      ? t("dashboard.webSearchEnabled")
                      : t("dashboard.webSearchDisabled")}
                  </div>
                  <Switch
                    checked={webSearchEnabled}
                    onCheckedChange={setWebSearchEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => void createPresentation()}
                disabled={isCreating || !presentationInput.trim()}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {t("dashboard.generateOutline")}
              </Button>
              <Button
                variant="outline"
                onClick={() => void createBlank()}
                disabled={isCreating}
              >
                <FilePlus2 className="mr-2 h-4 w-4" />
                {t("dashboard.blankPresentation")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background/70 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Presentation className="h-5 w-5 text-primary" />
              {t("dashboard.recentTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("dashboard.loadingPresentations")}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                {t("dashboard.empty")}
              </div>
            ) : (
              items.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(`/presentation/${item.id}`)}
                  className="flex w-full flex-col rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">
                    {item.title || t("common.untitledPresentation")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t("dashboard.updated", {
                      time: formatDistanceToNow(new Date(item.updatedAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      }),
                    })}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
