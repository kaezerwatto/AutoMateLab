/**
 * Construction de Glushkov : expression régulière → automate de positions
 * (sans transition ε).
 *
 * Étapes : linéarisation (numérotation des occurrences), calcul de nullable,
 * firstpos, lastpos, followpos, puis génération de l'automate.
 */
import { AlgorithmResult, Automaton, State, Transition, RegexAST } from "./types";
import { parseRegex, regexAlphabet, regexToString } from "./regex-parser";

interface PosInfo {
  nullable: boolean;
  first: Set<number>;
  last: Set<number>;
}

export function glushkov(regexSource: string): AlgorithmResult<Automaton> {
  const ast = parseRegex(regexSource);
  const alphabet = regexAlphabet(ast);

  // 1. Linéarisation : chaque symbole reçoit une position 1..n
  let pos = 0;
  const symbolAt = new Map<number, string>();
  const assign = (n: RegexAST): void => {
    if (n.type === "symbol") {
      pos += 1;
      (n as RegexAST & { pos?: number }).pos = pos;
      symbolAt.set(pos, n.value!);
    }
    if (n.left) assign(n.left);
    if (n.right) assign(n.right);
    if (n.child) assign(n.child);
  };
  assign(ast);

  const followpos = new Map<number, Set<number>>();
  for (let i = 1; i <= pos; i++) followpos.set(i, new Set());

  const union = (a: Set<number>, b: Set<number>) =>
    new Set<number>([...a, ...b]);

  const compute = (n: RegexAST): PosInfo => {
    switch (n.type) {
      case "empty":
        return { nullable: false, first: new Set(), last: new Set() };
      case "epsilon":
        return { nullable: true, first: new Set(), last: new Set() };
      case "symbol": {
        const p = (n as RegexAST & { pos?: number }).pos!;
        return { nullable: false, first: new Set([p]), last: new Set([p]) };
      }
      case "union": {
        const l = compute(n.left!);
        const r = compute(n.right!);
        return {
          nullable: l.nullable || r.nullable,
          first: union(l.first, r.first),
          last: union(l.last, r.last),
        };
      }
      case "concat": {
        const l = compute(n.left!);
        const r = compute(n.right!);
        for (const i of l.last) {
          followpos.set(i, union(followpos.get(i)!, r.first));
        }
        return {
          nullable: l.nullable && r.nullable,
          first: l.nullable ? union(l.first, r.first) : l.first,
          last: r.nullable ? union(l.last, r.last) : r.last,
        };
      }
      case "star": {
        const c = compute(n.child!);
        for (const i of c.last) {
          followpos.set(i, union(followpos.get(i)!, c.first));
        }
        return { nullable: true, first: c.first, last: c.last };
      }
      case "plus": {
        const c = compute(n.child!);
        for (const i of c.last) {
          followpos.set(i, union(followpos.get(i)!, c.first));
        }
        return { nullable: c.nullable, first: c.first, last: c.last };
      }
      case "optional": {
        const c = compute(n.child!);
        return { nullable: true, first: c.first, last: c.last };
      }
    }
  };

  const root = compute(ast);

  // 2. Construction de l'automate
  const states: State[] = [];
  states.push({ id: "q0", label: "q0", initial: true, final: root.nullable });
  for (let i = 1; i <= pos; i++) {
    states.push({
      id: `q${i}`,
      label: `${symbolAt.get(i)}${subscript(i)}`,
      initial: false,
      final: root.last.has(i),
    });
  }

  const transitions: Transition[] = [];
  const addEdge = (from: string, to: number) => {
    transitions.push({
      id: `e${transitions.length}`,
      from,
      to: `q${to}`,
      symbol: symbolAt.get(to)!,
    });
  };
  for (const i of root.first) addEdge("q0", i);
  for (let i = 1; i <= pos; i++) {
    for (const j of followpos.get(i)!) addEdge(`q${i}`, j);
  }

  states.forEach((s, i) => {
    s.x = (i % 6) * 140 + 60;
    s.y = Math.floor(i / 6) * 130 + 60;
  });

  const automaton: Automaton = {
    id: "glushkov",
    name: `Glushkov(${regexToString(ast)})`,
    kind: "NFA",
    alphabet,
    states,
    transitions,
  };

  const followTable = [];
  for (let i = 1; i <= pos; i++) {
    followTable.push({
      position: `${symbolAt.get(i)}${subscript(i)}`,
      followpos: `{ ${[...followpos.get(i)!]
        .sort((a, b) => a - b)
        .map((p) => `${symbolAt.get(p)}${subscript(p)}`)
        .join(", ")} }`,
    });
  }

  return {
    result: automaton,
    steps: [
      {
        title: "1. Linéarisation",
        description: `Chaque occurrence de symbole est numérotée. ${pos} position(s).`,
      },
      {
        title: "2. firstpos / lastpos / nullable",
        description: `nullable = ${root.nullable}. firstpos = { ${[...root.first]
          .sort((a, b) => a - b)
          .map((p) => `${symbolAt.get(p)}${subscript(p)}`)
          .join(", ")} }.`,
      },
      {
        title: "3. followpos",
        description: "Relations de succession entre positions.",
        table: followTable,
      },
      {
        title: "4. Automate de positions",
        description: `Initial q0${root.nullable ? " (final car ε reconnu)" : ""}, un état par position.`,
        snapshot: automaton,
      },
    ],
    warnings: [],
    metrics: { positions: pos, transitions: transitions.length },
  };
}

function subscript(n: number): string {
  const map: Record<string, string> = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
  };
  return String(n)
    .split("")
    .map((d) => map[d] ?? d)
    .join("");
}
