/**
 * Couche de persistance unifiée.
 *
 * Si Supabase est configuré, les données sont stockées dans PostgreSQL.
 * Sinon — ou si une requête échoue (schéma non encore appliqué, réseau…) —
 * on bascule automatiquement sur localStorage afin que l'application reste
 * pleinement fonctionnelle.
 */
import { Automaton, Workflow } from "@/core/types";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/client";

export interface ProjectRecord {
  id: string;
  name: string;
  description?: string | null;
  updated_at: string;
}

export interface AutomatonRecord {
  id: string;
  project_id: string;
  name: string;
  kind: Automaton["kind"];
  source: "manual" | "import" | "result" | "example";
  automaton: Automaton;
  updated_at: string;
}

const LS_KEY = "automatelab:db:v1";

interface LocalDb {
  projects: ProjectRecord[];
  automata: AutomatonRecord[];
  workflows: { id: string; project_id: string; name: string; graph: Workflow }[];
}

function readLocal(): LocalDb {
  if (typeof window === "undefined") {
    return { projects: [], automata: [], workflows: [] };
  }
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { projects: [], automata: [], workflows: [] };
    return JSON.parse(raw) as LocalDb;
  } catch {
    return { projects: [], automata: [], workflows: [] };
  }
}

function writeLocal(db: LocalDb) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(db));
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const persistence = {
  configured: isSupabaseConfigured,

  async listProjects(): Promise<ProjectRecord[]> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from("projects")
          .select("id,name,description,updated_at")
          .order("updated_at", { ascending: false });
        if (error) throw error;
        return data as ProjectRecord[];
      } catch {
        /* repli local */
      }
    }
    return readLocal().projects.sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at),
    );
  },

  async createProject(name: string, description?: string): Promise<ProjectRecord> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from("projects")
          .insert({ name, description })
          .select("id,name,description,updated_at")
          .single();
        if (error) throw error;
        return data as ProjectRecord;
      } catch {
        /* repli local */
      }
    }
    const db = readLocal();
    const rec: ProjectRecord = {
      id: uuid(),
      name,
      description,
      updated_at: new Date().toISOString(),
    };
    db.projects.push(rec);
    writeLocal(db);
    return rec;
  },

  async deleteProject(id: string): Promise<void> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { error } = await sb.from("projects").delete().eq("id", id);
        if (error) throw error;
        return;
      } catch {
        /* repli local */
      }
    }
    const db = readLocal();
    db.projects = db.projects.filter((p) => p.id !== id);
    db.automata = db.automata.filter((a) => a.project_id !== id);
    db.workflows = db.workflows.filter((w) => w.project_id !== id);
    writeLocal(db);
  },

  async listAutomata(projectId: string): Promise<AutomatonRecord[]> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from("automata")
          .select("*")
          .eq("project_id", projectId)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        return (data as Record<string, unknown>[]).map((row) => ({
          id: row.id as string,
          project_id: row.project_id as string,
          name: row.name as string,
          kind: row.kind as Automaton["kind"],
          source: row.source as AutomatonRecord["source"],
          updated_at: row.updated_at as string,
          automaton: {
            id: row.id as string,
            name: row.name as string,
            kind: row.kind as Automaton["kind"],
            alphabet: row.alphabet as string[],
            states: row.states as Automaton["states"],
            transitions: row.transitions as Automaton["transitions"],
          },
        }));
      } catch {
        /* repli local */
      }
    }
    return readLocal().automata.filter((a) => a.project_id === projectId);
  },

  async saveAutomaton(
    projectId: string,
    automaton: Automaton,
    source: AutomatonRecord["source"] = "manual",
  ): Promise<AutomatonRecord> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from("automata")
          .insert({
            project_id: projectId,
            name: automaton.name,
            kind: automaton.kind,
            source,
            alphabet: automaton.alphabet,
            states: automaton.states,
            transitions: automaton.transitions,
          })
          .select("*")
          .single();
        if (error) throw error;
        const row = data as Record<string, unknown>;
        return {
          id: row.id as string,
          project_id: projectId,
          name: automaton.name,
          kind: automaton.kind,
          source,
          automaton: { ...automaton, id: row.id as string },
          updated_at: row.updated_at as string,
        };
      } catch {
        /* repli local */
      }
    }
    const db = readLocal();
    const rec: AutomatonRecord = {
      id: uuid(),
      project_id: projectId,
      name: automaton.name,
      kind: automaton.kind,
      source,
      automaton,
      updated_at: new Date().toISOString(),
    };
    db.automata.push(rec);
    writeLocal(db);
    return rec;
  },

  async saveWorkflow(projectId: string, workflow: Workflow): Promise<void> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { error } = await sb.from("workflows").insert({
          project_id: projectId,
          name: workflow.name,
          graph: { nodes: workflow.nodes, edges: workflow.edges },
        });
        if (error) throw error;
        return;
      } catch {
        /* repli local */
      }
    }
    const db = readLocal();
    db.workflows.push({
      id: uuid(),
      project_id: projectId,
      name: workflow.name,
      graph: workflow,
    });
    writeLocal(db);
  },
};
