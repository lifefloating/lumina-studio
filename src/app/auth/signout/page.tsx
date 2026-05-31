"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function SignOut() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const handleSignOut = async () => {
    await signOut({ callbackUrl });
  };

  const handleCancel = () => {
    router.push(callbackUrl);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t("auth.signOutTitle")}
          </CardTitle>
          <CardDescription>{t("auth.signOutConfirm")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col space-y-4">
            <Button onClick={handleSignOut}>
              {t("auth.signOutWithProvider")}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              {t("auth.cancelSignOut")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
