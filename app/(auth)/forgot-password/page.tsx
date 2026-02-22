"use client";

import React, { useState } from "react";
import Link from "next/link";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoaderCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email မှားနေပါတယ်"),
});

type V = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: V) {
    setLoading(true);
    setErrorMsg("");
    setDone(false);

    const redirectTo = `${window.location.origin}/reset-password`; // docs: redirectTo :contentReference[oaicite:7]{index=7}

    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo,
    });

    if (error) setErrorMsg(error.message ?? "Reset link ပို့မရပါ");
    else setDone(true);

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Reset link ကို Email ထဲ ပို့ပေးပါမယ်</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {done ? (
            <div className="rounded-md border px-3 py-2 text-sm">
              အကောင့်ရှိရင် reset link ကို email ထဲပို့ပြီးပါပြီ ✅
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" disabled={loading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" disabled={loading}>
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="animate-spin" size={18} />
                    Sending...
                  </span>
                ) : (
                  "Send reset link"
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
