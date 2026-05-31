"use client";

import {
  createBlankPresentation,
  duplicatePresentation,
} from "@/app/_actions/notebook/presentation/presentationActions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePresentationHistoryState } from "@/states/presentation-history-state";
import { usePresentationState } from "@/states/presentation-state";
import { useMutation } from "@tanstack/react-query";
import {
  Bot,
  Copy,
  FileEdit,
  FolderOpen,
  Palette,
  Plus,
  Redo,
  Settings,
  Undo,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function PresentationMenu({
  readOnly = false,
}: {
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const currentPresentationId = usePresentationState(
    (state) => state.currentPresentationId,
  );
  const setCurrentPresentation = usePresentationState(
    (state) => state.setCurrentPresentation,
  );
  const setActiveRightPanel = usePresentationState(
    (state) => state.setActiveRightPanel,
  );
  const undo = usePresentationHistoryState((state) => state.undo);
  const redo = usePresentationHistoryState((state) => state.redo);
  const canUndo = usePresentationHistoryState((state) => state.canUndo);
  const canRedo = usePresentationHistoryState((state) => state.canRedo);
  const router = useRouter();

  const { mutateAsync: duplicatePresentationMutation, isPending: isDuplicating } =
    useMutation({
      mutationFn: async () => {
        if (!currentPresentationId) {
          toast.error(t("menu.currentUnavailable"));
          throw new Error("CURRENT_PRESENTATION_ID_MISSING");
        }

        return duplicatePresentation(currentPresentationId);
      },
      onSuccess: (data) => {
        if (data.success && data.presentation) {
          setCurrentPresentation(data.presentation.id, data.presentation.title);
          router.push(`/presentation/${data.presentation.id}`);
          return;
        }

        toast.error(data.message);
      },
      onError: () => {
        toast.error(t("menu.duplicateFailed"));
      },
    });

  const {
    mutateAsync: createBlankPresentationMutation,
    isPending: isCreatingBlank,
  } = useMutation({
    mutationFn: async () => {
      const theme = usePresentationState.getState().theme;
      const language = usePresentationState.getState().language;

      return createBlankPresentation(
        t("menu.untitled"),
        theme ??
          (localStorage.getItem("theme") === "dark" ? "ebony" : "mystique"),
        language,
      );
    },
    onSuccess: (data) => {
      if (data.success && data.presentation) {
        setCurrentPresentation(data.presentation.id, data.presentation.title);
        router.push(`/presentation/${data.presentation.id}`);
        return;
      }

      toast.error(data.message ?? t("menu.createFailed"));
    },
    onError: () => {
      toast.error(t("menu.createFailed"));
    },
  });

  const focusTitleInput = useCallback(() => {
    window.setTimeout(() => {
      const presentationTitleInput = document.getElementById(
        "presentation-title-input",
      );
      presentationTitleInput?.focus();
    }, 250);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("menu.open")}>
          <FolderOpen className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuItem
          disabled={isCreatingBlank}
          onClick={() => void createBlankPresentationMutation()}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("menu.newPresentation")}
        </DropdownMenuItem>
        {!readOnly ? (
          <DropdownMenuItem onClick={focusTitleInput}>
            <FileEdit className="mr-2 h-4 w-4" />
            {t("menu.rename")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          disabled={isDuplicating}
          onClick={() => void duplicatePresentationMutation()}
        >
          <Copy className="mr-2 h-4 w-4" />
          {readOnly ? t("menu.cloneToAccount") : t("menu.duplicate")}
        </DropdownMenuItem>

        {!readOnly ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!canUndo} onClick={undo}>
              <Undo className="mr-2 h-4 w-4" />
              {t("menu.undo")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canRedo} onClick={redo}>
              <Redo className="mr-2 h-4 w-4" />
              {t("menu.redo")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActiveRightPanel("globalSettings")}>
              <Settings className="mr-2 h-4 w-4" />
              {t("menu.pageSetup")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveRightPanel("theme")}>
              <Palette className="mr-2 h-4 w-4" />
              {t("menu.themePanel")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveRightPanel("agent")}>
              <Bot className="mr-2 h-4 w-4" />
              {t("menu.agentPanel")}
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/presentation")}>
          <FolderOpen className="mr-2 h-4 w-4" />
          {t("menu.allPresentations")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
