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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, LogIn, Mail, User, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

type AuthMode = "signin" | "register";

const REGISTER_ERROR_TRANSLATION_KEYS: Record<string, string> = {
  EMAIL_EXISTS: "auth.emailAlreadyRegistered",
  INVALID_PAYLOAD: "auth.invalidRegistration",
  REGISTRATION_FAILED: "auth.registrationFailed",
};

export default function SignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const searchError = searchParams.get("error");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegistering = mode === "register";
  const error = formError ?? (searchError ? t("auth.error") : null);

  const handleSignIn = async (provider: string) => {
    await signIn(provider, { callbackUrl });
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (isRegistering && password !== confirmPassword) {
      setFormError(t("auth.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegistering) {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, password }),
        });

        if (!registerResponse.ok) {
          const data = (await registerResponse.json().catch(() => null)) as
            | { error?: string }
            | null;
          const translationKey = data?.error
            ? REGISTER_ERROR_TRANSLATION_KEYS[data.error]
            : undefined;

          setFormError(t(translationKey ?? "auth.registrationFailed"));
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setFormError(t("auth.invalidCredentials"));
        return;
      }

      router.push(getSafeRedirectUrl(result?.url ?? callbackUrl));
      router.refresh();
    } catch {
      setFormError(t("auth.error"));
    } finally {
      setIsSubmitting(false);
    }
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
          {error ? (
            <div
              className="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 rounded-md border bg-muted p-1">
            <Button
              type="button"
              variant={mode === "signin" ? "secondary" : "ghost"}
              className="h-9"
              onClick={() => {
                setMode("signin");
                setFormError(null);
              }}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {t("auth.signInTab")}
            </Button>
            <Button
              type="button"
              variant={mode === "register" ? "secondary" : "ghost"}
              className="h-9"
              onClick={() => {
                setMode("register");
                setFormError(null);
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t("auth.registerTab")}
            </Button>
          </div>

          <form className="grid gap-4" onSubmit={handleEmailSubmit}>
            {isRegistering ? (
              <div className="grid gap-2">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    className="pl-9"
                    placeholder={t("auth.namePlaceholder")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="pl-9"
                  placeholder={t("auth.emailPlaceholder")}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  className="pl-9"
                  minLength={isRegistering ? 8 : undefined}
                  maxLength={128}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {isRegistering ? (
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="pl-9"
                    minLength={8}
                    maxLength={128}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ) : null}

            <Button type="submit" disabled={isSubmitting}>
              {isRegistering ? (
                <UserPlus className="mr-2 h-4 w-4" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {isSubmitting
                ? t("auth.submitting")
                : t(isRegistering ? "auth.createAccount" : "auth.signInWithEmail")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t("auth.or")}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            disabled={isSubmitting}
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

function getSafeRedirectUrl(url: string): string {
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.origin === window.location.origin) {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {
    return "/";
  }

  return "/";
}
