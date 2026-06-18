"use client";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export interface TransitionEdgeData {
  label: string;
  selfLoop?: boolean;
  [key: string]: unknown;
}

export function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const d = (data ?? {}) as TransitionEdgeData;
  const stroke = selected ? "#ff6d5a" : "#707688";

  // Boucle sur soi-même
  if (d.selfLoop || (Math.abs(sourceX - targetX) < 4 && Math.abs(sourceY - targetY) < 4)) {
    const loopPath = `M ${sourceX} ${sourceY} C ${sourceX - 50} ${sourceY - 70}, ${sourceX + 50} ${sourceY - 70}, ${targetX} ${targetY}`;
    return (
      <>
        <BaseEdge id={id} path={loopPath} markerEnd={markerEnd} style={{ stroke }} />
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${sourceX}px, ${sourceY - 64}px)`,
            }}
            className="pointer-events-none absolute rounded-md bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-xs font-semibold text-[var(--color-primary-hover)] ring-1 ring-[var(--color-border)]"
          >
            {d.label}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.3,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke }} />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          className="pointer-events-none absolute rounded-md bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-xs font-semibold text-[var(--color-primary-hover)] ring-1 ring-[var(--color-border)]"
        >
          {d.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
