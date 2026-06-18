/**
 * Construction de Thompson : expression régulière → ε-AFN.
 *
 * Chaque fragment possède un unique état d'entrée et un unique état de sortie.
 * Les constructions suivent les règles classiques (symbole, union,
 * concaténation, étoile, plus, optionnel).
 */
import { AlgorithmResult, Automaton, EPSILON, State, Transition } from "./types";
import { parseRegex, regexAlphabet, regexToString } from "./regex-parser";
import { RegexAST } from "./types";

interface Fragment {
  start: string;
  end: string;
}

export function thompson(regexSource: string): AlgorithmResult<Automaton> {
  const ast = parseRegex(regexSource);
  const alphabet = regexAlphabet(ast);

  let counter = 0;
  const states: State[] = [];
  const transitions: Transition[] = [];
  const newState = (): string => {
    const id = `t${counter++}`;
    states.push({ id, label: id, initial: false, final: false });
    return id;
  };
  const link = (from: string, to: string, symbol: string) => {
    transitions.push({ id: `e${transitions.length}`, from, to, symbol });
  };

  const build = (node: RegexAST): Fragment => {
    switch (node.type) {
      case "empty": {
        // langage vide : deux états sans transition
        const s = newState();
        const e = newState();
        return { start: s, end: e };
      }
      case "epsilon": {
        const s = newState();
        const e = newState();
        link(s, e, EPSILON);
        return { start: s, end: e };
      }
      case "symbol": {
        const s = newState();
        const e = newState();
        link(s, e, node.value!);
        return { start: s, end: e };
      }
      case "concat": {
        const f1 = build(node.left!);
        const f2 = build(node.right!);
        link(f1.end, f2.start, EPSILON);
        return { start: f1.start, end: f2.end };
      }
      case "union": {
        const s = newState();
        const e = newState();
        const f1 = build(node.left!);
        const f2 = build(node.right!);
        link(s, f1.start, EPSILON);
        link(s, f2.start, EPSILON);
        link(f1.end, e, EPSILON);
        link(f2.end, e, EPSILON);
        return { start: s, end: e };
      }
      case "star": {
        const s = newState();
        const e = newState();
        const f = build(node.child!);
        link(s, f.start, EPSILON);
        link(s, e, EPSILON);
        link(f.end, f.start, EPSILON);
        link(f.end, e, EPSILON);
        return { start: s, end: e };
      }
      case "plus": {
        // e⁺ = e e*
        const s = newState();
        const e = newState();
        const f = build(node.child!);
        link(s, f.start, EPSILON);
        link(f.end, f.start, EPSILON);
        link(f.end, e, EPSILON);
        return { start: s, end: e };
      }
      case "optional": {
        const s = newState();
        const e = newState();
        const f = build(node.child!);
        link(s, f.start, EPSILON);
        link(s, e, EPSILON);
        link(f.end, e, EPSILON);
        return { start: s, end: e };
      }
    }
  };

  const frag = build(ast);
  const startState = states.find((s) => s.id === frag.start)!;
  startState.initial = true;
  const endState = states.find((s) => s.id === frag.end)!;
  endState.final = true;

  // Positions en couches simples
  states.forEach((s, i) => {
    s.x = (i % 6) * 130 + 60;
    s.y = Math.floor(i / 6) * 120 + 60;
  });

  const automaton: Automaton = {
    id: "thompson",
    name: `Thompson(${regexToString(ast)})`,
    kind: "ENFA",
    alphabet,
    states,
    transitions,
  };

  return {
    result: automaton,
    steps: [
      {
        title: "1. Analyse de l'expression",
        description: `Expression normalisée : ${regexToString(ast)}.`,
      },
      {
        title: "2. Construction récursive de Thompson",
        description:
          "Chaque sous-expression produit un fragment à une entrée et une sortie, reliées par des transitions ε.",
        snapshot: automaton,
      },
      {
        title: "3. ε-AFN obtenu",
        description: `Initial unique et final unique. ${states.length} état(s), ${transitions.length} transition(s).`,
      },
    ],
    warnings: [],
    metrics: { états: states.length, transitions: transitions.length },
  };
}
