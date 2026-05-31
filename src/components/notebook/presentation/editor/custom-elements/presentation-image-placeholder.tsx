"use client";

import type React from "react";
import { useRef } from "react";

import { useUploadFile } from "@/components/plate/hooks/use-upload-file";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import {
  type ImageEditorMode,
  usePresentationState,
} from "@/states/presentation-state";
import {
  CircleAlert,
  ImageIcon,
  Loader2,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { type TImageElement } from "platejs";
import { useEditorReadOnly, useEditorRef } from "platejs/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export interface PresentationImagePlaceholderProps {
  className?: string;
  element: TImageElement & { query?: string; id?: string };
  error?: string | null;
  onOpenEditor?: (mode: ImageEditorMode) => void;
}

export function PresentationImagePlaceholder({
  className,
  element,
  error,
  onOpenEditor,
}: PresentationImagePlaceholderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editor = useEditorRef();
  const readOnly = useEditorReadOnly();
  const openPresentationImageEditor = usePresentationState(
    (s) => s.openPresentationImageEditor,
  );

  const { uploadFile, isUploading, progress } = useUploadFile({
    onUploadComplete: (file) => {
      // Update the element's URL in the editor
      editor.tf.setNodes(
        {
          url: file.ufsUrl,
        } as Partial<TImageElement>,
        { at: [], match: (n) => n === element },
      );
    },
    onUploadError: (error) => {
      toast.error("Failed to upload image");
      console.error(error);
    },
  });
  const uploadProgress = Math.trunc(progress);

  const handleUploadClick = () => {
    if (!readOnly && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && !readOnly) {
      void uploadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenEditor = (mode: ImageEditorMode) => {
    if (readOnly) return;
    if (onOpenEditor) {
      onOpenEditor(mode);
    } else if (element.id) {
      // Create a bound updateElement function that captures the current editor and element
      const boundUpdateElement = (props: Record<string, unknown>) => {
        editor.tf.setNodes(props as Partial<TImageElement>, {
          at: [],
          match: (n) => n.id === element.id,
        });
      };
      // Open the presentation image editor panel with the element ID, slide ID, and bound function
      openPresentationImageEditor(mode, boundUpdateElement);
    }
  };

  if (readOnly) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center bg-muted/30 p-8",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageIcon className="h-8 w-8" />
          <span className="text-sm">
            {t("presentationEditor.image.noImage")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-[inherit] border bg-background",
        className,
      )}
    >
      <Empty className="w-full bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {error ? <CircleAlert /> : <ImageIcon />}
          </EmptyMedia>
          <EmptyTitle className={cn("text-primary", error && "text-destructive")}>
            {error
              ? t("presentationEditor.image.generationFailed")
              : t("presentationEditor.image.noImageYet")}
          </EmptyTitle>
          <EmptyDescription>
            {t("presentationEditor.image.uploadOrGenerate")}
          </EmptyDescription>
          {error && (
            <EmptyDescription className="max-w-sm break-words text-destructive">
              {error}
            </EmptyDescription>
          )}
        </EmptyHeader>

        <EmptyContent className="flex-row gap-3 text-primary">
          <Button
            variant="outline"
            onClick={handleUploadClick}
            className="gap-2"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="size-4" />
                {t("presentationEditor.image.upload")}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleOpenEditor("generate")}
            className="gap-2"
          >
            <Sparkles className="size-4" />
            {t("presentationEditor.image.aiImage")}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleOpenEditor("search")}
            className="gap-2"
          >
            <Search className="size-4" />
            {t("presentationEditor.image.search")}
          </Button>
        </EmptyContent>
      </Empty>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
