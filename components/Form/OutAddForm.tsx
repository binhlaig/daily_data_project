



// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { format } from "date-fns";
// import { CalendarIcon, LoaderCircle } from "lucide-react";
// import { useForm } from "react-hook-form";
// import { useEffect, useMemo, useState } from "react";
// import toast from "react-hot-toast";
// import { useRouter } from "next/navigation";
// import { useActionState } from "react";

// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";

// import DialogWrapper from "@/components/Form/DialogWrapper"; // ✅ your fixed wrapper
// import { FaRegPlusSquare } from "react-icons/fa";

// import { outcomeValues, OutSchema } from "@/lib/zod-vaildations";
// import { BankList, shopes } from "@/lib/utils";
// import { createOutcomeAction } from "@/lib/actions/outcomeActions";
// import { ComboboxDemo } from "./ComboBox";

// type ActionState = { ok: boolean; message?: string };
// const initialState: ActionState = { ok: false };

// export function OutAddForm() {
//   const router = useRouter();

//   const [open, setOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const [state, formAction] = useActionState(
//     createOutcomeAction as any,
//     initialState
//   );

//   const form = useForm<outcomeValues>({
//     resolver: zodResolver(OutSchema),
//     defaultValues: {
//       date: undefined,
//       month: "",
//       amount: "",
//       bank: "",
//       shop: "",
//       notice: "",
//     },
//   });

//   // ✅ when server action returns
//   useEffect(() => {
//     if (state?.ok) {
//       setIsLoading(false);
//       toast.success("Created outcome successfully ✅");

//       form.reset({
//         date: undefined,
//         month: "",
//         amount: "",
//         bank: "",
//         shop: "",
//         notice: "",
//       });

//       setOpen(false);
//       router.refresh();
//       return;
//     }

//     if (state?.ok === false && state?.message) {
//       setIsLoading(false);
//       toast.error(state.message);
//     }
//   }, [state, router, form]);

//   // ✅ IMPORTANT: Server Action needs plain values (strings)
//   // We'll submit hidden inputs for bank/shop/date/month/amount/notice.
//   const bankValue = form.watch("bank");
//   const shopValue = form.watch("shop");
//   const dateValue = form.watch("date");
//   const monthValue = form.watch("month");
//   const amountValue = form.watch("amount");
//   const noticeValue = form.watch("notice");

//   const isoDate = useMemo(() => {
//     if (!dateValue) return "";
//     return dateValue instanceof Date ? dateValue.toISOString() : String(dateValue);
//   }, [dateValue]);

//   return (
//     <DialogWrapper
//       isBtn={false}
//       title="Add Outcome"
//       icon={FaRegPlusSquare}
//       open={open}
//       setOpen={setOpen} // ✅ type-safe
//     >
//       {/* ✅ Light: white | Dark: deep panel (same) */}
//       <div
//         className={cn(
//           "relative overflow-hidden rounded-2xl border p-5 shadow-sm",
//           "bg-white border-gray-200",
//           "dark:bg-gray-900 dark:border-gray-800"
//         )}
//       >
//         <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent" />

//         <Form {...form}>
//           {/* ✅ Server Action submit */}
//           <form
//             action={formAction}
//             onSubmit={() => setIsLoading(true)}
//             className="relative flex flex-col gap-6"
//           >
//             {/* ✅ Hidden inputs to send values to Server Action */}
//             <input name="amount" value={amountValue ?? ""} hidden readOnly />
//             <input name="shop" value={shopValue ?? ""} hidden readOnly />
//             <input name="bank" value={bankValue ?? ""} hidden readOnly />
//             <input name="date" value={isoDate} hidden readOnly />
//             <input name="month" value={monthValue ?? ""} hidden readOnly />
//             <input name="notice" value={noticeValue ?? ""} hidden readOnly />

//             {/* Header */}
//             <div className="space-y-1">
//               <h1 className="text-lg font-semibold tracking-wide text-gray-900 dark:text-gray-100">
//                 Create Outcome
//               </h1>
//               <p className="text-xs text-gray-500 dark:text-gray-400">
//                 Fill outcome info and save. Month auto-fills from date.
//               </p>
//             </div>

//             {/* Fields UI (same) */}
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//               {/* DATE */}
//               <FormField
//                 control={form.control}
//                 name="date"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel className="text-xs text-gray-600 dark:text-gray-300">
//                       Out-Come date
//                     </FormLabel>

