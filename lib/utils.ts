import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BankList= [
  {
    value: "UFJ BANK",
    label: "UFJ",
  },
  {
    value:"SMBC Bank",
    label:"SMBC",
  },
  {
    value:"SMBC @2  Bank",
    label:"SMBC@2",
  },
  {
    value:"POST Bank",
    label: "JP POST",
  },
  {
    value: "SEVEN BANK",
    label: "SEVEN BANK",
  }
];


export const shopes = [
  {
      value: "seven eleven",
      label: "seven eleven",
  },
  {
      value: "Family mark",
      label: "Family mark",
  },
  {
      value: "Niku no",
      label: "Niku no",
  },
  {
      value: "JR Chart",
      label: "JR Chart",
  },
  {
      value: "tsuru ya",
      label: "tsuru ya",
  },
  {
    value: "lawson shop",
    label: "lawson shop",
},
{
  value: "Gyomiu shop",
  label: "Gyomiu shop",
},
{
  value: "AREON Super",
  label: "AREON Super",
},
{
  value: "Other",
  label: "Other",
},
]