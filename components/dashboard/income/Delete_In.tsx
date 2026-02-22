"use client";

import DialogWrapper from "@/components/Form/DialogWrapper";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import React, { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { MdDeleteSweep } from "react-icons/md";
import { useRouter } from "next/navigation";
import { deleteIncomeAction } from "@/lib/actions/incomeAction";

const Delete_In = ({ id }: { id: string }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = async () => {
    try {
      setLoading(true);

      startTransition(async () => {
        try {
          await deleteIncomeAction(id);

          toast.success("Income deleted ✅");
          setOpen(false);

          // ✅ refresh server component page (NO reload)
          router.refresh();
        } catch (err: any) {
          console.log(err);
          toast.error(err?.message ?? "Delete failed");
        } finally {
          setLoading(false);
        }
      });
    } catch (err: any) {
      console.log(err);
      toast.error(err?.message ?? "Something wrong!");
      setLoading(false);
    }
  };

  return (
    <DialogWrapper
      isBtn={false}
      title="Delete Income"
      icon={MdDeleteSweep}
      open={open}
      setOpen={(v?: any) => setOpen(typeof v === "boolean" ? v : !open)}
    >
      {/* ⭐ LIGHT + DARK PERFECT BALANCE */}
      <div
        className="
        relative overflow-hidden rounded-2xl
        bg-white/95
        dark:bg-gradient-to-br dark:from-emerald-900/20 dark:via-background dark:to-muted/20
        p-6 shadow-xl
        ring-1 ring-black/5
        dark:ring-white/5
      "
      >
        {/* glow ONLY dark mode */}
        <div className="pointer-events-none hidden dark:block absolute -top-24 -right-24 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none hidden dark:block absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-emerald-300/10 blur-3xl" />

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
          <div
            className="
              rounded-xl
              bg-gray-100
              dark:bg-muted/40
              px-4 py-3 text-sm
            "
          >
            This ID{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {id}
            </span>{" "}
            will be permanently deleted.
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="
                bg-white hover:bg-gray-100
                dark:bg-muted/30 dark:hover:bg-muted/50
                border
              "
              onClick={() => setOpen(false)}
              disabled={loading || isPending}
            >
              Cancel
            </Button>

            <Button
              onClick={onDelete}
              disabled={loading || isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading || isPending ? (
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
};

export default Delete_In;
