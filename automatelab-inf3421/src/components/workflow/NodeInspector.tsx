"use client";
import { Trash2, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { useWorkflowStore } from "@/store/workflow-store";
import { OPERATIONS } from "@/core/operations";
import { AlgorithmResult } from "@/core/types";

export function NodeInspector({ onViewResult }: { onViewResult: (title: string, result: AlgorithmResult) => void }) {
  const { nodes, selectedNodeId, sourceRegex, removeNode, setNodeParams, setSource } =
    useWorkflowStore();
  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[var(--color-muted)]">
        Sélectionnez un nœud pour voir ses paramètres, son statut et son résultat.
      </div>
    );
  }

  const def = OPERATIONS[node.type];
  const result = node.data.result;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{node.data.label}</h3>
        <Badge
          variant={
            node.data.status === "success"
              ? "success"
              : node.data.status === "error"
              ? "danger"
              : node.data.status === "running"
              ? "primary"
              : "default"
          }
        >
          {node.data.status}
        </Badge>
      </div>
      <p className="text-xs text-[var(--color-muted)]">{def.description}</p>

      {/* Paramètres spécifiques */}
      {(node.type === "inputRegex" || node.type === "thompson" || node.type === "glushkov") && (
        <div>
          <Label>Expression régulière</Label>
          <Input
            value={sourceRegex ?? (node.data.params?.regex as string) ?? ""}
            onChange={(e) => {
              setSource(undefined, e.target.value);
              setNodeParams(node.id, { ...node.data.params, regex: e.target.value });
            }}
            placeholder="(a+b)*abb"
          />
        </div>
      )}

      {node.type === "inputAutomaton" && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-muted)]">
          Source : automate courant de l’Automate Studio. Modifiez-le dans l’onglet Automate Studio,
          il sera injecté ici à l’exécution.
        </div>
      )}

      {/* Erreur */}
      {node.data.error && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-3 text-xs text-[var(--color-danger)]">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {node.data.error}
        </div>
      )}

      {/* Résultat */}
      {result && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--color-text)]">Résultat</p>
          {typeof result.result === "string" ? (
            <p className="break-all rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 font-mono text-sm text-[var(--color-primary-hover)]">
              {result.result}
            </p>
          ) : (
            <p className="text-xs text-[var(--color-muted)]">
              {result.result.kind} · {result.result.states.length} états ·{" "}
              {result.result.transitions.length} transitions
            </p>
          )}
          <Button size="sm" variant="secondary" className="w-full" onClick={() => onViewResult(node.data.label, result)}>
            <Eye size={14} /> Voir le détail
          </Button>
        </div>
      )}

      <div className="mt-auto">
        <Button size="sm" variant="danger" className="w-full" onClick={() => removeNode(node.id)}>
          <Trash2 size={14} /> Supprimer le nœud
        </Button>
      </div>
    </div>
  );
}
