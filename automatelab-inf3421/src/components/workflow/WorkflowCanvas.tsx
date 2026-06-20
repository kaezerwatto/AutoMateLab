"use client";
import { useMemo, useCallback } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import { OperationNode } from "./OperationNode";
import { AnimatedEdge } from "./AnimatedEdge";
import { useWorkflowStore } from "@/store/workflow-store";

const nodeTypes = { operation: OperationNode };
const edgeTypes = { animated: AnimatedEdge };

function Inner() {
  const { nodes, edges, selectedNodeId, moveNode, connect, select, removeNode, disconnect } =
    useWorkflowStore();

  const rfNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: "operation",
        position: n.position,
        data: { ...n.data, type: n.type },
        selected: n.id === selectedNodeId,
      })),
    [nodes, selectedNodeId],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => {
        const color = "#ff6d5a";
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: "animated",
          data: { color, flow: true },
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
        };
      }),
    [edges],
  );

  const onConnect = useCallback(
    (c: Connection) => c.source && c.target && connect(c.source, c.target),
    [connect],
  );

  return (
    <ReactFlow
      className="h-full w-full"
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      onConnect={onConnect}
      onNodeDragStop={(_, n) => moveNode(n.id, n.position.x, n.position.y)}
      onNodeClick={(_, n) => select(n.id)}
      onPaneClick={() => select(undefined)}
      onNodesDelete={(deleted) => deleted.forEach((n) => removeNode(n.id))}
      onEdgesDelete={(deleted) => deleted.forEach((e) => disconnect(e.id))}
      defaultEdgeOptions={{ type: "animated", data: { color: "#ff6d5a", flow: true } }}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#2c2f37" />
      <Controls className="!bottom-4 !left-4" showInteractive={false} />
    </ReactFlow>
  );
}

export function WorkflowCanvas({ className }: { className?: string }) {
  return (
    <div className={className ?? "h-full min-h-0 w-full"}>
      <ReactFlowProvider>
        <Inner />
      </ReactFlowProvider>
    </div>
  );
}
