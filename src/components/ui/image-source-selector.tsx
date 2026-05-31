"use client";

import { type ImageModelList } from "@/app/_actions/apps/image-studio/generate";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const IMAGE_MODELS: { value: ImageModelList; label: string }[] = [
  { value: "gpt-image2", label: "GPT Image 2" },
];

interface ImageSourceSelectorProps {
  imageSource: "automatic" | "ai" | "stock";
  imageModel: ImageModelList;
  stockImageProvider: "unsplash" | "pixabay";
  onImageSourceChange: (source: "automatic" | "ai" | "stock") => void;
  onImageModelChange: (model: ImageModelList) => void;
  onStockImageProviderChange: (provider: "unsplash" | "pixabay") => void;
  className?: string;
  showLabel?: boolean;
}

export function ImageSourceSelector({
  imageSource,
  imageModel,
  stockImageProvider,
  onImageSourceChange,
  onImageModelChange,
  onStockImageProviderChange,
  className,
  showLabel = true,
}: ImageSourceSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className={className}>
      {showLabel && (
        <Label className="mb-2 block text-sm font-medium">
          {t("presentationEditor.imageSource.label")}
        </Label>
      )}
      <Select
        value={
          imageSource === "ai"
            ? imageModel || "gpt-image2"
            : imageSource === "stock"
              ? `stock-${stockImageProvider}`
              : "automatic"
        }
        onValueChange={(value) => {
          if (value === "automatic") {
            onImageSourceChange("automatic");
          } else if (value.startsWith("stock-")) {
            // Handle stock image selection
            const provider = value.replace("stock-", "") as
              | "unsplash"
              | "pixabay";
            onImageSourceChange("stock");
            onStockImageProviderChange(provider);
          } else {
            // Handle AI model selection
            onImageSourceChange("ai");
            onImageModelChange(value as ImageModelList);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={t("presentationEditor.imageSource.placeholder")}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="automatic" className="font-medium">
              {t("presentationEditor.imageSource.automatic")}
            </SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel className="flex items-center gap-1 text-primary/80">
              <Wand2 size={10} />
              {t("presentationEditor.imageSource.aiGeneration")}
            </SelectLabel>
            {IMAGE_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel className="flex items-center gap-1 text-primary/80">
              <Image size={10} />
              {t("presentationEditor.imageSource.stockImages")}
            </SelectLabel>
            <SelectItem value="stock-unsplash">Unsplash</SelectItem>
            <SelectItem value="stock-pixabay">Pixabay</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
