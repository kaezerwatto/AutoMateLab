/**
 * Registre des opérations disponibles dans le Workflow Studio (canvas type n8n).
 * Chaque opération décrit ses métadonnées et une fonction `run` pure.
 */
import { AlgorithmResult, Automaton, OperationType } from "./types";
import { analyzeStates, getAccessibleStates, getCoAccessibleStates } from "./accessible";
import { trimAutomaton } from "./trim";
import { completeDfa } from "./complete-dfa";
import { nfaToDfa } from "./nfa-to-dfa";
import { enfaToDfa } from "./enfa-to-dfa";
import { dfaToNfa, nfaToEnfa, dfaToEnfa } from "./dfa-to-nfa";
import { enfaToNfa } from "./enfa-to-nfa";
import { epsilonClosureReport } from "./epsilon-closure";
import { minimizeDfa } from "./minimize";
import { canonize } from "./canonize";
import { thompson } from "./thompson";
import { glushkov } from "./glushkov";
import { automatonToRegex } from "./automaton-to-regex";
import { complementAutomaton } from "./closure-operations";
import { cloneAutomaton } from "./graph-utils";

export type OperationCategory =
  | "entrée"
  | "analyse"
  | "conversion"
  | "regex"
  | "clôture"
  | "sortie";

export interface OperationContext {
  /** Résultats des nœuds en amont (dans l'ordre des connexions). */
  inputs: AlgorithmResult[];
  /** Paramètres du nœud (ex : automate source, expression régulière). */
  params: Record<string, unknown>;
}

export interface OperationDef {
  type: OperationType;
  label: string;
  category: OperationCategory;
  description: string;
  /** Nombre d'entrées attendues (0 pour les sources). */
  minInputs: number;
  /** Icône lucide-react (nom). */
  icon: string;
  run: (ctx: OperationContext) => AlgorithmResult;
}

function firstAutomaton(ctx: OperationContext): Automaton {
  const input = ctx.inputs[0]?.result;
  if (!input || typeof input === "string") {
    throw new Error("Cette opération nécessite un automate en entrée.");
  }
  return input;
}

