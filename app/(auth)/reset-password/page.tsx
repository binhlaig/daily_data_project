"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

const schema = z.object({
  newPassword: z.string().min(8, "Password အနည်းဆုံး 8 လုံး"),
});

type V = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => params.get("token") || "", [params]);
  const error = params.get("error");

  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "" },
  });

  async function onSubmit(values: V) {
    setLoading(true);
    setErrorMsg("");

    const { error } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token, // docs: token required :contentReference[oaicite:8]{index=8}
    });

    if (error) setErrorMsg(error.message ?? "Password ပြောင်းမရပါ");
    else {
      setDone(true);
      setTimeout(() => router.push("/sign-in"), 800);
    }

    setLoading(false);
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid token</CardTitle>
            <CardDescription>Reset link မမှန်/Expire ဖြစ်နိုင်ပါတယ်</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password" className="text-primary hover:underline">
              Request new reset link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Missing token</CardTitle>
            <CardDescription>Reset link ကနေဝင်လာရပါမယ်</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password" className="text-primary hover:underline">
              Go to forgot password
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Password အသစ်သတ်မှတ်ပါ</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {done ? (
            <div className="rounded-md border px-3 py-2 text-sm">
              Password ပြောင်းပြီးပါပြီ ✅ Redirecting...
            </div>
          ) : null}

          {errorMsg ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMsg}
            </div>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={show ? "text" : "password"} disabled={loading} {...field} />
                        <button
                          type="button"
                          onClick={() => setShow((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                          disabled={loading}
                        >
                          {show ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" disabled={loading}>
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="animate-spin" size={18} />
                    Updating...
                  </span>
                ) : (
                  "Reset password"
                )}
              </Button>

              <p className="text-center text-sm">
                <Link href="/sign-in" className="text-primary hover:underline">
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
