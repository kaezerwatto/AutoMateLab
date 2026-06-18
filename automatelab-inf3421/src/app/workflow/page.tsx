"use client";
import { useEffect, useState } from "react";
import { Play, RotateCcw, Save, Loader2, Terminal, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { OperationPalette } from "@/components/workflow/OperationPalette";
import { NodeInspector } from "@/components/workflow/NodeInspector";
import { ResultView } from "@/components/algorithms/ResultView";
import { useWorkflowStore } from "@/store/workflow-store";
import { useAutomatonStore } from "@/store/automaton-store";
import { persistence } from "@/lib/persistence";
import { AlgorithmResult } from "@/core/types";

export default function WorkflowPage() {
  const { addOperation, runWorkflow, reset, running, log, setSource, nodes, edges } =
    useWorkflowStore();
  const current = useAutomatonStore((s) => s.current);
  const applyResult = useAutomatonStore((s) => s.applyResult);

  const [tab, setTab] = useState("inspector");
  const [dialog, setDialog] = useState<{ title: string; result: AlgorithmResult } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSource(current, undefined);
  }, [current, setSource]);

  const handleRun = async () => {
    setSource(current, undefined);
    setTab("logs");
    await runWorkflow();
  };

  const handleSave = async () => {
    const project = (await persistence.listProjects())[0] ?? (await persistence.createProject("Projet AutoMateLab"));
    await persistence.saveWorkflow(project.id, {
      id: "wf",
      name: "Workflow AutoMateLab",
      nodes,
      edges,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/50 p-3">
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleRun} disabled={running}>
            {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {running ? "Exécution…" : "Lancer le workflow"}
          </Button>
          <Button variant="secondary" size="sm" onClick={reset}>
            <RotateCcw size={15} /> Réinitialiser
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSave}>
            <Save size={15} /> {saved ? "Enregistré" : "Enregistrer"}
          </Button>
        </div>
        <Badge variant="cyan">Source : {current.name}</Badge>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Palette */}
        <aside className="hidden w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]/40 md:block">
          <OperationPalette onAdd={(t) => addOperation(t)} />
        </aside>

        {/* Canvas */}
        <div className="min-w-0 flex-1">
          <WorkflowCanvas />
        </div>

        {/* Inspecteur + logs */}
        <aside className="hidden w-80 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)]/40 lg:flex lg:flex-col">
          <div className="border-b border-[var(--color-border)] p-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="inspector" className="flex-1">
                  <SlidersHorizontal size={14} className="mr-1 inline" /> Inspecteur
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex-1">
                  <Terminal size={14} className="mr-1 inline" /> Logs
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="min-h-0 flex-1">
            {tab === "inspector" ? (
              <NodeInspector onViewResult={(title, result) => setDialog({ title, result })} />
            ) : (
              <div className="h-full overflow-y-auto p-3 font-mono text-xs">
                {log.length === 0 ? (
                  <p className="text-[var(--color-muted)]">Lancez le workflow pour voir les logs.</p>
                ) : (
                  <ul className="space-y-1">
                    {log.map((l, i) => (
                      <li
                        key={i}
                        className={
                          l.startsWith("OK")
                            ? "text-[var(--color-success)]"
                            : l.startsWith("ERREUR")
                            ? "text-[var(--color-danger)]"
                            : "text-[var(--color-muted)]"
                        }
                      >
                        {l}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <Dialog
        open={Boolean(dialog)}
        onClose={() => setDialog(null)}
        title={dialog?.title}
        description="Résultat du nœud."
      >
        {dialog && (
          <ResultView
            title={dialog.title}
            result={dialog.result}
            onApply={(a) => {
              applyResult(dialog.title, { ...dialog.result, result: a });
              setDialog(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
