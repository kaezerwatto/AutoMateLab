"use client";
import { useEffect, useState } from "react";
import { Play, RotateCcw, Save, Loader2, Terminal, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="flex h-full min-h-[calc(100dvh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)]/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="-mx-3 w-[calc(100%+1.5rem)] overflow-x-auto px-3 pb-1 sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0 sm:pb-0">
            <div className="flex w-max items-center gap-2 sm:w-auto">
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
          </div>
          <Badge variant="cyan" className="max-w-full truncate sm:max-w-[18rem]">
            Source : {current.name}
          </Badge>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Palette */}
        <aside className="hidden w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]/40 md:block">
          <OperationPalette onAdd={(t) => addOperation(t)} />
        </aside>

        {/* Canvas */}
        <div className="relative min-h-[360px] min-w-0 flex-1 lg:min-h-0">
          <WorkflowCanvas className="absolute inset-0" />
        </div>

        <section className="h-[min(40dvh,24rem)] min-h-64 shrink-0 overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]/40 lg:hidden">
          <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
            <div className="border-b border-[var(--color-border)] p-3">
              <TabsList className="w-full">
                <TabsTrigger value="palette" className="flex-1 md:hidden">
                  Opérations
                </TabsTrigger>
                <TabsTrigger value="inspector" className="flex-1">
                  <SlidersHorizontal size={14} className="mr-1 inline" /> Inspecteur
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex-1">
                  <Terminal size={14} className="mr-1 inline" /> Logs
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="palette" className="min-h-0 flex-1 overflow-y-auto md:hidden">
              <OperationPalette onAdd={(t) => addOperation(t)} />
            </TabsContent>
            <TabsContent value="inspector" className="min-h-0 flex-1 overflow-y-auto">
              <NodeInspector onViewResult={(title, result) => setDialog({ title, result })} />
            </TabsContent>
            <TabsContent value="logs" className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs">
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
            </TabsContent>
          </Tabs>
        </section>

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
