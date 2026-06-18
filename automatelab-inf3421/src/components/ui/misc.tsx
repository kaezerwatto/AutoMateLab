import * as React from "react";
import { cn } from "@/lib/utils";
import { TraceRow } from "@/core/types";

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-[var(--color-border)]", className)} />;
}

/** Tableau stylé pour les traces pédagogiques. */
export function DataTable({ rows }: { rows: TraceRow[] }) {
  if (!rows || rows.length === 0) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--color-elevated)]">
            {cols.map((c) => (
              <th
                key={c}
                className="px-3 py-2 text-left font-semibold text-[var(--color-muted)] whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[var(--color-border-soft)] hover:bg-[var(--color-surface-2)]/50">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 font-mono text-[var(--color-text)] whitespace-nowrap">
                  {String(row[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center">
      {icon && <div className="text-[var(--color-faint)]">{icon}</div>}
      <div>
        <p className="font-medium text-[var(--color-text)]">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-faint)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
