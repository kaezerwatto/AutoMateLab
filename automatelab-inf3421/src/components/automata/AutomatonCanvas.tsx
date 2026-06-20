"use client";
import { useMemo, useCallback } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  MarkerType,
  ConnectionMode,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import { Automaton } from "@/core/types";
import { groupedEdges } from "@/core/graph-utils";
import { StateNode } from "./StateNode";
import { TransitionEdge } from "./TransitionEdge";

const nodeTypes = { state: StateNode };
const edgeTypes = { transition: TransitionEdge };

export interface AutomatonCanvasProps {
  automaton: Automaton;
  highlight?: string[];
  dimNonHighlighted?: boolean;
  selectedStateId?: string;
  editable?: boolean;
  onMoveState?: (id: string, x: number, y: number) => void;
  onConnectStates?: (from: string, to: string, symbol: string) => void;
  onSelectState?: (id?: string) => void;
  onSelectTransition?: (id?: string) => void;
  className?: string;
}

function CanvasInner({
  automaton,
  highlight = [],
  dimNonHighlighted = false,
  selectedStateId,
  editable = false,
  onMoveState,
  onConnectStates,
  onSelectState,
  onSelectTransition,
}: AutomatonCanvasProps) {
  const highlightSet = useMemo(() => new Set(highlight), [highlight]);

  const nodes: Node[] = useMemo(
    () =>
      automaton.states.map((s) => ({
        id: s.id,
        type: "state",
        position: { x: s.x ?? 0, y: s.y ?? 0 },
        data: {
          label: s.label,
          initial: s.initial,
          final: s.final,
          highlighted: highlightSet.has(s.id),
          dimmed: dimNonHighlighted && highlightSet.size > 0 && !highlightSet.has(s.id),
          sink: s.label === "⊥",
        },
        selected: s.id === selectedStateId,
        draggable: editable,
      })),
    [automaton.states, highlightSet, dimNonHighlighted, selectedStateId, editable],
  );

  const edges: Edge[] = useMemo(
    () =>
      groupedEdges(automaton).map((g) => ({
        id: `${g.from}->${g.to}`,
        source: g.from,
        target: g.to,
        type: "transition",
        data: { label: g.symbols.join(", "), selfLoop: g.from === g.to },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#707688", width: 18, height: 18 },
      })),
    [automaton],
  );

  const handleConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || !onConnectStates) return;
      const symbol = window.prompt("Symbole de la transition (ε pour spontanée) :", "a");
      if (symbol === null) return;
      onConnectStates(c.source, c.target, symbol.trim() || "a");
    },
    [onConnectStates],
  );

  return (
    <ReactFlow
      className="h-full w-full"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionMode={ConnectionMode.Loose}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.2}
      maxZoom={2.5}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={editable}
      nodesConnectable={editable}
      elementsSelectable
      onConnect={handleConnect}
      onNodeDragStop={(_, node) => onMoveState?.(node.id, node.position.x, node.position.y)}
      onNodeClick={(_, node) => onSelectState?.(node.id)}
      onEdgeClick={(_, edge) => onSelectTransition?.(edge.id)}
      onPaneClick={() => {
        onSelectState?.(undefined);
        onSelectTransition?.(undefined);
      }}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#2c2f37" />
      <Controls className="!bottom-4 !left-4" showInteractive={false} />
    </ReactFlow>
  );
}

export function AutomatonCanvas(props: AutomatonCanvasProps) {
  return (
    <div className={props.className ?? "h-full min-h-0 w-full"}>
      <ReactFlowProvider>
        <CanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
