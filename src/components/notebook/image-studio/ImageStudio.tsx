"use client";

import { generateImageAction } from "@/app/_actions/apps/image-studio/generate";
import {
  MAX_REFERENCE_IMAGES,
  type GptImageOutputFormat,
  type GptImageQuality,
  type GptImageSize,
  type ReferenceImage,
} from "@/app/_actions/apps/image-studio/shared";
import {
  fetchGeneratedImages,
  type Image as GeneratedImageRow,
} from "@/app/_actions/apps/image-studio/fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  ImageIcon,
  ImagePlus,
  Loader2,
  RectangleHorizontal,
  RectangleVertical,
  Sliders,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type Shape = "square" | "landscape" | "portrait";
type ResolutionTier = "standard" | "4k";

// shape + tier -> concrete API size. 4K sizes require relay/upstream support.
const SIZE_MATRIX: Record<Shape, Record<ResolutionTier, GptImageSize>> = {
  square: { standard: "1024x1024", "4k": "2048x2048" },
  landscape: { standard: "1536x1024", "4k": "3072x2048" },
  portrait: { standard: "1024x1536", "4k": "2048x3072" },
};

const ACCEPTED_REFERENCE_TYPES = ["image/png", "image/jpeg", "image/webp"];

// Browser-native base64 encoding (avoids pulling the Node Buffer polyfill into
// the client bundle). Chunked to stay under the argument-count limit of
// String.fromCharCode for large images.
function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

type SegmentOption<T extends string> = {
  value: T;
  label: string;
  subLabel?: string;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
};

type GeneratedPreview = {
  id: string;
  url: string;
  prompt: string;
};

