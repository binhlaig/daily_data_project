
"use client";

import React, {
  Suspense,
  useState,
} from "react";

import Link from "next/link";
import {
  useSearchParams,
  useRouter,
} from "next/navigation";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";

// Password validation
const schema = z.object({
  newPassword: z
    .string()
    .min(8, "Password အနည်းဆုံး 8 လုံး"),
});

type V = z.infer<typeof schema>;

// Loading fallback for Suspense
function ResetPasswordLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center gap-2 py-10">
          <LoaderCircle
            size={20}
            className="animate-spin text-primary"
          />
          <span className="text-sm text-muted-foreground">
            Loading reset password...
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

// Reset password form
function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token") || "";
  const resetError = params.get("error");

  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: "",
    },
  });

  async function onSubmit(values: V) {
    if (!token || loading || done) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.newPassword,
        token,
      });

      if (error) {
        setErrorMsg(
          error.message ?? "Password ပြောင်းမရပါ"
        );
        return;
      }

      setDone(true);

      setTimeout(() => {
        router.push("/sign-in");
      }, 800);
    } catch (error) {
      console.error("[RESET_PASSWORD]", error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Password ပြောင်းရာတွင် Error ဖြစ်နေပါသည်"
      );
    } finally {
      setLoading(false);
    }
  }

  // Invalid or expired reset token
  if (resetError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid token</CardTitle>

            <CardDescription>
              Reset link မမှန်ကန်ခြင်း သို့မဟုတ်
              သက်တမ်းကုန်ဆုံးခြင်း ဖြစ်နိုင်ပါတယ်။
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              Request new reset link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Missing reset token
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Missing token</CardTitle>

            <CardDescription>
              Password Reset Link မှတစ်ဆင့်
              ဝင်ရောက်ရပါမယ်။
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              Go to forgot password
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            Reset password
          </CardTitle>

          <CardDescription>
            Password အသစ် သတ်မှတ်ပါ။
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {done && (
            <div
              role="status"
              className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
            >
              Password ပြောင်းပြီးပါပြီ ✅
              Redirecting...
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {errorMsg}
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      New password
                    </FormLabel>

                    <FormControl>
                      <div className="relative">
                        <Input
                          type={
                            show
                              ? "text"
                              : "password"
                          }
                          autoComplete="new-password"
                          placeholder="Enter new password"
                          disabled={loading || done}
                          className="pr-10"
                          {...field}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShow((prev) => !prev)
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
                          disabled={loading || done}
                          aria-label={
                            show
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {show ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading || done}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle
                      className="animate-spin"
                      size={18}
                    />
                    Updating...
                  </span>
                ) : done ? (
                  "Password updated"
                ) : (
                  "Reset password"
                )}
              </Button>

              <p className="text-center text-sm">
                <Link
                  href="/sign-in"
                  className="text-primary hover:underline"
                >
                  Back to sign in
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Page entry with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
