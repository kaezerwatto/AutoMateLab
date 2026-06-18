/**
 * Client Supabase côté navigateur.
 *
 * Le client n'est créé que si les variables d'environnement sont présentes.
 * Sinon `getSupabaseClient()` renvoie `null` et l'application bascule
 * automatiquement sur la persistance locale (localStorage).
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "automatelab";

let cached: SupabaseClient | null = null;
let initialized = false;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && !url.includes("votre-projet"));
}

export function getSupabaseClient(): SupabaseClient | null {
  if (initialized) return cached;
  initialized = true;
  if (!isSupabaseConfigured()) {
    cached = null;
    return null;
  }
  cached = createBrowserClient(url!, anonKey!, {
    db: { schema },
  }) as unknown as SupabaseClient;
  return cached;
}