type LocalReference = ReferenceImage & {
  /** Object URL for the thumbnail preview; revoked on removal. */
  previewUrl: string;
};

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1.5 rounded-lg border border-border/70 bg-muted/20 p-1"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            title={option.hint}
            className={`flex h-auto flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
              selected
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {Icon ? <Icon className="size-4 shrink-0" /> : null}
              <span className="truncate">{option.label}</span>
            </span>
            {option.subLabel ? (
              <span className="text-[10px] font-normal text-muted-foreground">
                {option.subLabel}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function ImageStudio() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [prompt, setPrompt] = useState("");
  const [shape, setShape] = useState<Shape>("square");
  const [tier, setTier] = useState<ResolutionTier>("standard");
  const [quality, setQuality] = useState<GptImageQuality>("medium");
  const [outputFormat, setOutputFormat] = useState<GptImageOutputFormat>("png");
  const [references, setReferences] = useState<LocalReference[]>([]);
  const [preview, setPreview] = useState<GeneratedPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mirror references in a ref so the unmount-only cleanup can revoke whatever
  // object URLs are live without re-subscribing on every reference change.
  const referencesRef = useRef(references);
  referencesRef.current = references;
  useEffect(() => {
    return () => {
      for (const reference of referencesRef.current) {
        URL.revokeObjectURL(reference.previewUrl);
      }
    };
  }, []);

  const size = SIZE_MATRIX[shape][tier];

  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ["generated-images"],
    queryFn: fetchGeneratedImages,
  });

  const { mutate: generate, isPending } = useMutation({
    mutationFn: async (trimmedPrompt: string) => {
      const referenceImages: ReferenceImage[] = references.map(
        ({ data, contentType, name }) => ({ data, contentType, name }),
      );
      const result = await generateImageAction(trimmedPrompt, "gpt-image2", {
        size,
        quality,
        outputFormat,
        referenceImages,
      });

      const image = "image" in result ? result.image : undefined;
      if (!result.success || !image) {
        const error = "error" in result ? result.error : undefined;
        throw new Error(error ?? t("imageStudio.toastFailed"));
      }

      return image;
    },
    onSuccess: (image) => {
      setPreview({ id: image.id, url: image.url, prompt: image.prompt });
      void queryClient.invalidateQueries({ queryKey: ["generated-images"] });
      toast.success(t("imageStudio.toastSuccess"));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("imageStudio.toastFailed"),
      );
    },
  });

  const shapeOptions: SegmentOption<Shape>[] = [
    {
      value: "square",
      label: t("imageStudio.sizeSquare"),
      subLabel: SIZE_MATRIX.square[tier],
      icon: Square,
    },
    {
      value: "landscape",
      label: t("imageStudio.sizeLandscape"),
      subLabel: SIZE_MATRIX.landscape[tier],
      icon: RectangleHorizontal,
    },
    {
      value: "portrait",
      label: t("imageStudio.sizePortrait"),
      subLabel: SIZE_MATRIX.portrait[tier],
      icon: RectangleVertical,
    },
  ];

  const tierOptions: SegmentOption<ResolutionTier>[] = [
    { value: "standard", label: t("imageStudio.resolutionStandard") },
    {
      value: "4k",
      label: t("imageStudio.resolution4k"),
      subLabel: t("imageStudio.apiRequired"),
      hint: t("imageStudio.apiRequired"),
    },
  ];

  const qualityOptions: SegmentOption<GptImageQuality>[] = [
    { value: "low", label: t("imageStudio.qualityLow") },
    { value: "medium", label: t("imageStudio.qualityMedium") },
    { value: "high", label: t("imageStudio.qualityHigh") },
  ];

  const formatOptions: SegmentOption<GptImageOutputFormat>[] = [
    { value: "png", label: "PNG" },
    { value: "jpeg", label: "JPEG" },
    { value: "webp", label: "WebP" },
  ];

  const trimmedPrompt = prompt.trim();
  const canGenerate = trimmedPrompt.length > 0 && !isPending;

  const handleGenerate = () => {
    if (!trimmedPrompt) {
      toast.error(t("imageStudio.promptRequired"));
      return;
    }
    generate(trimmedPrompt);
  };

  const handleDownload = async () => {
    if (!preview) {
      return;
    }
    try {
      const response = await fetch(preview.url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      const extension = blob.type.split("/")[1]?.split(";")[0] ?? "png";
      link.download = `${preview.id}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fall back to opening the image in a new tab if the blob fetch fails.
      window.open(preview.url, "_blank", "noopener,noreferrer");
    }
  };

  const selectHistoryImage = (image: GeneratedImageRow) => {
    setPreview({ id: image.id, url: image.url, prompt: image.prompt });
  };

  const handleReferenceChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const files = Array.from(input.files ?? []);
    // Reset the input so selecting the same file again re-triggers change.
    input.value = "";
    if (files.length === 0) {
      return;
    }

    const remaining = MAX_REFERENCE_IMAGES - references.length;
    if (remaining <= 0) {
      toast.error(
        t("imageStudio.referenceLimit", { count: MAX_REFERENCE_IMAGES }),
      );
      return;
    }

    const accepted = files.filter((file) =>
      ACCEPTED_REFERENCE_TYPES.includes(file.type),
    );
    if (accepted.length < files.length) {
      toast.error(t("imageStudio.toastReferenceType"));
    }
    if (accepted.length > remaining) {
      toast.error(
        t("imageStudio.referenceLimit", { count: MAX_REFERENCE_IMAGES }),
      );
    }

    const selected = accepted.slice(0, remaining);
    const next = await Promise.all(
      selected.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const data = arrayBufferToBase64(buffer);
        return {
          data,
          contentType: file.type,
          name: file.name,
          previewUrl: URL.createObjectURL(file),
        } satisfies LocalReference;
      }),
    );

    setReferences((current) => [...current, ...next].slice(0, MAX_REFERENCE_IMAGES));
  };

  const removeReference = (index: number) => {
    setReferences((current) => {
      const target = current[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((_, i) => i !== index);
    });
  };

  const clearPrompt = () => setPrompt("");

  const canAddReference = references.length < MAX_REFERENCE_IMAGES;

  return (
    <div className="flex w-full flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
        {/* LEFT: settings */}
        <Card className="border-border/60 bg-background shadow-xs">
          <CardHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sliders className="size-5 text-primary" />
              {t("imageStudio.settingsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="image-studio-prompt"
                  className="text-xs font-medium text-muted-foreground"
                >
                  {t("imageStudio.promptLabel")}
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearPrompt}
                  disabled={isPending || prompt.length === 0}
                  className="h-7 px-2 text-xs text-muted-foreground"
                >
                  {t("imageStudio.clear")}
                </Button>
              </div>
              <Textarea
                id="image-studio-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={t("imageStudio.promptPlaceholder")}
                disabled={isPending}
                className="min-h-40 resize-none rounded-lg border-border/70 bg-muted/20 px-4 py-3 text-base shadow-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("imageStudio.referenceImages")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {references.length}/{MAX_REFERENCE_IMAGES}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {references.map((reference, index) => (
                  <div
                    key={reference.previewUrl}
                    className="relative size-16 overflow-hidden rounded-lg border border-border/70 bg-muted/20"
                  >
                    <Image
                      src={reference.previewUrl}
                      alt={reference.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removeReference(index)}
                      aria-label={t("imageStudio.referenceRemove")}
                      className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-background/80 text-foreground shadow-xs transition-colors hover:bg-background"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                {canAddReference ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                    aria-label={t("imageStudio.referenceImages")}
                    className="flex size-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/70 text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    <ImagePlus className="size-5" />
                  </button>
                ) : null}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {t("imageStudio.referenceHint", { count: MAX_REFERENCE_IMAGES })}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_REFERENCE_TYPES.join(",")}
                multiple
                hidden
                onChange={(event) => void handleReferenceChange(event)}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {t("imageStudio.size")}
              </span>
              <SegmentedControl
                label={t("imageStudio.size")}
                value={shape}
                onChange={setShape}
                options={shapeOptions}
                disabled={isPending}
              />
              <SegmentedControl
                label={t("imageStudio.resolution4k")}
                value={tier}
                onChange={setTier}
                options={tierOptions}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {t("imageStudio.quality")}
              </span>
              <SegmentedControl
                label={t("imageStudio.quality")}
                value={quality}
                onChange={setQuality}
                options={qualityOptions}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {t("imageStudio.format")}
              </span>
              <SegmentedControl
                label={t("imageStudio.format")}
                value={outputFormat}
                onChange={setOutputFormat}
                options={formatOptions}
                disabled={isPending}
              />
            </div>

            <div className="border-t border-border/60 pt-5">
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="h-10 w-full"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isPending
                  ? t("imageStudio.generating")
                  : t("imageStudio.generate")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: result + history */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="border-border/60 bg-background shadow-xs">
            <CardHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="size-5 text-primary" />
                {t("imageStudio.resultTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="relative mx-auto flex aspect-square w-full max-w-xl items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-muted/20">
                {preview ? (
                  <Image
                    src={preview.url}
                    alt={preview.prompt || t("imageStudio.resultTitle")}
                    fill
                    sizes="(max-width: 1024px) 100vw, 576px"
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 px-6 text-center text-sm text-muted-foreground">
                    <ImageIcon className="size-10 opacity-40" />
                    <span>{t("imageStudio.emptyPreview")}</span>
                  </div>
                )}
              </div>

              {preview ? (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleDownload()}
                    className="h-10 px-4"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("imageStudio.download")}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-background shadow-xs">
            <CardHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="size-5 text-primary" />
                {t("imageStudio.historyTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              {isHistoryLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  {t("imageStudio.emptyHistory")}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {history.map((image) => {
                    const active = preview?.id === image.id;
                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => selectHistoryImage(image)}
                        aria-label={image.prompt || t("imageStudio.historyTitle")}
                        aria-pressed={active}
                        className={`relative size-24 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                          active
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border/70 hover:border-primary/60"
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt={image.prompt || t("imageStudio.historyTitle")}
                          fill
                          sizes="96px"
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
