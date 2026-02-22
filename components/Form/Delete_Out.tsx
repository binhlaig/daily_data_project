// "use client";

// import React, { useState, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { Trash2, LoaderCircle } from "lucide-react";
// import { deleteOutcomeAction } from "@/lib/actions/outcomeActions";

// import { Button } from "@/components/ui/button";
// // သင် toast သုံးနေတယ်ဆို (sonner/react-hot-toast) အကြိုက်ရွေး:
// // import { toast } from "sonner";

// export default function Delete_Out({ id }: { id: string }) {
//   const router = useRouter();
//   const [open, setOpen] = useState(false); // (optional) သင် dialog သုံးချင်ရင်
//   const [isPending, startTransition] = useTransition();
//   const [loading, setLoading] = useState(false);

//   const onDelete = async () => {
//     const ok = confirm("Delete this outcome?");
//     if (!ok) return;

//     setLoading(true);

//     startTransition(async () => {
//       try {
//         await deleteOutcomeAction(id);

//         // ✅ auto refresh server page (NO reload)
//         router.refresh();

//         // toast.success("Deleted");
//       } catch (e) {
//         console.error(e);
//         // toast.error("Delete failed");
//         alert("Delete failed");
//       } finally {
//         setLoading(false);
//       }
//     });
//   };

//   return (
//     <Button
//       variant="ghost"
//       onClick={onDelete}
//       disabled={loading || isPending}
//       className="h-8 px-2 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
//     >
//       {loading || isPending ? (
//         <LoaderCircle className="h-4 w-4 animate-spin" />
//       ) : (
//         <Trash2 className="h-4 w-4" />
//       )}
//     </Button>
//   );
// }


"use client";

import React, { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";
import { MdDeleteSweep } from "react-icons/md";
import { useRouter } from "next/navigation";

import DialogWrapper from "@/components/Form/DialogWrapper";
import { Button } from "@/components/ui/button";
import { deleteOutcomeAction } from "@/lib/actions/outcomeActions";

export default function Delete_Out({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onDelete = async () => {
    startTransition(async () => {
      try {
        const res = await deleteOutcomeAction(id);

        if (!res?.ok) throw new Error("Delete failed");

        toast.success("Out Data deleted ✅");

        setOpen(false);
        router.refresh(); // ✅ refresh server page table
      } catch (err: any) {
        console.log(err);
        toast.error(err?.message ?? "Something wrong!");
      }
    });
  };

  return (
    <DialogWrapper
      isBtn={false}
      title="Delete Outcome"
      icon={MdDeleteSweep}
      open={open}
      setOpen={setOpen} // ✅ important (DialogWrapper must accept (open:boolean)=>void)
    >
      {/* ⭐ LIGHT MODE CLEAN + DARK MODE ROSE GLASS */}
      <div
        className="relative overflow-hidden rounded-2xl
        bg-white/95
        dark:bg-gradient-to-br dark:from-rose-900/20 dark:via-background dark:to-muted/20
        p-6 shadow-xl
        ring-1 ring-black/5
        dark:ring-white/5"
      >
        {/* glow ONLY dark mode */}
        <div className="pointer-events-none hidden dark:block absolute -top-24 -right-24 h-52 w-52 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="pointer-events-none hidden dark:block absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-rose-400/10 blur-3xl" />

        <div className="relative space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Are you absolutely sure?
            </h3>

            <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
              This action cannot be undone.
            </p>
          </div>

          {/* ID BOX */}
          <div className="rounded-xl bg-gray-100 dark:bg-muted/40 px-4 py-3 text-sm">
            This ID{" "}
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {id}
            </span>{" "}
            will be permanently deleted.
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="bg-white hover:bg-gray-100 dark:bg-muted/30 dark:hover:bg-muted/50 border"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button
              onClick={onDelete}
              disabled={isPending}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isPending ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </div>
    </DialogWrapper>
  );
}
