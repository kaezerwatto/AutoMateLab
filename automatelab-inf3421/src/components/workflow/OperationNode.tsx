"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeStatus, OperationType } from "@/core/types";
import { OPERATIONS } from "@/core/operations";
import { OP_ICONS, CATEGORY_STYLE } from "./icons";

export interface OperationNodeData {
  type: OperationType;
  label: string;
  status: NodeStatus;
  [key: string]: unknown;
}

const STATUS_RING: Record<NodeStatus, string> = {
  idle: "border-[var(--color-border)]",
  running: "border-[var(--color-primary)] running-pulse",
  success: "border-[var(--color-success)]",
  error: "border-[var(--color-danger)]",
};

export function OperationNode({ data, selected }: NodeProps) {
  const d = data as OperationNodeData;
  const def = OPERATIONS[d.type];
  const Icon = OP_ICONS[def.icon] ?? OP_ICONS.Workflow;
  const cat = CATEGORY_STYLE[def.category];
  const isSource = def.minInputs === 0;

  return (
    <div
      className={cn(
        "flex w-56 items-stretch overflow-hidden rounded-[10px] border bg-[var(--color-surface-2)] shadow-[0_4px_16px_-8px_rgba(0,0,0,0.6)] transition-all",
        STATUS_RING[d.status],
        selected && "ring-2 ring-[var(--color-primary)]/70",
      )}
    >
      {!isSource && <Handle type="target" position={Position.Left} />}
      {d.type !== "export" && <Handle type="source" position={Position.Right} />}

      {/* Tuile d'icône colorée façon n8n */}
      <div
        className="flex w-12 shrink-0 items-center justify-center text-white"
        style={{ backgroundColor: cat.color }}
      >
        <Icon size={19} />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-[var(--color-text)]">
            {d.label}
          </p>
          <p className="text-[11px] capitalize text-[var(--color-faint)]">{def.category}</p>
        </div>
        <StatusIcon status={d.status} />
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: NodeStatus }) {
  if (status === "running")
    return <Loader2 size={16} className="animate-spin text-[var(--color-primary-hover)]" />;
  if (status === "success")
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-success)]/20 text-[var(--color-success)]">
        <Check size={12} />
      </span>
    );
  if (status === "error")
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-danger)]/20 text-[var(--color-danger)]">
        <X size={12} />
      </span>
    );
  return <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-faint)]" />;
}
