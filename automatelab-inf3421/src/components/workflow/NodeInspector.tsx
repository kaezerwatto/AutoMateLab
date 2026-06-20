"use client";
import { useRef, useState } from "react";
import { Trash2, Eye, AlertCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useWorkflowStore } from "@/store/workflow-store";
import { OPERATIONS } from "@/core/operations";
import { AlgorithmResult, Automaton } from "@/core/types";
import { parseAutomatonJson } from "@/core/validators";

export function NodeInspector({ onViewResult }: { onViewResult: (title: string, result: AlgorithmResult) => void }) {
  const { nodes, selectedNodeId, sourceRegex, removeNode, setNodeParams, setSource } =
    useWorkflowStore();
  const node = nodes.find((n) => n.id === selectedNodeId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[var(--color-muted)]">
        Sélectionnez un nœud pour voir ses paramètres, son statut et son résultat.
      </div>
    );
  }

  const def = OPERATIONS[node.type];
  const result = node.data.result;
  const automatonSource = (node.data.params?.automaton as Automaton | undefined);
  const jsonSource = (node.data.params?.automatonJson as string | undefined) ?? "";

  const setAutomatonJson = (json: string) => {
    const params = { ...node.data.params, automatonJson: json };
    if (!json.trim()) {
      setInputError(null);
      setNodeParams(node.id, { ...params, automaton: undefined });
      return;
    }
    try {
      const automaton = parseAutomatonJson(json);
      setNodeParams(node.id, { ...params, automaton });
      setInputError(null);
    } catch (error) {
      // Le texte reste visible afin que l'utilisateur puisse corriger le JSON;
      // l'automate précédemment valide n'est pas réutilisé silencieusement.
      setNodeParams(node.id, { ...params, automaton: undefined });
      setInputError((error as Error).message);
    }
  };

  const importJson = async (file: File) => {
    try {
      setAutomatonJson(await file.text());
    } catch {
      setInputError("Impossible de lire le fichier JSON.");
    }
  };

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
            value={(node.data.params?.regex as string) ?? sourceRegex ?? ""}
            onChange={(e) => {
              setSource(undefined, e.target.value);
              setNodeParams(node.id, { ...node.data.params, regex: e.target.value });
            }}
            placeholder="(a+b)*abb"
          />
          <p className="mt-1.5 text-[11px] text-[var(--color-faint)]">
            Type attendu : chaîne d&apos;expression régulière.
          </p>
        </div>
      )}

      {node.type === "inputAutomaton" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-muted)]">
            {jsonSource.trim()
              ? automatonSource
                ? `Source JSON : ${automatonSource.name} · ${automatonSource.kind} · ${automatonSource.states.length} états.`
                : "Source JSON invalide : corrigez-le avant de lancer le workflow."
              : "Source : automate courant de l’Automate Studio. Il est injecté au lancement du workflow."}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Label className="mb-0">Automate JSON (optionnel)</Label>
              <Button size="sm" variant="ghost" type="button" onClick={() => fileRef.current?.click()}>
                <Upload size={13} /> Importer
              </Button>
            </div>
            <Textarea
              value={jsonSource}
              onChange={(e) => setAutomatonJson(e.target.value)}
              placeholder={'{"id":"a1","name":"Mon automate","kind":"NFA",...}'}
              className="min-h-32 text-xs"
              spellCheck={false}
            />
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importJson(file);
                e.currentTarget.value = "";
              }}
            />
            <p className="mt-1.5 text-[11px] text-[var(--color-faint)]">
              Type attendu : automate JSON valide. Un JSON valide remplace l&apos;automate courant pour ce nœud uniquement.
            </p>
            {inputError && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{inputError}</p>}
          </div>
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
