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

import { LoaderCircle, Upload } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof formSchema>;

export default function Sign_up() {

  const router = useRouter();

  const [isLoading,setIsLoading]=useState(false);
  const [image,setImage]=useState<File|null>(null);
  const [preview,setPreview]=useState<string>("");

  const form = useForm<FormValues>({
    resolver:zodResolver(formSchema),
    defaultValues:{name:"",email:"",password:""}
  });

  // 📸 IMAGE CHANGE
  const handleImage=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };


  async function onSubmit(values:FormValues){

    setIsLoading(true);

    try{

      let imagePath="";

      // 🔥 upload image first (optional)
      if(image){
        const fd=new FormData();
        fd.append("file",image);

        const res=await fetch("/api/upload",{
          method:"POST",
          body:fd
        });

        const data=await res.json();
        imagePath=data.url;   // <-- your API must return {url:"..."}
      }

      await authClient.signUp.email(
        {
          email:values.email,
          password:values.password,
          name:values.name,
          image:imagePath,   // 👈 send image to auth
          callbackURL:"/sign-in"
        },
        {
          onSuccess:()=>{
            router.push("/sign-in");
          }
        }
      );

    }catch(err){
      console.log(err);
    }

    setIsLoading(false);
  }

  return (

    <div className="flex justify-center items-center min-h-screen px-4">

      <Card className="w-full max-w-md">

        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>BIN HLAIG မှ ကြိုဆိုပါတယ်</CardDescription>
        </CardHeader>

        <CardContent>

          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* IMAGE */}
            <div className="flex flex-col items-center gap-3">

              <label className="cursor-pointer">

                {preview ?(
                  <img
                    src={preview}
                    className="w-24 h-24 rounded-full object-cover border"
                  />
                ):(
                  <div className="w-24 h-24 rounded-full border flex items-center justify-center text-muted-foreground">
                    <Upload/>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImage}
                />
              </label>

              <p className="text-xs text-muted-foreground">
                profile image upload
              </p>

            </div>

            {/* NAME */}
            <FormField
              control={form.control}
              name="name"
              render={({field})=>(
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field}/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />

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
                    <Input type="password" {...field}/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />

            <Button className="w-full" disabled={isLoading}>
              {isLoading ?(
                <>
                  <LoaderCircle className="animate-spin mr-2"/>
                  Creating...
                </>
              ):("Sign Up")}
            </Button>

            <p className="text-center text-sm">
              Already account?
              <Link href="/sign-in" className="text-primary ml-1">
                Sign In
              </Link>
            </p>

          </form>
          </Form>

        </CardContent>
      </Card>

    </div>
  );
}
