"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { CircleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type RootImage } from "../../../utils/parser";

interface ImageSlideStaticProps {
  image: RootImage;
  slideId: string;
}

export default function ImageSlideStatic({
  image,
  slideId,
}: ImageSlideStaticProps) {
  const { t } = useTranslation();
  const computedImageUrl = image.url;
  const rootImageGeneration = usePresentationState(
    (s) => s.rootImageGeneration,
  );
  const computedGen = rootImageGeneration[slideId];
  const isGenerating =
    computedGen?.status === "queued" || computedGen?.status === "generating";
  const generationError =
    computedGen?.status === "error" ? computedGen.error : undefined;

  return (
    <div
      className={cn(
        "flex aspect-video w-full items-center justify-center",
        "relative overflow-hidden",
      )}
      data-slide-id={slideId}
    >
      {isGenerating ? (
        <div className="absolute inset-0 z-10 flex h-full w-full flex-col items-center justify-center bg-muted/30 p-4">
          <Spinner className="mb-2 h-8 w-8" />
          <p className="text-sm text-muted-foreground">
            {t("presentationEditor.image.generating")}
          </p>
        </div>
      ) : computedImageUrl ? (
        // biome-ignore lint/performance/noImgElement: Valid use case for img element
        <img
          src={computedImageUrl}
          alt={image.query}
          className="h-full w-full"
          style={{
            objectFit: image.cropSettings?.objectFit ?? "cover",
            objectPosition: image.cropSettings?.objectPosition
              ? `${image.cropSettings.objectPosition.x}% ${image.cropSettings.objectPosition.y}%`
              : "center",
          }}
        />
      ) : generationError ? (
        <div className="absolute inset-0 z-10 flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/30 p-4 text-center">
          <CircleAlert className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium text-destructive">
            {t("presentationEditor.image.generationFailed")}
          </p>
          <p className="max-w-md break-words text-xs text-destructive">
            {generationError}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center text-muted-foreground">
          <span>{t("presentationEditor.image.noImage")}</span>
        </div>
      )}
    </div>
  );
}
