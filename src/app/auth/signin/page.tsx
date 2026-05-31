"use client";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FaGoogle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function SignIn() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const error = searchParams.get("error");

  const handleSignIn = async (provider: string) => {
    await signIn(provider, { callbackUrl });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t("auth.welcome")}</CardTitle>
          <CardDescription>{t("auth.subtitle")}</CardDescription>
          {error && (
            <div
              className="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
              role="alert"
            >
              <span className="block sm:inline">{t("auth.error")}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            onClick={() => handleSignIn("google")}
          >
            <FaGoogle className="h-4 w-4" />
            {t("auth.signInWithGoogle")}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("auth.agreement")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