export const OPERATIONS: Record<OperationType, OperationDef> = {
  inputAutomaton: {
    type: "inputAutomaton",
    label: "Importer automate",
    category: "entrée",
    description: "Source : automate courant ou JSON importé.",
    minInputs: 0,
    icon: "FileInput",
    run: (ctx) => {
      const a = ctx.params.automaton as Automaton | undefined;
      if (!a) throw new Error("Aucun automate fourni à la source.");
      return {
        result: cloneAutomaton(a),
        steps: [{ title: "Source", description: `Automate « ${a.name} » chargé.` }],
        warnings: [],
        metrics: { états: a.states.length },
      };
    },
  },
  inputRegex: {
    type: "inputRegex",
    label: "Expression régulière",
    category: "entrée",
    description: "Source : expression régulière (string).",
    minInputs: 0,
    icon: "Regex",
    run: (ctx) => {
      const expr = (ctx.params.regex as string) ?? "";
      return {
        result: expr,
        steps: [{ title: "Source regex", description: `Expression « ${expr} ».` }],
        warnings: [],
      };
    },
  },
  accessible: {
    type: "accessible",
    label: "États accessibles",
    category: "analyse",
    description: "Colore les états atteignables depuis l'initial.",
    minInputs: 1,
    icon: "Radar",
    run: (ctx) => {
      const a = firstAutomaton(ctx);
      const acc = getAccessibleStates(a);
      return {
        result: a,
        steps: [
          {
            title: "États accessibles",
            description: `${acc.size} état(s) accessible(s).`,
            highlightStates: [...acc],
          },
        ],
        warnings: [],
        metrics: { accessibles: acc.size },
      };
    },
  },
  coAccessible: {
    type: "coAccessible",
    label: "États co-accessibles",
    category: "analyse",
    description: "Colore les états menant à un final.",
    minInputs: 1,
    icon: "Radar",
    run: (ctx) => {
      const a = firstAutomaton(ctx);
      const co = getCoAccessibleStates(a);
      return {
        result: a,
        steps: [
          {
            title: "États co-accessibles",
            description: `${co.size} état(s) co-accessible(s).`,
            highlightStates: [...co],
          },
        ],
        warnings: [],
        metrics: { coAccessibles: co.size },
      };
    },
  },
  useful: {
    type: "useful",
    label: "États utiles",
    category: "analyse",
    description: "Accessible ∧ co-accessible.",
    minInputs: 1,
    icon: "CheckCircle2",
    run: (ctx) => analyzeStates(firstAutomaton(ctx)),
  },
  trim: {
    type: "trim",
    label: "Émonder",
    category: "analyse",
    description: "Supprime les états inutiles.",
    minInputs: 1,
    icon: "Scissors",
    run: (ctx) => trimAutomaton(firstAutomaton(ctx)),
  },
  completeDfa: {
    type: "completeDfa",
    label: "Compléter (AFDC)",
    category: "conversion",
    description: "Ajoute un état puits pour compléter l'AFD.",
    minInputs: 1,
    icon: "SquarePlus",
    run: (ctx) => completeDfa(firstAutomaton(ctx)),
  },
  nfaToDfa: {
    type: "nfaToDfa",
    label: "AFN → AFD",
    category: "conversion",
    description: "Déterminisation par sous-ensembles.",
    minInputs: 1,
    icon: "GitMerge",
    run: (ctx) => nfaToDfa(firstAutomaton(ctx)),
  },
  dfaToNfa: {
    type: "dfaToNfa",
    label: "AFD → AFN",
    category: "conversion",
    description: "Vue AFN d'un AFD (uniformisation).",
    minInputs: 1,
    icon: "GitFork",
    run: (ctx) => dfaToNfa(firstAutomaton(ctx)),
  },
  nfaToEnfa: {
    type: "nfaToEnfa",
    label: "AFN → ε-AFN",
    category: "conversion",
    description: "Autorise les ε-transitions (trivial).",
    minInputs: 1,
    icon: "GitFork",
    run: (ctx) => nfaToEnfa(firstAutomaton(ctx)),
  },
  dfaToEnfa: {
    type: "dfaToEnfa",
    label: "AFD → ε-AFN",
    category: "conversion",
    description: "Un AFD vu comme ε-AFN (trivial).",
    minInputs: 1,
    icon: "GitFork",
    run: (ctx) => dfaToEnfa(firstAutomaton(ctx)),
  },
  enfaToNfa: {
    type: "enfaToNfa",
    label: "ε-AFN → AFN",
    category: "conversion",
    description: "Élimination des ε-transitions.",
    minInputs: 1,
    icon: "GitMerge",
    run: (ctx) => enfaToNfa(firstAutomaton(ctx)),
  },
  epsilonClosure: {
    type: "epsilonClosure",
    label: "ε-fermeture",
    category: "analyse",
    description: "Table des ε-fermetures.",
    minInputs: 1,
    icon: "CircleDot",
    run: (ctx) => {
      const a = firstAutomaton(ctx);
      const r = epsilonClosureReport(a);
      return { ...r, result: a };
    },
  },
  enfaToDfa: {
    type: "enfaToDfa",
    label: "ε-AFN → AFD",
    category: "conversion",
    description: "ε-fermeture + sous-ensembles.",
    minInputs: 1,
    icon: "GitMerge",
    run: (ctx) => enfaToDfa(firstAutomaton(ctx)),
  },
  minimize: {
    type: "minimize",
    label: "Minimiser",
    category: "conversion",
    description: "AFD minimal par raffinement.",
    minInputs: 1,
    icon: "Minimize2",
    run: (ctx) => minimizeDfa(firstAutomaton(ctx)),
  },
  canonize: {
    type: "canonize",
    label: "Canoniser",
    category: "conversion",
    description: "Renommage stable q0, q1, …",
    minInputs: 1,
    icon: "Hash",
    run: (ctx) => canonize(firstAutomaton(ctx)),
  },
  thompson: {
    type: "thompson",
    label: "Thompson",
    category: "regex",
    description: "Regex → ε-AFN.",
    minInputs: 1,
    icon: "Workflow",
    run: (ctx) => {
      const input = ctx.inputs[0]?.result;
      const expr = typeof input === "string" ? input : (ctx.params.regex as string);
      if (!expr) throw new Error("Expression régulière requise.");
      return thompson(expr);
    },
  },
  glushkov: {
    type: "glushkov",
    label: "Glushkov",
    category: "regex",
    description: "Regex → automate de positions.",
    minInputs: 1,
    icon: "Network",
    run: (ctx) => {
      const input = ctx.inputs[0]?.result;
      const expr = typeof input === "string" ? input : (ctx.params.regex as string);
      if (!expr) throw new Error("Expression régulière requise.");
      return glushkov(expr);
    },
  },
  automatonToRegex: {
    type: "automatonToRegex",
    label: "Automate → Regex",
    category: "regex",
    description: "Élimination d'états.",
    minInputs: 1,
    icon: "Regex",
    run: (ctx) => automatonToRegex(firstAutomaton(ctx)),
  },
  complement: {
    type: "complement",
    label: "Complément",
    category: "clôture",
    description: "Complète puis inverse les finaux.",
    minInputs: 1,
    icon: "FlipHorizontal2",
    run: (ctx) => complementAutomaton(firstAutomaton(ctx)),
  },
  export: {
    type: "export",
    label: "Exporter",
    category: "sortie",
    description: "Sortie finale : passe le résultat tel quel.",
    minInputs: 1,
    icon: "Download",
    run: (ctx) => {
      const last = ctx.inputs[ctx.inputs.length - 1];
      if (!last) throw new Error("Aucune entrée à exporter.");
      return {
        result: last.result,
        steps: [{ title: "Export", description: "Résultat prêt à être exporté." }],
        warnings: [],
      };
    },
  },
};

