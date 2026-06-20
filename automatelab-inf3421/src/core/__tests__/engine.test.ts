import { describe, expect, it } from "vitest";
import {
  Automaton,
  accessibleReport,
  analyzeStates,
  automatonToRegex,
  coAccessibleReport,
  epsilonClosureOfReport,
  canonize,
  completeDfa,
  detectKind,
  enfaToDfa,
  epsilonClosureOf,
  getAccessibleStates,
  getCoAccessibleStates,
  glushkov,
  isCompleteDFA,
  isDFA,
  minimizeDfa,
  nfaToDfa,
  parseRegex,
  regexToString,
  solveArden,
  thompson,
  trimAutomaton,
  validateAutomaton,
} from "../index";
import {
  complementAutomaton,
  intersectionAutomata,
  unionAutomata,
} from "../closure-operations";
import { enfaToNfa } from "../enfa-to-nfa";
import { runWorkflowGraph } from "../operations";

const nfaAbb: Automaton = {
  id: "a",
  name: "abb",
  kind: "NFA",
  alphabet: ["a", "b"],
  states: [
    { id: "q0", label: "q0", initial: true },
    { id: "q1", label: "q1" },
    { id: "q2", label: "q2" },
    { id: "q3", label: "q3", final: true },
  ],
  transitions: [
    { id: "t1", from: "q0", to: "q0", symbol: "a" },
    { id: "t2", from: "q0", to: "q0", symbol: "b" },
    { id: "t3", from: "q0", to: "q1", symbol: "a" },
    { id: "t4", from: "q1", to: "q2", symbol: "b" },
    { id: "t5", from: "q2", to: "q3", symbol: "b" },
  ],
};

describe("validation & détection", () => {
  it("détecte un AFN", () => {
    expect(detectKind(nfaAbb)).toBe("NFA");
    expect(isDFA(nfaAbb)).toBe(false);
  });

  it("signale une transition vers un état inconnu", () => {
    const bad: Automaton = {
      ...nfaAbb,
      transitions: [{ id: "x", from: "q0", to: "qX", symbol: "a" }],
    };
    const report = validateAutomaton(bad);
    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.message.includes("inconnu"))).toBe(true);
  });

  it("rejette ε dans un AFD", () => {
    const bad: Automaton = {
      ...nfaAbb,
      kind: "DFA",
      transitions: [{ id: "x", from: "q0", to: "q1", symbol: "ε" }],
    };
    expect(validateAutomaton(bad).valid).toBe(false);
  });
});

describe("accessibilité & émondage", () => {
  const withDead: Automaton = {
    id: "d",
    name: "dead",
    kind: "NFA",
    alphabet: ["a", "b"],
    states: [
      { id: "q0", label: "q0", initial: true },
      { id: "q1", label: "q1", final: true },
      { id: "q2", label: "q2" },
    ],
    transitions: [
      { id: "t1", from: "q0", to: "q1", symbol: "a" },
      { id: "t2", from: "q0", to: "q2", symbol: "b" },
      { id: "t3", from: "q2", to: "q2", symbol: "a" },
    ],
  };

  it("q2 est accessible mais pas co-accessible", () => {
    expect(getAccessibleStates(withDead).has("q2")).toBe(true);
    expect(getCoAccessibleStates(withDead).has("q2")).toBe(false);
  });

  it("émonde l'état inutile q2", () => {
    const r = trimAutomaton(withDead);
    expect(r.result.states.some((s) => s.id === "q2")).toBe(false);
  });

  it("le rapport d'accessibilité colorie les bons états", () => {
    expect(accessibleReport(withDead).metrics?.accessibles).toBe(3);
    expect(coAccessibleReport(withDead).metrics?.coAccessibles).toBe(2);
  });

  it("ε-fermeture d'un état donné renvoie l'ensemble attendu", () => {
    const enfa: Automaton = {
      id: "ec",
      name: "ec",
      kind: "ENFA",
      alphabet: ["a"],
      states: [
        { id: "q0", label: "q0", initial: true },
        { id: "q1", label: "q1" },
        { id: "q2", label: "q2", final: true },
      ],
      transitions: [
        { id: "t1", from: "q0", to: "q1", symbol: "ε" },
        { id: "t2", from: "q1", to: "q2", symbol: "ε" },
      ],
    };
    const r = epsilonClosureOfReport(enfa, "q0");
    expect(r.metrics?.taille).toBe(3);
    expect(r.result).toContain("q0");
  });

  it("analyse renvoie des métriques cohérentes", () => {
    const r = analyzeStates(withDead);
    expect(r.metrics?.utiles).toBe(2);
  });
});

