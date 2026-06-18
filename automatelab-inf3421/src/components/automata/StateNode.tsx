"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export interface StateNodeData {
  label: string;
  initial?: boolean;
  final?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  sink?: boolean;
  [key: string]: unknown;
}

export function StateNode({ data, selected }: NodeProps) {
  const d = data as StateNodeData;
  return (
    <div className="relative flex items-center justify-center">
      {/* flèche d'entrée pour l'état initial */}
      {d.initial && (
        <div className="absolute -left-7 top-1/2 -translate-y-1/2">
          <svg width="26" height="16" viewBox="0 0 26 16">
            <line x1="0" y1="8" x2="20" y2="8" stroke="#ff6d5a" strokeWidth="2.5" />
            <path d="M20 3 L26 8 L20 13 Z" fill="#ff6d5a" />
          </svg>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="source" position={Position.Right} className="!opacity-0" />

      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
          "bg-[var(--color-surface-2)]",
          d.sink
            ? "border-[var(--color-danger)] text-[var(--color-danger)]"
            : d.highlighted
            ? "border-[var(--color-success)] text-[var(--color-success)]"
            : "border-[var(--color-border)] text-[var(--color-text)]",
          selected && "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg)]",
          d.dimmed && "opacity-40",
        )}
      >
        {/* double cercle pour les états finaux */}
        {d.final && (
          <span
            className={cn(
              "absolute inset-1 rounded-full border-2",
              d.highlighted ? "border-[var(--color-success)]" : "border-[var(--color-border)]",
            )}
          />
        )}
        <span className="px-1 text-center leading-none">{d.label}</span>
      </div>
    </div>
  );
}
