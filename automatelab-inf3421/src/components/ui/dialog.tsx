"use client";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:p-4 md:p-8">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "fade-up relative z-10 my-0 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl",
          className,
        )}
      >
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-4 sm:p-5">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-[var(--color-muted)]">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-elevated)] hover:text-[var(--color-text)]"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