describe("complétion AFD → AFDC", () => {
  const dfa: Automaton = {
    id: "c",
    name: "c",
    kind: "DFA",
    alphabet: ["a", "b"],
    states: [
      { id: "q0", label: "q0", initial: true },
      { id: "q1", label: "q1", final: true },
    ],
    transitions: [
      { id: "t1", from: "q0", to: "q1", symbol: "a" },
      { id: "t2", from: "q0", to: "q0", symbol: "b" },
      { id: "t3", from: "q1", to: "q1", symbol: "a" },
    ],
  };

  it("ajoute un puits quand une transition manque", () => {
    const r = completeDfa(dfa);
    expect(isCompleteDFA(r.result)).toBe(true);
    expect(r.result.states.some((s) => s.label === "⊥")).toBe(true);
  });
});

describe("déterminisation", () => {
  it("AFN → AFD reconnaît correctement abb", () => {
    const r = nfaToDfa(nfaAbb);
    expect(isDFA(r.result)).toBe(true);
    expect(r.result.states.some((s) => s.final)).toBe(true);
  });

  it("ε-fermeture suit les ε-transitions", () => {
    const enfa: Automaton = {
      id: "e",
      name: "e",
      kind: "ENFA",
      alphabet: ["a"],
      states: [
        { id: "q0", label: "q0", initial: true },
        { id: "q1", label: "q1" },
        { id: "q2", label: "q2", final: true },
      ],
      transitions: [
        { id: "t1", from: "q0", to: "q1", symbol: "ε" },
        { id: "t2", from: "q1", to: "q2", symbol: "ε" },
      ],
    };
    const closure = epsilonClosureOf(enfa, "q0");
    expect([...closure].sort()).toEqual(["q0", "q1", "q2"]);
    const r = enfaToDfa(enfa);
    expect(isDFA(r.result)).toBe(true);
  });

  it("ε-AFN → AFN élimine les ε-transitions en préservant les finaux", () => {
    const enfa: Automaton = {
      id: "e2",
      name: "e2",
      kind: "ENFA",
      alphabet: ["a", "b"],
      states: [
        { id: "q0", label: "q0", initial: true },
        { id: "q1", label: "q1" },
        { id: "q2", label: "q2", final: true },
      ],
      transitions: [
        { id: "t1", from: "q0", to: "q1", symbol: "ε" },
        { id: "t2", from: "q1", to: "q2", symbol: "a" },
        { id: "t3", from: "q2", to: "q2", symbol: "b" },
      ],
    };
    const r = enfaToNfa(enfa);
    expect(r.result.kind).toBe("NFA");
    expect(r.result.transitions.every((t) => t.symbol !== "ε")).toBe(true);
    // q0 doit pouvoir lire 'a' (via ε vers q1) et atteindre q2
    expect(r.result.transitions.some((t) => t.from === "q0" && t.symbol === "a" && t.to === "q2")).toBe(true);
  });
});

