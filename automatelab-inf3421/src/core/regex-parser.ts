/**
 * Analyseur d'expressions régulières → AST.
 *
 * Syntaxe supportée :
 *   - union           : `+` ou `|`
 *   - concaténation   : implicite (juxtaposition)
 *   - étoile          : `*`
 *   - une ou plus     : `⁺` ou suffixe ` + ` impossible : on utilise `#`? non.
 *   - optionnel       : `?`
 *   - groupes         : `( … )`
 *   - mot vide        : `ε` ou `&`
 *   - langage vide    : `∅`
 *
 * Note : `+` est l'union (comme dans le cours). Pour « une ou plusieurs fois »
 * on accepte le suffixe `⁺`.
 */
import { RegexAST } from "./types";

class Parser {
  private pos = 0;
  constructor(private readonly src: string) {}

  parse(): RegexAST {
    if (this.src.trim() === "") return { type: "epsilon" };
    const node = this.union();
    if (this.pos < this.src.length) {
      throw new Error(
        `Caractère inattendu « ${this.src[this.pos]} » en position ${this.pos}.`,
      );
    }
    return node;
  }

  private peek(): string | undefined {
    return this.src[this.pos];
  }

  private skipSpaces() {
    while (this.peek() === " ") this.pos += 1;
  }

  private union(): RegexAST {
    let left = this.concat();
    this.skipSpaces();
    while (this.peek() === "+" || this.peek() === "|") {
      this.pos += 1;
      const right = this.concat();
      left = { type: "union", left, right };
      this.skipSpaces();
    }
    return left;
  }

  private concat(): RegexAST {
    let left: RegexAST | null = null;
    this.skipSpaces();
    while (
      this.peek() !== undefined &&
      this.peek() !== ")" &&
      this.peek() !== "+" &&
      this.peek() !== "|"
    ) {
      if (this.peek() === " ") {
        this.skipSpaces();
        continue;
      }
      const atom = this.unary();
      left = left === null ? atom : { type: "concat", left, right: atom };
      this.skipSpaces();
    }
    if (left === null) {
      throw new Error("Expression vide attendue à cet endroit.");
    }
    return left;
  }

  private unary(): RegexAST {
    let node = this.atom();
    for (;;) {
      const c = this.peek();
      if (c === "*") {
        this.pos += 1;
        node = { type: "star", child: node };
      } else if (c === "⁺") {
        this.pos += 1;
        node = { type: "plus", child: node };
      } else if (c === "?") {
        this.pos += 1;
        node = { type: "optional", child: node };
      } else break;
    }
    return node;
  }

  private atom(): RegexAST {
    const c = this.peek();
    if (c === "(") {
      this.pos += 1;
      const node = this.union();
      if (this.peek() !== ")") {
        throw new Error("Parenthèse fermante « ) » manquante.");
      }
      this.pos += 1;
      return node;
    }
    if (c === "ε" || c === "&") {
      this.pos += 1;
      return { type: "epsilon" };
    }
    if (c === "∅") {
      this.pos += 1;
      return { type: "empty" };
    }
    if (c === undefined || c === ")" || c === "*" || c === "+" || c === "|") {
      throw new Error(`Symbole attendu, trouvé « ${c ?? "fin"} ».`);
    }
    this.pos += 1;
    return { type: "symbol", value: c };
  }
}

export function parseRegex(src: string): RegexAST {
  return new Parser(src).parse();
}

/** Réécrit un AST en chaîne lisible (avec parenthèses minimales). */
export function regexToString(ast: RegexAST): string {
  switch (ast.type) {
    case "empty":
      return "∅";
    case "epsilon":
      return "ε";
    case "symbol":
      return ast.value ?? "?";
    case "concat":
      return `${wrap(ast.left!, ["union"])}${wrap(ast.right!, ["union"])}`;
    case "union":
      return `${regexToString(ast.left!)}+${regexToString(ast.right!)}`;
    case "star":
      return `${wrap(ast.child!, ["union", "concat"])}*`;
    case "plus":
      return `${wrap(ast.child!, ["union", "concat"])}⁺`;
    case "optional":
      return `${wrap(ast.child!, ["union", "concat"])}?`;
  }
}

function wrap(ast: RegexAST, parenthesizeTypes: string[]): string {
  const s = regexToString(ast);
  return parenthesizeTypes.includes(ast.type) ? `(${s})` : s;
}

/** Collecte l'alphabet (symboles distincts) d'un AST. */
export function regexAlphabet(ast: RegexAST): string[] {
  const set = new Set<string>();
  const walk = (n: RegexAST) => {
    if (n.type === "symbol" && n.value) set.add(n.value);
    if (n.left) walk(n.left);
    if (n.right) walk(n.right);
    if (n.child) walk(n.child);
  };
  walk(ast);
  return [...set].sort();
}
