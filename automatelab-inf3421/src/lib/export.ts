/**
 * Helpers d'export : JSON, image PNG/SVG (via html-to-image) et texte de trace.
 */
import { toPng, toSvg } from "html-to-image";
import { saveAs } from "file-saver";
import { Automaton, AlgorithmResult, TraceStep } from "@/core/types";

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  saveAs(blob, filename.endsWith(".json") ? filename : `${filename}.json`);
}

export function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  saveAs(blob, filename.endsWith(".txt") ? filename : `${filename}.txt`);
}

export async function exportElementPng(el: HTMLElement, filename: string) {
  const dataUrl = await toPng(el, {
    backgroundColor: "#14151a",
    pixelRatio: 2,
    filter: (node) =>
      !(node instanceof HTMLElement && node.classList?.contains("react-flow__minimap")),
  });
  saveAs(dataUrl, filename.endsWith(".png") ? filename : `${filename}.png`);
}

export async function exportElementSvg(el: HTMLElement, filename: string) {
  const dataUrl = await toSvg(el, { backgroundColor: "#14151a" });
  saveAs(dataUrl, filename.endsWith(".svg") ? filename : `${filename}.svg`);
}

/** Transforme une trace d'algorithme en texte prêt à coller dans un rapport. */
export function traceToReportText(
  title: string,
  steps: TraceStep[],
  warnings: string[] = [],
): string {
  const lines: string[] = [`# ${title}`, ""];
  steps.forEach((s, i) => {
    lines.push(`## ${s.title || `Étape ${i + 1}`}`);
    if (s.description) lines.push(s.description);
    if (s.table && s.table.length) {
      const cols = Object.keys(s.table[0]);
      lines.push("", cols.join(" | "), cols.map(() => "---").join(" | "));
      for (const row of s.table) {
        lines.push(cols.map((c) => String(row[c] ?? "")).join(" | "));
      }
    }
    lines.push("");
  });
  if (warnings.length) {
    lines.push("## Avertissements");
    for (const w of warnings) lines.push(`- ${w}`);
  }
  return lines.join("\n");
}

export function automatonToReportText(a: Automaton): string {
  const lines = [
    `Automate : ${a.name} (${a.kind})`,
    `Alphabet : { ${a.alphabet.join(", ")} }`,
    `États : ${a.states.map((s) => s.label).join(", ")}`,
    `Initial : ${a.states.filter((s) => s.initial).map((s) => s.label).join(", ") || "—"}`,
    `Finaux : ${a.states.filter((s) => s.final).map((s) => s.label).join(", ") || "—"}`,
    "",
    "Transitions :",
    ...a.transitions.map((t) => {
      const from = a.states.find((s) => s.id === t.from)?.label ?? t.from;
      const to = a.states.find((s) => s.id === t.to)?.label ?? t.to;
      return `  ${from} --${t.symbol}--> ${to}`;
    }),
  ];
  return lines.join("\n");
}

export type { AlgorithmResult };
