/**
 * Store Zustand du Workflow Studio (canvas type n8n).
 */
import { create } from "zustand";
import {
  AlgorithmResult,
  Automaton,
  NodeStatus,
  OperationType,
  WorkflowEdge,
  WorkflowNode,
} from "@/core/types";
import { OPERATIONS, runWorkflowGraph } from "@/core/operations";
import { uid } from "@/core/graph-utils";

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId?: string;
  running: boolean;
  log: string[];
  /** Automate source injecté dans les nœuds inputAutomaton. */
  sourceAutomaton?: Automaton;
  sourceRegex?: string;

  setSource: (automaton?: Automaton, regex?: string) => void;
  addOperation: (type: OperationType, x?: number, y?: number) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  setNodeParams: (id: string, params: Record<string, unknown>) => void;
  connect: (source: string, target: string) => void;
  disconnect: (edgeId: string) => void;
  select: (id?: string) => void;
  setStatus: (id: string, status: NodeStatus) => void;
  runWorkflow: () => Promise<void>;
  reset: () => void;
  loadGraph: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
}

function defaultGraph(): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const mk = (
    id: string,
    type: OperationType,
    x: number,
    y: number,
  ): WorkflowNode => ({
    id,
    type,
    position: { x, y },
    data: { type, label: OPERATIONS[type].label, status: "idle", params: {} },
  });
  return {
    nodes: [
      mk("n1", "inputAutomaton", 60, 160),
      mk("n2", "nfaToDfa", 340, 160),
      mk("n3", "minimize", 620, 160),
      mk("n4", "export", 900, 160),
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
    ],
  };
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...defaultGraph(),
  running: false,
  log: [],

  // Les deux sources sont indépendantes : rafraîchir l'automate courant ne doit
  // jamais effacer l'expression renseignée dans un nœud Regex.
  setSource: (automaton, regex) =>
    set((state) => ({
      sourceAutomaton: automaton ?? state.sourceAutomaton,
      sourceRegex: regex ?? state.sourceRegex,
    })),

  addOperation: (type, x, y) =>
    set((s) => {
      const id = uid("n");
      const node: WorkflowNode = {
        id,
        type,
        position: { x: x ?? 200 + s.nodes.length * 30, y: y ?? 120 + s.nodes.length * 20 },
        data: { type, label: OPERATIONS[type].label, status: "idle", params: {} },
      };
      return { nodes: [...s.nodes, node], selectedNodeId: id };
    }),

  removeNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: undefined,
    })),

  moveNode: (id, x, y) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, position: { x, y } } : n,
      ),
    })),

  setNodeParams: (id, params) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, params } } : n,
      ),
    })),

  connect: (source, target) =>
    set((s) => {
      if (source === target) return s;
      if (s.edges.some((e) => e.source === source && e.target === target)) return s;
      return {
        edges: [...s.edges, { id: uid("e"), source, target }],
      };
    }),

  disconnect: (edgeId) =>
    set((s) => ({ edges: s.edges.filter((e) => e.id !== edgeId) })),

  select: (id) => set({ selectedNodeId: id }),

  setStatus: (id, status) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, status } } : n,
      ),
    })),

  runWorkflow: async () => {
    const { nodes, edges, sourceAutomaton, sourceRegex } = get();
    set({
      running: true,
      log: [`Démarrage du workflow (${nodes.length} nœuds)`],
      nodes: nodes.map((n) => ({ ...n, data: { ...n.data, status: "running", result: null, error: undefined } })),
    });

    // petite pause pour rendre l'animation visible
    await new Promise((r) => setTimeout(r, 250));

    const runnable = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      params: {
        ...n.data.params,
        // Un automate JSON attaché au nœud est prioritaire sur l'automate du Studio.
        automaton:
          n.type === "inputAutomaton"
            ? (typeof n.data.params?.automatonJson === "string" && n.data.params.automatonJson.trim()
                ? (n.data.params.automaton as Automaton | undefined)
                : sourceAutomaton)
            : undefined,
        // Chaque nœud Regex possède sa propre valeur. La source globale ne sert
        // qu'à conserver la compatibilité avec les anciens workflows.
        regex:
          n.type === "inputRegex"
            ? ((n.data.params?.regex as string | undefined) ?? sourceRegex ?? "")
            : n.data.params?.regex,
      },
    }));

    const results = runWorkflowGraph(runnable, edges);

    const log: string[] = [...get().log];
    const updated = nodes.map((n) => {
      const r = results.get(n.id);
      if (!r) {
        log.push(`IGNORE · ${n.data.label} (non connecté)`);
        return { ...n, data: { ...n.data, status: "idle" as NodeStatus } };
      }
      if ("error" in r) {
        log.push(`ERREUR · ${n.data.label} : ${r.error}`);
        return {
          ...n,
          data: { ...n.data, status: "error" as NodeStatus, error: r.error, result: null },
        };
      }
      log.push(`OK · ${n.data.label}`);
      return {
        ...n,
        data: { ...n.data, status: "success" as NodeStatus, result: r as AlgorithmResult },
      };
    });

    log.push("Workflow terminé");
    set({ nodes: updated, running: false, log });
  },

  reset: () => set({ ...defaultGraph(), log: [], selectedNodeId: undefined }),

  loadGraph: (nodes, edges) => set({ nodes, edges, log: [], selectedNodeId: undefined }),
}));