export const OPERATION_LIST: OperationDef[] = Object.values(OPERATIONS);

/** Exécute un workflow dans l'ordre topologique. */
export function runWorkflowGraph(
  nodes: { id: string; type: OperationType; params?: Record<string, unknown> }[],
  edges: { source: string; target: string }[],
): Map<string, AlgorithmResult | { error: string }> {
  const incoming = new Map<string, string[]>();
  const outdeg = new Map<string, number>();
  for (const n of nodes) {
    incoming.set(n.id, []);
    outdeg.set(n.id, 0);
  }
  for (const e of edges) {
    incoming.get(e.target)?.push(e.source);
  }

  // tri topologique (Kahn)
  const indeg = new Map<string, number>();
  for (const n of nodes) indeg.set(n.id, incoming.get(n.id)!.length);
  const queue = nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const e of edges.filter((x) => x.source === id)) {
      indeg.set(e.target, (indeg.get(e.target) ?? 1) - 1);
      if (indeg.get(e.target) === 0) queue.push(e.target);
    }
  }

  const results = new Map<string, AlgorithmResult | { error: string }>();
  const nodeById = new Map(nodes.map((n) => [n.id, n] as const));

  for (const id of order) {
    const node = nodeById.get(id)!;
    const def = OPERATIONS[node.type];
    try {
      const inputResults: AlgorithmResult[] = [];
      for (const src of incoming.get(id) ?? []) {
        const r = results.get(src);
        if (r && !("error" in r)) inputResults.push(r);
      }
      const res = def.run({ inputs: inputResults, params: node.params ?? {} });
      results.set(id, res);
    } catch (e) {
      results.set(id, { error: (e as Error).message });
    }
  }
  return results;
}
