import { z } from "zod";


const ImageSchema = z
  .custom<File | undefined>()
  .refine(
    (file) => !file || (file instanceof File && file.type.startsWith("image/")),
    "Only Images Allowed"
  )
  .refine((file) => {
    return !file || file.size < 1024 * 1024 * 2;
  }, "File must be less than 2MB");

export const menuAccountSchema = z.object({
  barcode: z.string(),
  productname: z.string(),
  description: z.string(),
  producttype: z.string(),
  price: z.string(),
  image: ImageSchema.optional(),
});

export type menuAccountValues = z.infer<typeof menuAccountSchema>;

export const InComeSchema = z.object({
  date: z.date({
    error: "A date of birth is required.",
  }),
  month: z.string(),
  amount: z.string(),
  compamy: z.string(),
  notice: z.string(),
});
export type incomeValues = z.infer<typeof InComeSchema>;

//Outcome
export const OutSchema = z.object({
  date: z.date({
    error: "A date of birth is required.",
  }),
  month: z.string(),
  amount: z.string(),
  shop: z.string(),
  bank: z.string(),
  notice: z.string(),
});
export type outcomeValues = z.infer<typeof OutSchema>;

export const MenuSchema = z.object({
  tablename: z.string(),
  image: ImageSchema.optional()
});
export type menuValues = z.infer<typeof MenuSchema>;