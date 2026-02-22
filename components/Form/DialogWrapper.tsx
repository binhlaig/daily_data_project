// import { Button } from "@/components/ui/button";
// import { IconType } from "react-icons";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { ReactNode } from "react";
// import { ScrollArea } from "../ui/scroll-area";

// type DialogProps = {
//   children: ReactNode;
//   btnTitle?: string;
//   title?: string;
//   descr?: string;
//   isBtn: boolean;
//   icon?: IconType;

//   // ✅ controlled dialog support
//   open?: boolean;
//   setOpen?: (open: boolean) => void; // ✅ IMPORTANT
// };

// const DialogWrapper = ({
//   children,
//   btnTitle,
//   title,
//   descr,
//   icon: Icon,
//   isBtn,
//   open,
//   setOpen,
// }: DialogProps) => {
//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         {isBtn ? (
//           <Button>{btnTitle}</Button>
//         ) : (
//           Icon && (
//             <Button variant="ghost" type="button">
//               <Icon size={20} />
//             </Button>
//           )
//         )}
//       </DialogTrigger>

//       <DialogContent className="sm:max-w-[425px]">
//         <ScrollArea className="max-h-[80vh]">
//           <DialogHeader>
//             {/* ✅ light mode မှာလည်း မြင်အောင် */}
//             <DialogTitle>{title}</DialogTitle>
//             <DialogDescription>{descr}</DialogDescription>
//           </DialogHeader>
//           {children}
//         </ScrollArea>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default DialogWrapper;




// import { Button } from "@/components/ui/button";
// import { IconType } from "react-icons";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { ReactNode } from "react";
// import { ScrollArea } from "../ui/scroll-area";

// type DialogProps = {
//   children: ReactNode;
//   btnTitle?: string;
//   title?: string;
//   descr?: string;
//   isBtn: boolean;
//   icon?: IconType;
//   open?: boolean;
//   setOpen?: () => void;
// };

// const DialogWrapper = ({
//   children,
//   btnTitle,
//   title,
//   descr,
//   icon: Icon,
//   isBtn,
//   open,
//   setOpen,
// }: DialogProps) => {
//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         {isBtn ? (
//           <Button> {btnTitle}</Button>
//         ) : (
//           Icon && (
//             <Button variant="ghost">
//               <Icon size={20} />
//             </Button>
//           )
//         )}
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[700px]">
//         <ScrollArea className="max-h-[80vh]">
//           <DialogHeader>
//             <DialogTitle> {title}</DialogTitle>
//             <DialogDescription>{descr}</DialogDescription>
//           </DialogHeader>
//           {children}
//         </ScrollArea>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default DialogWrapper;


"use client";

import { Button } from "@/components/ui/button";
import { IconType } from "react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DialogProps = {
  children: ReactNode;
  btnTitle?: string;
  title?: string;
  descr?: string;
  isBtn: boolean;
  icon?: IconType;
  open?: boolean;
  setOpen?: (open: boolean) => void;
};

const DialogWrapper = ({
  children,
  btnTitle,
  title,
  descr,
  icon: Icon,
  isBtn,
  open,
  setOpen,
}: DialogProps) => {
  // ✅ allow controlled/uncontrolled usage
  const dialogProps =
    typeof open === "boolean" && typeof setOpen === "function"
      ? { open, onOpenChange: setOpen }
      : {};

  return (
    <Dialog {...dialogProps}>
      <DialogTrigger asChild>
        {isBtn ? (
          <Button>{btnTitle}</Button>
        ) : (
          Icon && (
            <Button variant="ghost" type="button">
              <Icon size={20} />
            </Button>
          )
        )}
      </DialogTrigger>

      <DialogContent
        className={cn(
          "sm:max-w-[700px] p-0 overflow-hidden",
          // ✅ panel bg for light/dark
          "bg-white dark:bg-gray-900",
          "border border-gray-200 dark:border-gray-800",
          "shadow-xl"
        )}
      >
        {(title || descr) && (
          <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            {title && (
              <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {Icon && <Icon size={18} className="text-rose-600 dark:text-rose-400" />}
                {title}
              </DialogTitle>
            )}
            {descr && (
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                {descr}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        {/* ✅ scroll always works */}
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5 text-gray-900 dark:text-gray-100">
          {children}
        </div>
      </DialogContent>

      {/* ✅ Overlay: light/dark + blur */}
      <style jsx global>{`
        [data-state="open"][data-radix-dialog-overlay] {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(10px);
        }
        .dark [data-state="open"][data-radix-dialog-overlay] {
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(10px);
        }
      `}</style>
    </Dialog>
  );
};

export default DialogWrapper;
