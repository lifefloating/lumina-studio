"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import {
  fallbackModels,
  getSelectedModel,
  setSelectedModel,
  useLocalModels,
  useOpenAIModels,
} from "@/hooks/presentation/useLocalModels";
import { createLogger } from "@/lib/observability/logger";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { Bot, Cpu, Loader2, Monitor, Sparkles } from "lucide-react";
import { type ChangeEvent, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const modelPickerLogger = createLogger("client:model-picker");
const DEFAULT_OPENAI_MODEL_ID = "gpt-4o-mini";
type ModelProvider = "openai" | "ollama" | "lmstudio";

function isModelProvider(value: string): value is ModelProvider {
  return value === "openai" || value === "ollama" || value === "lmstudio";
}

export function ModelPicker({
  className,
  shouldShowLabel = true,
}: {
  className?: string;
  shouldShowLabel?: boolean;
}) {
  const { t } = useTranslation();
  const { modelProvider, setModelProvider, modelId, setModelId } =
    usePresentationState();

  const { data: modelsData, isLoading, isInitialLoad } = useLocalModels();
  const {
    data: openAIModels = [],
    isError: didOpenAIModelsFail,
    isLoading: isOpenAIModelsLoading,
  } = useOpenAIModels();
  const hasRestoredFromStorage = useRef(false);

  useEffect(() => {
    if (!hasRestoredFromStorage.current) {
      const savedModel = getSelectedModel();
      if (savedModel && isModelProvider(savedModel.modelProvider)) {
        const restoredModelId =
          savedModel.modelProvider === "openai"
            ? savedModel.modelId || DEFAULT_OPENAI_MODEL_ID
            : savedModel.modelId;

        modelPickerLogger.info("Restoring previously selected model", {
          modelProvider: savedModel.modelProvider,
          modelId: restoredModelId,
        });
        setModelProvider(savedModel.modelProvider);
        setModelId(restoredModelId);
      }
      hasRestoredFromStorage.current = true;
    }
  }, [setModelId, setModelProvider]);

  const displayData = modelsData || {
    localModels: [],
    downloadableModels: fallbackModels,
    showDownloadable: false,
  };

  const { localModels, downloadableModels, showDownloadable } = displayData;
  const openAIModelId =
    modelProvider === "openai"
      ? modelId || DEFAULT_OPENAI_MODEL_ID
      : DEFAULT_OPENAI_MODEL_ID;
  const shouldShowManualOpenAIModelInput =
    modelProvider === "openai" &&
    !isOpenAIModelsLoading &&
    (didOpenAIModelsFail || openAIModels.length === 0);

  const ollamaModels = localModels.filter(
    (model) => model.provider === "ollama",
  );
  const lmStudioModels = localModels.filter(
    (model) => model.provider === "lmstudio",
  );
  const downloadableOllamaModels = downloadableModels.filter(
    (model) => model.provider === "ollama",
  );

  const createModelOption = (
    model: (typeof localModels)[0],
    isDownloadable = false,
  ) => ({
    id: model.id,
    label: model.name,
    displayLabel:
      model.provider === "ollama"
        ? `ollama ${model.name}`
        : `lm-studio ${model.name}`,
    icon: model.provider === "ollama" ? Cpu : Monitor,
    description: isDownloadable
      ? t("modelPicker.downloadableDescription", {
          provider: model.provider === "ollama" ? "Ollama" : "LM Studio",
        })
      : t("modelPicker.localDescription", {
          provider: model.provider === "ollama" ? "Ollama" : "LM Studio",
        }),
  });

  const getCurrentModelValue = () => {
    if (modelProvider === "openai") {
      return shouldShowManualOpenAIModelInput
        ? "openai"
        : `openai-${openAIModelId}`;
    }

    if (modelProvider === "ollama") {
      return `ollama-${modelId}`;
    }

    if (modelProvider === "lmstudio") {
      return `lmstudio-${modelId}`;
    }

    return "openai";
  };

  const getCurrentModelOption = () => {
    const currentValue = getCurrentModelValue();

    if (currentValue === "openai" || currentValue.startsWith("openai-")) {
      return {
        label: openAIModelId.trim() || DEFAULT_OPENAI_MODEL_ID,
        icon: Bot,
      };
    }

    const localModel = localModels.find((model) => model.id === currentValue);
    if (localModel) {
      return {
        label: localModel.name,
        icon: localModel.provider === "ollama" ? Cpu : Monitor,
      };
    }

    const downloadableModel = downloadableModels.find(
      (model) => model.id === currentValue,
    );
    if (downloadableModel) {
      return {
        label: downloadableModel.name,
        icon: downloadableModel.provider === "ollama" ? Cpu : Monitor,
      };
    }

    return {
      label: t("modelPicker.selectModel"),
      icon: Bot,
    };
  };

  const handleModelChange = (value: string) => {
    if (value === "openai") {
      const nextModelId =
        modelProvider === "openai"
          ? modelId.trim() || DEFAULT_OPENAI_MODEL_ID
          : DEFAULT_OPENAI_MODEL_ID;

      modelPickerLogger.info("Selected OpenAI model", {
        modelProvider: "openai",
        modelId: nextModelId,
      });
      setModelProvider("openai");
      setModelId(nextModelId);
      setSelectedModel("openai", nextModelId);
      return;
    }

    if (value.startsWith("openai-")) {
      const model = value.replace("openai-", "");
      modelPickerLogger.info("Selected OpenAI-compatible model", {
        modelProvider: "openai",
        modelId: model,
      });
      setModelProvider("openai");
      setModelId(model);
      setSelectedModel("openai", model);
      return;
    }

    if (value.startsWith("ollama-")) {
      const model = value.replace("ollama-", "");
      const isDownloadableSelection = downloadableModels.some(
        (candidate) => candidate.id === value,
      );
      modelPickerLogger.info("Selected Ollama model", {
        modelProvider: "ollama",
        modelId: model,
        isDownloadableSelection,
      });
      if (isDownloadableSelection) {
        modelPickerLogger.info(
          "Selected a downloadable Ollama model suggestion; the server will download it on first use if needed",
          {
            modelProvider: "ollama",
            modelId: model,
          },
        );
      }
      setModelProvider("ollama");
      setModelId(model);
      setSelectedModel("ollama", model);
      return;
    }

    if (value.startsWith("lmstudio-")) {
      const model = value.replace("lmstudio-", "");
      modelPickerLogger.info("Selected LM Studio model", {
        modelProvider: "lmstudio",
        modelId: model,
      });
      setModelProvider("lmstudio");
      setModelId(model);
      setSelectedModel("lmstudio", model);
    }
  };

  const handleOpenAIModelIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextModelId = event.target.value;
    if (modelProvider !== "openai") {
      setModelProvider("openai");
    }
    setModelId(nextModelId);

    const trimmedModelId = nextModelId.trim();
    if (trimmedModelId) {
      setSelectedModel("openai", trimmedModelId);
    }
  };

  const handleOpenAIModelIdBlur = () => {
    if (modelProvider !== "openai") {
      return;
    }

    const nextModelId = modelId.trim() || DEFAULT_OPENAI_MODEL_ID;
    setModelId(nextModelId);
    setSelectedModel("openai", nextModelId);
  };

  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      {shouldShowLabel && (
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5" />
          {t("modelPicker.label")}
        </label>
      )}
      <div className="min-w-0">
        <div
          className={cn(
            "grid min-w-0 gap-2",
            shouldShowManualOpenAIModelInput
              ? "sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]"
              : "",
          )}
        >
          <Select
            value={getCurrentModelValue()}
            onValueChange={handleModelChange}
          >
            <SelectTrigger className="h-10 overflow-hidden rounded-lg bg-background shadow-none">
              <div className="flex min-w-0 items-center gap-2.5">
                {(() => {
                  const currentOption = getCurrentModelOption();
                  const Icon = currentOption.icon;
                  return (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="size-3.5" />
                    </span>
                  );
                })()}
                <span className="truncate text-sm font-medium">
                  {getCurrentModelOption().label}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="w-[min(32rem,calc(100vw-2rem))]">
              {isLoading && !isInitialLoad && (
                <SelectGroup>
                  <SelectLabel>{t("modelPicker.loadingModels")}</SelectLabel>
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">
                          {t("modelPicker.refreshing")}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {t("modelPicker.checking")}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectGroup>
              )}

              <SelectGroup>
                <SelectLabel>{t("modelPicker.cloudModels")}</SelectLabel>
                {isOpenAIModelsLoading ? (
                  <SelectItem value="openai-loading" disabled>
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">
                          {t("modelPicker.refreshing")}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {t("modelPicker.checking")}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ) : openAIModels.length > 0 ? (
                  openAIModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-3">
                        <Bot className="h-4 w-4 flex-shrink-0" />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm">{model.name}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {t("modelPicker.cloudDescription")}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="openai">
                    <div className="flex items-center gap-3">
                      <Bot className="h-4 w-4 flex-shrink-0" />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">
                          {t("modelPicker.openAICompatible")}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {t("modelPicker.cloudDescription")}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                )}
              </SelectGroup>

              {ollamaModels.length > 0 && (
                <SelectGroup>
                  <SelectLabel>
                    {t("modelPicker.localOllamaModels")}
                  </SelectLabel>
                  {ollamaModels.map((model) => {
                    const option = createModelOption(model);
                    const Icon = option.icon;

                    return (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm">
                              {option.displayLabel}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              )}

              {lmStudioModels.length > 0 && (
                <SelectGroup>
                  <SelectLabel>
                    {t("modelPicker.localLmStudioModels")}
                  </SelectLabel>
                  {lmStudioModels.map((model) => {
                    const option = createModelOption(model);
                    const Icon = option.icon;

                    return (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm">
                              {option.displayLabel}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              )}

              {lmStudioModels.length === 0 && (
                <SelectGroup>
                  <SelectLabel>{t("modelPicker.lmStudio")}</SelectLabel>
                  <SelectItem value="lmstudio-setup" disabled>
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 flex-shrink-0" />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">
                          {t("modelPicker.lmStudioSetupTitle")}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {t("modelPicker.lmStudioSetupDescription")}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectGroup>
              )}

              {showDownloadable && downloadableOllamaModels.length > 0 && (
                <SelectGroup>
                  <SelectLabel>
                    {t("modelPicker.downloadableOllamaModels")}
                  </SelectLabel>
                  {downloadableOllamaModels.map((model) => {
                    const option = createModelOption(model, true);
                    const Icon = option.icon;

                    return (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm">
                              {option.displayLabel}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
          {shouldShowManualOpenAIModelInput && (
            <Input
              aria-label={t("modelPicker.openAIModelId")}
              className="h-10 rounded-lg bg-background text-sm shadow-none"
              onBlur={handleOpenAIModelIdBlur}
              onChange={handleOpenAIModelIdChange}
              placeholder={DEFAULT_OPENAI_MODEL_ID}
              spellCheck={false}
              value={modelId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
