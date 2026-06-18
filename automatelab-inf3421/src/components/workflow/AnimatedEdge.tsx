"use client";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export interface AnimatedEdgeData {
  color?: string;
  /** Active les tirets animés le long du fil. */
  flow?: boolean;
  [key: string]: unknown;
}

/**
 * Arête courbe façon n8n : un trait bézier en tirets animés pour matérialiser
 * le sens du flux sans masquer le canvas.
 */
export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const d = (data ?? {}) as AnimatedEdgeData;
  const color = d.color ?? "var(--color-edge)";

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.35,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: color,
        strokeWidth: selected ? 3 : 2,
        strokeDasharray: d.flow === false ? undefined : "9 7",
        animation: d.flow === false ? undefined : "flow-dash 0.85s linear infinite",
        filter: selected ? `drop-shadow(0 0 5px ${color})` : undefined,
      }}
    />
  );
}
