import {
  FileInput,
  Regex,
  Radar,
  CheckCircle2,
  Scissors,
  SquarePlus,
  GitMerge,
  GitFork,
  CircleDot,
  Minimize2,
  Hash,
  Workflow,
  Network,
  FlipHorizontal2,
  Download,
  type LucideIcon,
} from "lucide-react";
import { OperationCategory } from "@/core/operations";

export const OP_ICONS: Record<string, LucideIcon> = {
  FileInput,
  Regex,
  Radar,
  CheckCircle2,
  Scissors,
  SquarePlus,
  GitMerge,
  GitFork,
  CircleDot,
  Minimize2,
  Hash,
  Workflow,
  Network,
  FlipHorizontal2,
  Download,
};

export const CATEGORY_STYLE: Record<
  OperationCategory,
  { badge: "primary" | "accent" | "cyan" | "warning" | "success" | "default"; color: string }
> = {
  entrée: { badge: "cyan", color: "#5b9dff" },
  analyse: { badge: "success", color: "#2bd4a4" },
  conversion: { badge: "accent", color: "#c15bff" },
  regex: { badge: "warning", color: "#f2b53c" },
  clôture: { badge: "primary", color: "#ff6d5a" },
  sortie: { badge: "default", color: "#8a90a2" },
};