describe("minimisation", () => {
  it("réduit un AFD avec états équivalents", () => {
    const dfa: Automaton = {
      id: "m",
      name: "m",
      kind: "DFA",
      alphabet: ["a", "b"],
      states: [
        { id: "A", label: "A", initial: true },
        { id: "B", label: "B" },
        { id: "C", label: "C" },
        { id: "D", label: "D", final: true },
        { id: "E", label: "E", final: true },
      ],
      transitions: [
        { id: "1", from: "A", to: "B", symbol: "a" },
        { id: "2", from: "A", to: "C", symbol: "b" },
        { id: "3", from: "B", to: "B", symbol: "a" },
        { id: "4", from: "B", to: "D", symbol: "b" },
        { id: "5", from: "C", to: "C", symbol: "a" },
        { id: "6", from: "C", to: "E", symbol: "b" },
        { id: "7", from: "D", to: "B", symbol: "a" },
        { id: "8", from: "D", to: "D", symbol: "b" },
        { id: "9", from: "E", to: "C", symbol: "a" },
        { id: "10", from: "E", to: "E", symbol: "b" },
      ],
    };
    const r = minimizeDfa(dfa);
    expect(r.result.states.length).toBeLessThan(dfa.states.length);
  });
});

describe("regex : parser, Thompson, Glushkov", () => {
  it("parse et réimprime (a+b)*abb", () => {
    const ast = parseRegex("(a+b)*abb");
    expect(regexToString(ast)).toContain("abb");
  });

  it("Thompson produit un ε-AFN avec initial et final uniques", () => {
    const r = thompson("(a+b)*abb");
    expect(r.result.kind).toBe("ENFA");
    expect(r.result.states.filter((s) => s.initial).length).toBe(1);
    expect(r.result.states.filter((s) => s.final).length).toBe(1);
  });

  it("Glushkov produit un automate sans ε", () => {
    const r = glushkov("ab*");
    expect(r.result.transitions.every((t) => t.symbol !== "ε")).toBe(true);
  });

  it("automate → regex renvoie une expression", () => {
    const r = automatonToRegex(nfaAbb);
    expect(typeof r.result).toBe("string");
    expect(r.result.length).toBeGreaterThan(0);
  });
});

describe("Arden", () => {
  it("résout X = aX + b en a*b", () => {
    const r = solveArden(["X = aX + b"]);
    expect(r.result.replace(/[()]/g, "")).toContain("a*b");
  });

  it("normalise les alias pratiques du mot vide", () => {
    const r = solveArden(["X = aX + epsilon"]);
    expect(r.result).toContain("a*");
  });

  it("rejette une variable minuscule au membre gauche", () => {
    expect(() => solveArden(["z = aX + ε", "X = b"])).toThrow(/Variable invalide/);
  });

  it("rejette une variable utilisée sans équation", () => {
    expect(() => solveArden(["X = aY + ε"])).toThrow(/Variable non déclarée/);
  });
});

describe("clôtures", () => {
  it("union conserve les deux langages (ENFA)", () => {
    const r = unionAutomata(nfaAbb, nfaAbb);
    expect(r.result.kind).toBe("ENFA");
    expect(r.result.states.some((s) => s.initial)).toBe(true);
  });

  it("complément produit un AFD complet", () => {
    const dfa = nfaToDfa(nfaAbb).result;
    const r = complementAutomaton(dfa);
    expect(isDFA(r.result)).toBe(true);
  });

  it("intersection est un produit", () => {
    const dfa = nfaToDfa(nfaAbb).result;
    const r = intersectionAutomata(dfa, dfa);
    expect(r.result.states.length).toBeGreaterThan(0);
  });
});

describe("canonisation", () => {
  it("renomme en q0, q1, ...", () => {
    const r = canonize(nfaAbb);
    expect(r.result.states[0].label).toBe("q0");
  });
});

describe("workflow : données d'entrée", () => {
  it("utilise la regex configurée sur le nœud source", () => {
    const results = runWorkflowGraph(
      [
        { id: "regex", type: "inputRegex", params: { regex: "ab" } },
        { id: "thompson", type: "thompson" },
      ],
      [{ source: "regex", target: "thompson" }],
    );
    const result = results.get("thompson");
    expect(result && !("error" in result)).toBe(true);
  });

  it("refuse une source automate JSON invalide", () => {
    const results = runWorkflowGraph(
      [{ id: "source", type: "inputAutomaton", params: { automatonJson: "{invalide}" } }],
      [],
    );
    expect(results.get("source")).toMatchObject({ error: "Aucun automate fourni à la source." });
  });
});
