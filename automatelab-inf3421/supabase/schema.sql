-- =====================================================================
--  AutoMateLab INF3421 — Schéma PostgreSQL / Supabase
-- ---------------------------------------------------------------------
--  Base de données complète pour persister les projets, automates,
--  workflows (canvas type n8n), exécutions, résultats d'algorithmes,
--  traces pédagogiques et exports.
--
--  À exécuter dans l'éditeur SQL de Supabase (ou via `psql`).
-- =====================================================================

-- Extensions ----------------------------------------------------------
create extension if not exists "pgcrypto";        -- gen_random_uuid()
create extension if not exists "uuid-ossp";

-- Schéma dédié --------------------------------------------------------
create schema if not exists automatelab;
set search_path to automatelab, public;

-- =====================================================================
--  Types énumérés
-- =====================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'automaton_kind') then
    create type automaton_kind as enum ('DFA', 'NFA', 'ENFA');
  end if;
  if not exists (select 1 from pg_type where typname = 'automaton_source') then
    create type automaton_source as enum ('manual', 'import', 'result', 'example');
  end if;
  if not exists (select 1 from pg_type where typname = 'run_status') then
    create type run_status as enum ('idle', 'running', 'success', 'error');
  end if;
  if not exists (select 1 from pg_type where typname = 'export_kind') then
    create type export_kind as enum ('json', 'png', 'svg', 'text');
  end if;
end$$;

-- =====================================================================
--  Fonction utilitaire : mise à jour automatique de updated_at
-- =====================================================================
create or replace function automatelab.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================================
--  Table : projects
--  Un projet regroupe automates, workflows et exports.
-- =====================================================================
create table if not exists automatelab.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 160),
  description text,
  slug        text unique,
  owner       text,                       -- identifiant libre (pas d'auth obligatoire)
  is_public   boolean not null default true,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table automatelab.projects is 'Projet AutoMateLab : conteneur d''automates et de workflows.';

drop trigger if exists trg_projects_updated on automatelab.projects;
create trigger trg_projects_updated
  before update on automatelab.projects
  for each row execute function automatelab.set_updated_at();

-- =====================================================================
--  Table : automata
--  Stockage canonique d'un automate (états/transitions en JSONB).
-- =====================================================================
create table if not exists automatelab.automata (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references automatelab.projects(id) on delete cascade,
  name        text not null,
  kind        automaton_kind not null default 'NFA',
  source      automaton_source not null default 'manual',
  alphabet    jsonb not null default '[]'::jsonb,   -- string[]
  states      jsonb not null default '[]'::jsonb,   -- State[]
  transitions jsonb not null default '[]'::jsonb,   -- Transition[]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint alphabet_is_array    check (jsonb_typeof(alphabet) = 'array'),
  constraint states_is_array      check (jsonb_typeof(states) = 'array'),
  constraint transitions_is_array check (jsonb_typeof(transitions) = 'array')
);

comment on table automatelab.automata is 'Automates finis (AFD/AFN/ε-AFN) sérialisés en JSONB.';

create index if not exists idx_automata_project on automatelab.automata(project_id);
create index if not exists idx_automata_kind    on automatelab.automata(kind);

drop trigger if exists trg_automata_updated on automatelab.automata;
create trigger trg_automata_updated
  before update on automatelab.automata
  for each row execute function automatelab.set_updated_at();

-- =====================================================================
--  Table : workflows
--  Pipeline type n8n (nodes + edges) sérialisé en JSONB.
-- =====================================================================
create table if not exists automatelab.workflows (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references automatelab.projects(id) on delete cascade,
  name        text not null,
  graph       jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table automatelab.workflows is 'Workflows d''opérations (canvas type n8n).';

create index if not exists idx_workflows_project on automatelab.workflows(project_id);

drop trigger if exists trg_workflows_updated on automatelab.workflows;
create trigger trg_workflows_updated
  before update on automatelab.workflows
  for each row execute function automatelab.set_updated_at();

-- =====================================================================
--  Table : workflow_runs
--  Historique d'exécution d'un workflow.
-- =====================================================================
create table if not exists automatelab.workflow_runs (
  id            uuid primary key default gen_random_uuid(),
  workflow_id   uuid not null references automatelab.workflows(id) on delete cascade,
  status        run_status not null default 'idle',
  node_results  jsonb not null default '{}'::jsonb,
  log           jsonb not null default '[]'::jsonb,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

comment on table automatelab.workflow_runs is 'Traces d''exécution des workflows.';

create index if not exists idx_runs_workflow on automatelab.workflow_runs(workflow_id);

-- =====================================================================
--  Table : operation_results
--  Résultat + trace pédagogique d'une opération unitaire (Studio).
-- =====================================================================
create table if not exists automatelab.operation_results (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references automatelab.projects(id) on delete cascade,
  operation   text not null,
  input_ref   uuid,                       -- automate source éventuel
  result      jsonb,                      -- Automaton | string
  steps       jsonb not null default '[]'::jsonb,
  warnings    jsonb not null default '[]'::jsonb,
  metrics     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

comment on table automatelab.operation_results is 'Résultats d''algorithmes avec trace pédagogique.';

create index if not exists idx_opresults_project on automatelab.operation_results(project_id);

-- =====================================================================
--  Table : exports
--  Fichiers/textes exportés pour le rapport.
-- =====================================================================
create table if not exists automatelab.exports (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references automatelab.projects(id) on delete cascade,
  kind        export_kind not null,
  filename    text not null,
  payload     text,                        -- contenu (texte/JSON) ou URL
  created_at  timestamptz not null default now()
);

comment on table automatelab.exports is 'Exports (PNG/SVG/JSON/texte) générés pour le rapport.';

create index if not exists idx_exports_project on automatelab.exports(project_id);

-- =====================================================================
--  Vue : tableau de bord d'un projet
-- =====================================================================
create or replace view automatelab.project_overview as
select
  p.id,
  p.name,
  p.description,
  p.updated_at,
  (select count(*) from automatelab.automata a where a.project_id = p.id)  as automata_count,
  (select count(*) from automatelab.workflows w where w.project_id = p.id) as workflow_count,
  (select count(*) from automatelab.exports e where e.project_id = p.id)   as export_count
from automatelab.projects p;

-- =====================================================================
--  Sécurité : Row Level Security
--  Le TP n'exige pas d'authentification : on active RLS avec des
--  politiques permissives (anon + authenticated). À durcir si besoin.
-- =====================================================================
alter table automatelab.projects          enable row level security;
alter table automatelab.automata           enable row level security;
alter table automatelab.workflows          enable row level security;
alter table automatelab.workflow_runs      enable row level security;
alter table automatelab.operation_results  enable row level security;
alter table automatelab.exports            enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'projects','automata','workflows','workflow_runs','operation_results','exports'
  ]
  loop
    execute format('drop policy if exists %I on automatelab.%I;', t || '_all', t);
    execute format(
      'create policy %I on automatelab.%I for all to anon, authenticated using (true) with check (true);',
      t || '_all', t
    );
  end loop;
end$$;

-- Exposition du schéma à l'API REST de Supabase ----------------------
grant usage on schema automatelab to anon, authenticated;
grant all on all tables in schema automatelab to anon, authenticated;
grant all on all sequences in schema automatelab to anon, authenticated;
alter default privileges in schema automatelab
  grant all on tables to anon, authenticated;

-- NB : pensez à ajouter « automatelab » dans
--      Project Settings → API → Exposed schemas.