//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <FormControl>
//                           <Button
//                             type="button"
//                             variant="outline"
//                             className={cn(
//                               "w-full justify-start pl-8 text-left font-normal",
//                               "bg-white border-gray-200 hover:bg-gray-50",
//                               "dark:bg-gray-950 dark:border-gray-800 dark:hover:bg-gray-900",
//                               !field.value && "text-gray-400 dark:text-gray-500"
//                             )}
//                             aria-label="Pick date"
//                           >
//                             {field.value ? (
//                               format(field.value as any, "PPP")
//                             ) : (
//                               <span>Select outcome date</span>
//                             )}
//                             <CalendarIcon className="ml-auto h-4 w-4 opacity-60 dark:opacity-80" />
//                           </Button>
//                         </FormControl>
//                       </PopoverTrigger>

//                       <PopoverContent
//                         className={cn(
//                           "w-auto p-0 rounded-2xl border",
//                           "bg-white border-gray-200",
//                           "dark:bg-gray-950 dark:border-gray-800"
//                         )}
//                         align="start"
//                       >
//                         <Calendar
//                           mode="single"
//                           selected={field.value as any}
//                           onSelect={(d) => {
//                             if (!d) return;
//                             field.onChange(d);
//                             form.setValue("month", format(d, "yyyy-MM"), {
//                               shouldValidate: true,
//                               shouldDirty: true,
//                             });
//                           }}
//                           initialFocus
//                         />
//                       </PopoverContent>
//                     </Popover>

//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* MONTH */}
//               <FormField
//                 control={form.control}
//                 name="month"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className="text-xs text-gray-600 dark:text-gray-300">
//                       Month
//                     </FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder="e.g. 2026-01"
//                         {...field}
//                         className={cn(
//                           "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400",
//                           "dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
//                         )}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* AMOUNT */}
//               <FormField
//                 control={form.control}
//                 name="amount"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className="text-xs text-gray-600 dark:text-gray-300">
//                       Amount
//                     </FormLabel>
//                     <FormControl>
//                       <Input
//                         type="text"
//                         placeholder="ငွေ ပမာဏကို ထည့်သွင်းပါ"
//                         inputMode="numeric"
//                         {...field}
//                         className={cn(
//                           "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400",
//                           "dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
//                         )}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* BANK */}
//               <FormField
//                 control={form.control}
//                 name="bank"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel className="text-xs text-gray-600 dark:text-gray-300">
//                       Bank <span className="text-rose-600 dark:text-rose-400">*</span>
//                     </FormLabel>
//                     <FormControl>
//                       <ComboboxDemo
//                         options={BankList}
//                         value={field.value}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* SHOP */}
//               <FormField
//                 control={form.control}
//                 name="shop"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel className="text-xs text-gray-600 dark:text-gray-300">
//                       Shop <span className="text-rose-600 dark:text-rose-400">*</span>
//                     </FormLabel>
//                     <FormControl>
//                       <ComboboxDemo
//                         options={shopes}
//                         value={field.value}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             {/* NOTICE */}
//             <FormField
//               control={form.control}
//               name="notice"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel className="text-xs text-gray-600 dark:text-gray-300">
//                     မှတ်ချက်
//                   </FormLabel>
//                   <FormControl>
//                     <Textarea
//                       placeholder="လိုအပ်သော မှတ်ချက်များကို ရေးပါ၊"
//                       {...field}
//                       className={cn(
//                         "min-h-[90px] bg-white border-gray-200 text-gray-900 placeholder:text-gray-400",
//                         "dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
//                       )}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Inline error (optional) */}
//             {state?.ok === false && state?.message && (
//               <div className="text-sm text-rose-600">{state.message}</div>
//             )}

//             {/* Actions */}
//             <div className="flex items-center justify-end gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 className={cn(
//                   "bg-white border-gray-200 text-gray-900 hover:bg-gray-50",
//                   "dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100 dark:hover:bg-gray-900"
//                 )}
//                 onClick={() =>
//                   form.reset({
//                     date: undefined,
//                     month: "",
//                     amount: "",
//                     bank: "",
//                     shop: "",
//                     notice: "",
//                   })
//                 }
//                 disabled={isLoading}
//               >
//                 Clear
//               </Button>

