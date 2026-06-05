"use client";

import { fetchPresentations } from "@/app/_actions/notebook/presentation/fetchPresentations";
import { createBlankPresentation } from "@/app/_actions/notebook/presentation/presentationActions";
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
import {
  FilePlus2,
  Globe,
  Layers,
  Loader2,
  Presentation,
  Search,
  Sparkles,
} from "lucide-react";
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
    <div className="flex w-full flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
        <Card className="overflow-hidden border-border/60 bg-background shadow-xs">
          <CardHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="size-5 text-primary" />
              {t("dashboard.createTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <Textarea
              value={presentationInput}
              onChange={(event) => setPresentationInput(event.target.value)}
              placeholder={t("dashboard.promptPlaceholder")}
              className="min-h-44 resize-none rounded-lg border-border/70 bg-muted/20 px-4 py-3 text-base shadow-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0"
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.72fr)_minmax(0,0.9fr)_minmax(0,1.04fr)]">
              <ModelPicker />

              <div className="min-w-0 space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Layers className="size-3.5" />
                  {t("dashboard.slides")}
                </label>
                <Select
                  value={String(numSlides)}
                  onValueChange={(value) => setNumSlides(Number(value))}
                >
                  <SelectTrigger className="h-10 rounded-lg bg-background shadow-none">
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

              <div className="min-w-0 space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Globe className="size-3.5" />
                  {t("dashboard.language")}
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-10 rounded-lg bg-background shadow-none">
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

              <div className="min-w-0 space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Search className="size-3.5" />
                  {t("dashboard.webSearch")}
                </label>
                <div className="flex h-10 min-w-0 items-center justify-between gap-3 rounded-lg border border-input bg-background px-3">
                  <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    <Globe className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {webSearchEnabled
                        ? t("dashboard.webSearchEnabled")
                        : t("dashboard.webSearchDisabled")}
                    </span>
                  </div>
                  <Switch
                    aria-label={t("dashboard.webSearch")}
                    checked={webSearchEnabled}
                    onCheckedChange={setWebSearchEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                onClick={() => void createPresentation()}
                disabled={isCreating || !presentationInput.trim()}
                className="h-10 px-4 sm:min-w-36"
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
                className="h-10 px-4 sm:min-w-36"
              >
                <FilePlus2 className="mr-2 h-4 w-4" />
                {t("dashboard.blankPresentation")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background shadow-xs">
          <CardHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Presentation className="size-5 text-primary" />
              {t("dashboard.recentTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5 sm:p-6">
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
                  className="flex w-full flex-col rounded-lg border border-border/70 p-3 text-left transition-colors hover:bg-muted/50"
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
