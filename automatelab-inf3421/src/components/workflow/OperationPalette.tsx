"use client";
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OPERATION_LIST, OperationCategory } from "@/core/operations";
import { OperationType } from "@/core/types";
import { OP_ICONS, CATEGORY_STYLE } from "./icons";

const CATEGORIES: OperationCategory[] = [
  "entrée",
  "analyse",
  "conversion",
  "regex",
  "clôture",
  "sortie",
];

export function OperationPalette({ onAdd }: { onAdd: (type: OperationType) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une opération…"
          className="pl-9"
        />
      </div>

      {CATEGORIES.map((cat) => {
        const ops = OPERATION_LIST.filter(
          (o) => o.category === cat && (!q || o.label.toLowerCase().includes(q)),
        );
        if (!ops.length) return null;
        return (
          <div key={cat} className="space-y-1.5">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-faint)]">
              {cat}
            </p>
            {ops.map((op) => {
              const Icon = OP_ICONS[op.icon] ?? OP_ICONS.Workflow;
              const style = CATEGORY_STYLE[op.category];
              return (
                <button
                  key={op.type}
                  onClick={() => onAdd(op.type)}
                  className="group flex w-full items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-left transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
                    style={{ backgroundColor: style.color }}
                  >
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--color-text)]">
                      {op.label}
                    </span>
                    <span className="block truncate text-[11px] text-[var(--color-faint)]">
                      {op.description}
                    </span>
                  </span>
                  <Plus size={14} className="shrink-0 text-[var(--color-faint)] group-hover:text-[var(--color-primary-hover)]" />
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
