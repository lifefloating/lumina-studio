"use client";

import { ModelPicker } from "@/components/notebook/presentation/components/ModelPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import {
  ChevronDown,
  Globe,
  Layers,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function Header() {
  const { t } = useTranslation();
  const {
    presentationInput,
    setPresentationInput,
    numSlides,
    setNumSlides,
    language,
    setLanguage,
    webSearchEnabled,
    setWebSearchEnabled,
    isGeneratingOutline,
    startOutlineGeneration,
  } = usePresentationState();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const prompt = presentationInput.trim();

  useEffect(() => {
    if (!isGeneratingOutline) {
      setIsRegenerating(false);
    }
  }, [isGeneratingOutline]);

  function handleRegenerate() {
    if (!prompt) {
      toast.error(t("outline.topicRequired"));
      return;
    }
    setIsRegenerating(true);
    startOutlineGeneration();
  }

  return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* ── Compact bar (always visible) ── */}
        <div
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border bg-muted/30 p-3 text-left transition-colors",
            isExpanded && "rounded-b-none",
          )}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180",
                )}
              />
              <span className="truncate text-sm font-medium">
                {prompt || t("outline.untitled")}
              </span>
            </button>
          </CollapsibleTrigger>

          {/* Inline metadata badges */}
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <Badge variant="secondary" className="font-normal">
              {t("outline.slideCount", { count: numSlides })}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {language}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {webSearchEnabled ? t("outline.searchOn") : t("outline.searchOff")}
            </Badge>
          </div>

          {/* Regenerate */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isGeneratingOutline || !prompt}
            className="h-7 shrink-0 gap-1.5 rounded-full px-3 text-xs"
          >
            <RefreshCw
              className={cn("size-3.5", isRegenerating && "animate-spin")}
            />
            <span className="hidden sm:inline">{t("outline.regenerate")}</span>
          </Button>
        </div>

        {/* ── Expanded editing panel ── */}
        <CollapsibleContent>
          <div className="rounded-b-lg border border-t-0 bg-muted/30 p-4">
            <div className="space-y-4">
              {/* Mobile-only badges */}
              <div className="flex flex-wrap gap-1.5 sm:hidden">
                <Badge variant="secondary" className="font-normal">
                  {t("outline.slideCount", { count: numSlides })}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {language}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {webSearchEnabled ? t("outline.searchOn") : t("outline.searchOff")}
                </Badge>
              </div>

              {/* Prompt */}
              <div className="space-y-1.5">
                <label
                  htmlFor="outline-prompt"
                  className="text-xs font-medium text-muted-foreground"
                >
                  {t("outline.prompt")}
                </label>
                <Textarea
                  id="outline-prompt"
                  value={presentationInput}
                  onChange={(e) => setPresentationInput(e.target.value)}
                  disabled={isGeneratingOutline}
                  rows={3}
                  placeholder={t("dashboard.promptPlaceholder")}
                  className="min-h-20 resize-none rounded-xl border-border/50 bg-background px-3.5 py-2.5 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>

              {/* Settings row — labeled selects + toggle */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ModelPicker className="sm:col-span-2 xl:col-span-4" />

                {/* Number of slides */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Layers className="size-3.5" />
                    {t("dashboard.slides")}
                  </label>
                  <Select
                    value={String(numSlides)}
                    onValueChange={(v) => setNumSlides(Number(v))}
                  >
                    <SelectTrigger className="h-9 rounded-lg bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {t("outline.slideCount", { count: n })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Globe className="size-3.5" />
                    {t("outline.language")}
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-9 rounded-lg bg-background">
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

                {/* Web search */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Search className="size-3.5" />
                    {t("dashboard.webSearch")}
                  </label>
                  <div className="flex h-9 items-center justify-between rounded-lg border bg-background px-3">
                    <span className="text-sm text-muted-foreground">
                      {webSearchEnabled
                        ? t("dashboard.webSearchEnabled")
                        : t("dashboard.webSearchDisabled")}
                    </span>
                    <Switch
                      checked={webSearchEnabled}
                      onCheckedChange={setWebSearchEnabled}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
  );
}
