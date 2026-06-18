/**
 * Résolution de systèmes d'équations de langages par le lemme d'Arden.
 *
 *  Lemme d'Arden : si X = A·X + B et ε ∉ A, alors X = A*·B.
 *
 * On résout un système par élimination de Gauss : passe avant (Arden +
 * substitution dans les équations suivantes) puis remontée.
 *
 * Format d'entrée attendu (une équation par ligne) :
 *   X = a X + b Y + ε
 *   Y = a Y + b
 * Les variables sont des identifiants en MAJUSCULES, les symboles en minuscules.
 */
import { AlgorithmResult, LanguageEquation, TraceStep } from "./types";

const EMPTY = "∅";
const EPS = "ε";

function rUnion(a: string, b: string): string {
  if (a === EMPTY) return b;
  if (b === EMPTY) return a;
  if (a === b) return a;
  return `${a}+${b}`;
}
function rConcat(a: string, b: string): string {
  if (a === EMPTY || b === EMPTY) return EMPTY;
  if (a === EPS) return b;
  if (b === EPS) return a;
  const la = needsParen(a) ? `(${a})` : a;
  const lb = needsParen(b) ? `(${b})` : b;
  return `${la}${lb}`;
}
function rStar(a: string): string {
  if (a === EMPTY || a === EPS) return EPS;
  return needsParen(a) ? `(${a})*` : `${a}*`;
}
function needsParen(s: string): boolean {
  // parenthèse si union de plusieurs termes au niveau supérieur
  let depth = 0;
  for (const c of s) {
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "+" && depth === 0) return true;
  }
  return false;
}

interface Equation {
  variable: string;
  coeffs: Map<string, string>;
  constant: string;
}

function parseEquation(raw: string, variables: Set<string>): Equation {
  const [lhs, rhs] = raw.split("=");
  if (!rhs) throw new Error(`Équation invalide : « ${raw} » (attendu X = …).`);
  const variable = lhs.trim();
  const coeffs = new Map<string, string>();
  let constant = EMPTY;

  const terms = splitTopLevel(rhs.trim());
  for (const term of terms) {
    const t = term.trim();
    if (t === "") continue;
    // Cherche une variable en suffixe du terme
    const found = [...variables].find((v) => t === v || t.endsWith(v));
    if (found && (t === found || /[^A-Z]/.test(t[t.length - found.length - 1] ?? "x"))) {
      const coeffRaw = t.slice(0, t.length - found.length).trim();
      const coeff = coeffRaw === "" ? EPS : coeffRaw;
      coeffs.set(found, rUnion(coeffs.get(found) ?? EMPTY, coeff));
    } else {
      constant = rUnion(constant, t === "" ? EPS : t);
    }
  }
  return { variable, coeffs, constant };
}

function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const c of s) {
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (c === "+" && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  if (cur) out.push(cur);
  return out;
}

export function solveArden(
  equations: LanguageEquation[] | string[],
  target?: string,
): AlgorithmResult<string> {
  const raws = (equations as (LanguageEquation | string)[]).map((e) =>
    typeof e === "string" ? e : e.raw,
  );
  // Collecte des variables (membre gauche)
  const variables = new Set<string>();
  for (const r of raws) {
    const lhs = r.split("=")[0]?.trim();
    if (lhs) variables.add(lhs);
  }
  if (variables.size === 0) {
    throw new Error("Aucune variable détectée (membre gauche manquant).");
  }

  const order = [...variables];
  const eqs = raws.map((r) => parseEquation(r, variables));
  const byVar = new Map(eqs.map((e) => [e.variable, e] as const));

  const steps: TraceStep[] = [
    {
      title: "1. Système initial",
      description: "Équations saisies sous forme X = A·X + reste.",
      table: eqs.map((e) => ({
        variable: e.variable,
        équation: formatEquation(e),
      })),
    },
  ];

  // Arden local + substitution avant
  for (let i = 0; i < order.length; i++) {
    const vi = order[i];
    const eq = byVar.get(vi)!;
    // Arden : retirer l'auto-référence
    if (eq.coeffs.has(vi)) {
      const A = eq.coeffs.get(vi)!;
      eq.coeffs.delete(vi);
      const star = rStar(A);
      const newCoeffs = new Map<string, string>();
      for (const [k, v] of eq.coeffs) newCoeffs.set(k, rConcat(star, v));
      eq.coeffs = newCoeffs;
      eq.constant = rConcat(star, eq.constant);
      steps.push({
        title: `Arden sur ${vi}`,
        description: `${vi} = ${A}·${vi} + … ⟹ ${vi} = (${A})*·(reste).`,
      });
    }
    // Substituer vi dans les équations suivantes
    for (let j = i + 1; j < order.length; j++) {
      substitute(byVar.get(order[j])!, vi, eq);
    }
  }

  // Remontée
  for (let i = order.length - 2; i >= 0; i--) {
    const eq = byVar.get(order[i])!;
    for (let j = i + 1; j < order.length; j++) {
      substitute(eq, order[j], byVar.get(order[j])!);
    }
  }

  const solutions = order.map((v) => {
    const e = byVar.get(v)!;
    return { variable: v, solution: e.constant };
  });

  steps.push({
    title: "Solutions",
    description: "Chaque variable est exprimée comme expression régulière.",
    table: solutions.map((s) => ({
      variable: s.variable,
      solution: s.solution,
    })),
  });

  const targetVar = target && variables.has(target) ? target : order[0];
  const finalSolution = byVar.get(targetVar)!.constant;

  return {
    result: finalSolution,
    steps,
    warnings: [],
    metrics: { variables: variables.size, cible: targetVar },
  };
}

/** Substitue la variable `from` (résolue dans `src`) dans l'équation `eq`. */
function substitute(eq: Equation, from: string, src: Equation): void {
  if (!eq.coeffs.has(from)) return;
  const c = eq.coeffs.get(from)!;
  eq.coeffs.delete(from);
  for (const [k, v] of src.coeffs) {
    eq.coeffs.set(k, rUnion(eq.coeffs.get(k) ?? EMPTY, rConcat(c, v)));
  }
  eq.constant = rUnion(eq.constant, rConcat(c, src.constant));
}

function formatEquation(e: Equation): string {
  const parts: string[] = [];
  for (const [k, v] of e.coeffs) parts.push(`${v === EPS ? "" : v}${k}`);
  if (e.constant !== EMPTY) parts.push(e.constant);
  return `${e.variable} = ${parts.join(" + ") || EMPTY}`;
}
