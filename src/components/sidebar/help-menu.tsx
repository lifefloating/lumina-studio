"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { ExternalLink, Keyboard } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface HelpMenuProps {
  hideKeyboardShortcutsOnMobile?: boolean;
}

export function HelpMenu({
  hideKeyboardShortcutsOnMobile = false,
}: HelpMenuProps = {}) {
  const { t } = useTranslation();
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const isMobile = useIsMobile();
  const shouldShowKeyboardShortcuts =
    !hideKeyboardShortcutsOnMobile || !isMobile;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-full bg-transparent text-sm"
          >
            ?<span className="sr-only">{t("help.openHelpMenu")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {shouldShowKeyboardShortcuts ? (
            <DropdownMenuItem onClick={() => setKeyboardShortcutsOpen(true)}>
              <Keyboard className="mr-3 h-5 w-5" />
              <span>{t("help.keyboardShortcuts")}</span>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem asChild>
            <a
              href="https://github.com/lifefloating/lumina-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="mr-3 h-5 w-5" />
              <span>{t("help.visitSite")}</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="px-2 py-2 text-xs text-muted-foreground">
            {t("help.brand")}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {shouldShowKeyboardShortcuts ? (
        <Dialog
          open={keyboardShortcutsOpen}
          onOpenChange={setKeyboardShortcutsOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("help.title")}</DialogTitle>
              <DialogDescription>{t("help.description")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("help.openHelpMenu")}</span>
                <kbd className="rounded bg-muted px-2 py-1.5 text-xs font-semibold">
                  ?
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("help.search")}</span>
                <kbd className="rounded bg-muted px-2 py-1.5 text-xs font-semibold">
                  Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("help.save")}</span>
                <kbd className="rounded bg-muted px-2 py-1.5 text-xs font-semibold">
                  Ctrl + S
                </kbd>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
