"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePresentationState } from "@/states/presentation-state";
import { List } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PresentationCustomizer() {
  const { t } = useTranslation();
  const {
    textContent,
    setTextContent,
    tone,
    setTone,
    audience,
    setAudience,
    scenario,
    setScenario,
  } = usePresentationState();

  const contentOptions = [
    { id: "minimal", labelKey: "minimal", lines: 2 },
    { id: "concise", labelKey: "concise", lines: 3 },
    { id: "detailed", labelKey: "detailed", lines: 3 },
    { id: "extensive", labelKey: "extensive", lines: 3 },
  ] as const;

  const toneOptions = [
    { id: "auto", labelKey: "auto" },
    { id: "general", labelKey: "general" },
    { id: "persuasive", labelKey: "persuasive" },
    { id: "inspiring", labelKey: "inspiring" },
    { id: "instructive", labelKey: "instructive" },
    { id: "engaging", labelKey: "engaging" },
  ] as const;

  const audienceOptions = [
    { id: "auto", labelKey: "auto" },
    { id: "general", labelKey: "general" },
    { id: "business", labelKey: "business" },
    { id: "investor", labelKey: "investor" },
    { id: "teacher", labelKey: "teacher" },
    { id: "student", labelKey: "student" },
  ] as const;

  const scenarioOptions = [
    { id: "auto", labelKey: "auto" },
    { id: "general", labelKey: "general" },
    { id: "analysis-report", labelKey: "analysisReport" },
    { id: "teaching-training", labelKey: "teaching" },
    { id: "promotional-materials", labelKey: "promotional" },
    { id: "public-speeches", labelKey: "publicSpeeches" },
  ] as const;

  return (
    <div className="space-y-4 rounded-xl border bg-muted/40">
      {/* Text Content Section */}
      <div className="border-0 p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <List className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            {t("presentationEditor.customizer.textContent")}
          </h2>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {t("presentationEditor.customizer.textContentDescription")}
        </p>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {contentOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setTextContent(option.id)}
              className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                textContent === option.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-accent"
              }`}
            >
              <div className="flex h-12 w-full flex-col items-center justify-center gap-1">
                {Array.from({ length: option.lines }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full ${textContent === option.id ? "bg-primary" : "bg-muted-foreground"}`}
                    style={{
                      width: i === option.lines - 1 ? "60%" : "80%",
                    }}
                  />
                ))}
              </div>
              <span
                className={`text-sm font-medium ${textContent === option.id ? "text-primary" : "text-foreground"}`}
              >
                {t(
                  `presentationEditor.customizer.options.${option.labelKey}`,
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Tone Select */}
          <div>
            <label className="mb-3 block text-sm font-medium text-foreground">
              {t("presentationEditor.customizer.tone")}
            </label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t("presentationEditor.customizer.selectTone")}
                />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {t(
                      `presentationEditor.customizer.options.${option.labelKey}`,
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Audience Select */}
          <div>
            <label className="mb-3 block text-sm font-medium text-foreground">
              {t("presentationEditor.customizer.audience")}
            </label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t(
                    "presentationEditor.customizer.selectAudience",
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {audienceOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {t(
                      `presentationEditor.customizer.options.${option.labelKey}`,
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scenario Select */}
          <div>
            <label className="mb-3 block text-sm font-medium text-foreground">
              {t("presentationEditor.customizer.scenario")}
            </label>
            <Select value={scenario} onValueChange={setScenario}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t(
                    "presentationEditor.customizer.selectScenario",
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {scenarioOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {t(
                      `presentationEditor.customizer.options.${option.labelKey}`,
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
