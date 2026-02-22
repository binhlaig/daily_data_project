"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { InComeSchema, incomeValues } from "@/lib/zod-vaildations";
import { FaRegPlusSquare } from "react-icons/fa";
import DialogWrapper from "@/components/Form/DialogWrapper";
import { createIncomeAction } from "@/lib/actions/incomeAction";

type ActionState = { ok: boolean; message?: string };
const initialState: ActionState = { ok: false };

export function InAddForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [state, formAction] = useActionState(
    createIncomeAction as any,
    initialState
  );

  const form = useForm<incomeValues>({
    resolver: zodResolver(InComeSchema),
    defaultValues: {
      date: undefined,
      month: "",
      amount: "",
      compamy: "",
      notice: "",
    } as any,
  });

  // ✅ convert Date -> ISO string for server action
  const isoDate = useMemo(() => {
    const d = form.getValues("date") as any;
    if (!d) return "";
    return d instanceof Date ? d.toISOString() : String(d);
  }, [form.watch("date")]); // watch to recalc

  // ✅ success/error handling (server response)
  useEffect(() => {
    if (state?.ok) {
      toast.success("Created income successfully ✅");
      setIsLoading(false);
      form.reset({
        date: undefined,
        month: "",
        amount: "",
        compamy: "",
        notice: "",
      } as any);
      setOpen(false);
      router.refresh();
      return;
    }

    if (state?.ok === false && state?.message) {
      setIsLoading(false);
      toast.error(state.message);
    }
  }, [state, router, form]);

  return (
    <DialogWrapper
      isBtn={false}
      title="Add Income"
      icon={FaRegPlusSquare}
      open={open}
      setOpen={(v?: any) => setOpen(typeof v === "boolean" ? v : !open)}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-5 shadow-sm",
          "bg-white border-gray-200",
          "dark:bg-gray-900 dark:border-gray-800"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />

        <Form {...form}>
          {/* ✅ Server Action submit */}
          <form
            action={formAction}
            onSubmit={() => setIsLoading(true)}
            className="relative flex flex-col gap-6"
          >
            {/* ✅ Hidden inputs: server action only accepts plain values */}
            <input name="date" value={isoDate} hidden readOnly />
            <input name="month" value={(form.watch("month") as any) ?? ""} hidden readOnly />
            <input name="amount" value={(form.watch("amount") as any) ?? ""} hidden readOnly />
            <input name="compamy" value={(form.watch("compamy") as any) ?? ""} hidden readOnly />
            <input name="notice" value={(form.watch("notice") as any) ?? ""} hidden readOnly />

            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-wide text-gray-900 dark:text-gray-100">
                Create Income
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fill income info and save. Month auto-fills from date.
              </p>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* DATE */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs text-gray-600 dark:text-gray-300">
                      Income date
                    </FormLabel>

                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start pl-8 text-left font-normal",
                              "bg-white border-gray-200 hover:bg-gray-50",
                              "dark:bg-gray-950 dark:border-gray-800 dark:hover:bg-gray-900",
                              !field.value && "text-gray-400 dark:text-gray-500"
                            )}
                          >
                            {field.value ? format(field.value as any, "PPP") : <span>Select income date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-60 dark:opacity-80" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>

                      <PopoverContent
                        className={cn(
                          "w-auto p-0 rounded-2xl border",
                          "bg-white border-gray-200",
                          "dark:bg-gray-950 dark:border-gray-800"
                        )}
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value as any}
                          onSelect={(d) => {
                            if (!d) return;
                            field.onChange(d);
                            form.setValue("month", format(d, "yyyy-MM"), {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* MONTH */}
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-gray-600 dark:text-gray-300">
                      Month
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 2026-01"
                        {...field}
                        value={(field.value as any) ?? ""}
                        className={cn(
                          "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400",
                          "dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AMOUNT */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-gray-600 dark:text-gray-300">
                      Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="ငွေ ပမာဏကို ထည့်သွင်းပါ"
                        inputMode="numeric"
                        {...field}
                        value={(field.value as any) ?? ""}
                        className={cn(
                          "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400",
                          "dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* COMPANY */}
              <FormField
                control={form.control}
                name="compamy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-gray-600 dark:text-gray-300">
                      Company Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="e.g. ABC Co., Ltd"
                        {...field}
                        value={(field.value as any) ?? ""}
                        className={cn(
                          "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400",
                          "dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* NOTICE */}
            <FormField
              control={form.control}
              name="notice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-600 dark:text-gray-300">
                    မှတ်ချက်
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="လိုအပ်သော မှတ်ချက်များကို ရေးပါ၊"
                      {...field}
                      value={(field.value as any) ?? ""}
                      className={cn(
                        "min-h-[90px] bg-white border-gray-200 text-gray-900 placeholder:text-gray-400",
                        "dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "bg-white border-gray-200 text-gray-900 hover:bg-gray-50",
                  "dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100 dark:hover:bg-gray-900"
                )}
                onClick={() =>
                  form.reset({
                    date: undefined,
                    month: "",
                    amount: "",
                    compamy: "",
                    notice: "",
                  } as any)
                }
                disabled={isLoading}
              >
                Clear
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Income"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DialogWrapper>
  );
}
