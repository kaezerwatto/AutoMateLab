"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { TraceStep } from "@/core/types";
import { DataTable } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export function TracePanel({ steps }: { steps: TraceStep[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!steps.length) {
    return <p className="text-sm text-[var(--color-muted)]">Aucune trace disponible.</p>;
  }
  return (
    <ol className="relative space-y-2 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-[var(--color-border)]">
      {steps.map((step, i) => {
        const isOpen = open === i;
        const hasDetails = Boolean(step.table?.length || step.description);
        return (
          <li key={i} className="relative pl-10">
            <span className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] text-xs font-semibold text-[var(--color-primary-hover)]">
              {i + 1}
            </span>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <span className="text-sm font-medium text-[var(--color-text)]">{step.title}</span>
              {hasDetails && (
                <ChevronDown
                  size={16}
                  className={cn("shrink-0 text-[var(--color-muted)] transition-transform", isOpen && "rotate-180")}
                />
              )}
            </button>
            {isOpen && hasDetails && (
              <div className="fade-up mt-2 space-y-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-bg)]/40 p-3">
                {step.description && (
                  <p className="text-sm leading-relaxed text-[var(--color-muted)]">{step.description}</p>
                )}
                {step.table && step.table.length > 0 && <DataTable rows={step.table} />}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
