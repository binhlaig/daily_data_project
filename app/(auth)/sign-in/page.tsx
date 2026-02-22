"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

import { Eye, EyeOff, LoaderCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email မှားနေပါတယ်"),
  password: z.string().min(6, "Password အနည်းဆုံး 6 လုံး"),
});

type FormValues = z.infer<typeof schema>;

export default function SignInPage() {

  const router = useRouter();

  const [loading,setLoading]=useState(false);
  const [showPass,setShowPass]=useState(false);
  const [errorMsg,setErrorMsg]=useState("");

  const form = useForm<FormValues>({
    resolver:zodResolver(schema),
    defaultValues:{email:"",password:""}
  });

  async function onSubmit(values:FormValues){

    setLoading(true);
    setErrorMsg("");

    try{

      await authClient.signIn.email(
        {
          email:values.email,
          password:values.password,
          callbackURL:"/",   // login success redirect
        },
        {
          onSuccess:()=>{
            router.push("/");
          },
          onError:(ctx)=>{
            setErrorMsg(ctx.error.message || "Login မအောင်မြင်ပါ");
          }
        }
      );

    }catch(err){
      setErrorMsg("Server error ဖြစ်နေပါတယ်");
    }

    setLoading(false);
  }

  return (

    <div className="flex justify-center items-center min-h-screen px-4">

      <Card className="w-full max-w-md">

        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>BIN HLAIG မှ ပြန်လည်ကြိုဆိုပါတယ်</CardDescription>
        </CardHeader>

        <CardContent>

          {errorMsg && (
            <div className="mb-4 p-2 text-sm border rounded bg-red-50 text-red-600">
              {errorMsg}
            </div>
          )}

          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* EMAIL */}
            <FormField
              control={form.control}
              name="email"
              render={({field})=>(
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field}/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />

            {/* PASSWORD */}
            <FormField
              control={form.control}
              name="password"
              render={({field})=>(
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">

                      <Input
                        type={showPass ? "text":"password"}
                        {...field}
                      />

                      <button
                        type="button"
                        onClick={()=>setShowPass(v=>!v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>

                    </div>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />

            <Button className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle className="animate-spin mr-2"/>
                  Signing in...
                </>
              ):("Sign In")}
            </Button>

            <p className="text-center text-sm">
              Account မရှိသေးဘူးလား?
              <Link href="/Sign_up" className="text-primary ml-1">
                Sign Up
              </Link>
            </p>

          </form>
          </Form>

        </CardContent>

      </Card>

    </div>
  );
}



