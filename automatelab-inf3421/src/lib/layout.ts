/**
 * Disposition automatique des automates via dagre (left → right).
 */
import dagre from "dagre";
import { Automaton } from "@/core/types";
import { cloneAutomaton } from "@/core/graph-utils";

export function autoLayout(a: Automaton, direction: "LR" | "TB" = "LR"): Automaton {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 90, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  const NODE_W = 70;
  const NODE_H = 70;
  for (const s of a.states) g.setNode(s.id, { width: NODE_W, height: NODE_H });
  for (const t of a.transitions) {
    if (t.from !== t.to) g.setEdge(t.from, t.to);
  }
  dagre.layout(g);

  const clone = cloneAutomaton(a);
  clone.states = clone.states.map((s) => {
    const n = g.node(s.id);
    return n ? { ...s, x: n.x - NODE_W / 2, y: n.y - NODE_H / 2 } : s;
  });
  return clone;
}