//               <Button
//                 type="submit"
//                 disabled={isLoading}
//                 className="gap-2 bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-500 dark:hover:bg-rose-600"
//               >
//                 {isLoading ? (
//                   <>
//                     <LoaderCircle size={18} className="animate-spin" />
//                     Saving...
//                   </>
//                 ) : (
//                   "Add Outcome"
//                 )}
//               </Button>
//             </div>
//           </form>
//         </Form>
//       </div>
//     </DialogWrapper>
//   );
// }





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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import DialogWrapper from "@/components/Form/DialogWrapper";
import { FaRegPlusSquare } from "react-icons/fa";

import { outcomeValues, OutSchema } from "@/lib/zod-vaildations";
import { BankList, shopes } from "@/lib/utils";
import { createOutcomeAction } from "@/lib/actions/outcomeActions";
import { ComboboxDemo } from "./ComboBox";

type ActionState = { ok: boolean; message?: string };
const initialState: ActionState = { ok: false };

export function OutAddForm() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [state, formAction] = useActionState(
    createOutcomeAction as any,
    initialState
  );

  const form = useForm<outcomeValues>({
    resolver: zodResolver(OutSchema),
    defaultValues: {
      date: undefined,
      month: "",
      amount: "",
      bank: "",
      shop: "",
      notice: "",
    },
  });

  const dateValue = form.watch("date");
  const isoDate = useMemo(() => {
    if (!dateValue) return "";
    return dateValue instanceof Date ? dateValue.toISOString() : String(dateValue);
  }, [dateValue]);

  // ✅ server action result
  useEffect(() => {
    if (state?.ok) {
      setIsLoading(false);
      toast.success("Created outcome successfully ✅");
      form.reset();
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
      title="Add Outcome"
      icon={FaRegPlusSquare}
      open={open}
      setOpen={setOpen}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-5 shadow-xl",
          "bg-white/95 border-gray-200 ring-1 ring-black/5",
          "dark:border-border/60 dark:bg-gradient-to-br dark:from-rose-900/20 dark:via-background dark:to-muted/20 dark:ring-white/10"
        )}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-52 w-52 rounded-full bg-rose-500/20 blur-3xl hidden dark:block" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-rose-400/10 blur-3xl hidden dark:block" />

        <Form {...form}>
          <form
            action={formAction}
            onSubmit={() => setIsLoading(true)}
            className="relative flex flex-col gap-6"
          >
            {/* ✅ Hidden inputs for server action */}
            <input name="amount" value={form.watch("amount") ?? ""} hidden readOnly />
            <input name="shop" value={form.watch("shop") ?? ""} hidden readOnly />
            <input name="bank" value={form.watch("bank") ?? ""} hidden readOnly />
            <input name="date" value={isoDate} hidden readOnly />
            <input name="month" value={form.watch("month") ?? ""} hidden readOnly />
            <input name="notice" value={form.watch("notice") ?? ""} hidden readOnly />

            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-wide text-gray-900 dark:text-gray-100">
                Create Outcome
              </h1>
              <p className="text-xs text-muted-foreground">
                Glass + Gradient theme (unified)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* DATE */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs">Out-Come date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start pl-8 text-left font-normal",
                              "bg-white/70 hover:bg-white",
                              "dark:bg-background/40 dark:hover:bg-background/60",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value as any, "PPP") : <span>Select outcome date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-60" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
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
                    <FormLabel className="text-xs">Month</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. 2026-01" className="bg-white/70 dark:bg-background/40" />
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
                    <FormLabel className="text-xs">Amount</FormLabel>
                    <FormControl>
                      <Input {...field} inputMode="numeric" placeholder="ငွေ ပမာဏကို ထည့်သွင်းပါ" className="bg-white/70 dark:bg-background/40" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* BANK */}
              <FormField
                control={form.control}
                name="bank"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs">
                      Bank <span className="text-rose-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <ComboboxDemo options={BankList} value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SHOP */}
              <FormField
                control={form.control}
                name="shop"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs">
                      Shop <span className="text-rose-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <ComboboxDemo options={shopes} value={field.value} onChange={field.onChange} />
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
                  <FormLabel className="text-xs">မှတ်ချက်</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="လိုအပ်သော မှတ်ချက်များကို ရေးပါ၊" className="min-h-[90px] bg-white/70 dark:bg-background/40" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" className="bg-white/70 dark:bg-background/30" onClick={() => form.reset()} disabled={isLoading}>
                Clear
              </Button>

              <Button type="submit" disabled={isLoading} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white">
                {isLoading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Outcome"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DialogWrapper>
  );
}
