"use client";
import { useMemo, useState } from "react";
import { Flag, Play, Trash2, CheckCircle2, XCircle, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Separator } from "@/components/ui/misc";
import { useAutomatonStore } from "@/store/automaton-store";
import { validateAutomaton } from "@/core/validators";

export function AutomatonInspector() {
  const {
    current,
    selectedStateId,
    selectedTransitionId,
    rename,
    setAlphabet,
    addState,
    updateState,
    removeState,
    addTransition,
    updateTransition,
    removeTransition,
    select,
  } = useAutomatonStore();

  const selectedState = current.states.find((s) => s.id === selectedStateId);
  const selectedTransition = current.transitions.find((t) => t.id === selectedTransitionId);
  const report = useMemo(() => validateAutomaton(current), [current]);

  // Formulaire d'ajout de transition (alternative au glisser-déposer).
  const [tFrom, setTFrom] = useState("");
  const [tTo, setTTo] = useState("");
  const [tSymbol, setTSymbol] = useState("a");

  const selectCls =
    "h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none";

  const labelOf = (id: string) => current.states.find((s) => s.id === id)?.label ?? id;

  const handleAddTransition = () => {
    const from = tFrom || current.states[0]?.id;
    const to = tTo || from;
    if (!from || !to) return;
    addTransition(from, to, tSymbol);
    setTSymbol("a");
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* Propriétés générales */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Automate</h3>
          <Badge variant="primary">{current.kind}</Badge>
        </div>
        <div>
          <Label>Nom</Label>
          <Input value={current.name} onChange={(e) => rename(e.target.value)} />
        </div>
        <div>
          <Label>Alphabet (séparé par des virgules)</Label>
          <Input
            value={current.alphabet.join(", ")}
            onChange={(e) => setAlphabet(e.target.value.split(","))}
            placeholder="a, b"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-center">
            <p className="text-[10px] uppercase text-[var(--color-faint)]">États</p>
            <p className="font-semibold text-[var(--color-text)]">{current.states.length}</p>
          </div>
          <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-center">
            <p className="text-[10px] uppercase text-[var(--color-faint)]">Transitions</p>
            <p className="font-semibold text-[var(--color-text)]">{current.transitions.length}</p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => addState()} className="w-full">
          <Plus size={14} /> Ajouter un état
        </Button>
      </section>

      <Separator />

      {/* État sélectionné */}
      {selectedState ? (
        <section className="space-y-3 fade-up">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">
            État sélectionné
          </h3>
          <div>
            <Label>Étiquette</Label>
            <Input
              value={selectedState.label}
              onChange={(e) => updateState(selectedState.id, { label: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedState.initial ? "primary" : "secondary"}
              onClick={() => updateState(selectedState.id, { initial: !selectedState.initial })}
              className="flex-1"
            >
              <Play size={14} /> Initial
            </Button>
            <Button
              size="sm"
              variant={selectedState.final ? "primary" : "secondary"}
              onClick={() => updateState(selectedState.id, { final: !selectedState.final })}
              className="flex-1"
            >
              <Flag size={14} /> Final
            </Button>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => removeState(selectedState.id)}
            className="w-full"
          >
            <Trash2 size={14} /> Supprimer l’état
          </Button>
        </section>
      ) : selectedTransition ? (
        <section className="space-y-3 fade-up">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Transition sélectionnée</h3>
          <p className="text-xs text-[var(--color-muted)]">
            {current.states.find((s) => s.id === selectedTransition.from)?.label} →{" "}
            {current.states.find((s) => s.id === selectedTransition.to)?.label}
          </p>
          <div>
            <Label>Symbole (ε pour spontanée)</Label>
            <Input
              value={selectedTransition.symbol}
              onChange={(e) => updateTransition(selectedTransition.id, { symbol: e.target.value })}
            />
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => removeTransition(selectedTransition.id)}
            className="w-full"
          >
            <Trash2 size={14} /> Supprimer la transition
          </Button>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-center text-xs text-[var(--color-muted)]">
          <Info size={16} className="mx-auto mb-1 text-[var(--color-faint)]" />
          Sélectionnez un état ou une transition. Glissez d’un état à l’autre pour créer une transition.
        </section>
      )}

      <Separator />

      {/* Gestion des transitions par formulaire */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Transitions</h3>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <Label>De</Label>
            <select className={selectCls} value={tFrom} onChange={(e) => setTFrom(e.target.value)}>
              <option value="">{current.states[0] ? labelOf(current.states[0].id) : "—"}</option>
              {current.states.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="pb-2 text-center text-[var(--color-faint)]">→</div>
          <div>
            <Label>Vers</Label>
            <select className={selectCls} value={tTo} onChange={(e) => setTTo(e.target.value)}>
              <option value="">{current.states[0] ? labelOf(current.states[0].id) : "—"}</option>
              {current.states.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label>Symbole (ε pour spontanée)</Label>
            <Input
              value={tSymbol}
              onChange={(e) => setTSymbol(e.target.value)}
              placeholder="a"
              className="font-mono"
            />
          </div>
          <Button size="sm" variant="primary" onClick={handleAddTransition} disabled={current.states.length === 0}>
            <Plus size={14} /> Ajouter
          </Button>
        </div>

        {current.transitions.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {current.transitions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs"
              >
                <button
                  onClick={() => select(undefined, t.id)}
                  className="min-w-0 flex-1 truncate text-left font-mono text-[var(--color-text)] hover:text-[var(--color-primary)]"
                >
                  {labelOf(t.from)} —{t.symbol}→ {labelOf(t.to)}
                </button>
                <button
                  onClick={() => removeTransition(t.id)}
                  className="shrink-0 text-[var(--color-faint)] hover:text-[var(--color-danger)]"
                  aria-label="Supprimer la transition"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      {/* Validation */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          {report.valid ? (
            <CheckCircle2 size={16} className="text-[var(--color-success)]" />
          ) : (
            <XCircle size={16} className="text-[var(--color-danger)]" />
          )}
          <h3 className="text-sm font-semibold text-[var(--color-text)]">
            Validation {report.valid ? "OK" : "à corriger"}
          </h3>
        </div>
        {report.issues.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)]">Aucun problème détecté.</p>
        ) : (
          <ul className="space-y-1">
            {report.issues.map((issue, i) => (
              <li
                key={i}
                className={
                  issue.level === "error"
                    ? "text-xs text-[var(--color-danger)]"
                    : "text-xs text-[var(--color-warning)]"
                }
              >
                • {issue.message}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
