-- =====================================================================
--  AutoMateLab INF3421 — Données d'amorçage (seed)
--  À exécuter après schema.sql.
-- =====================================================================
set search_path to automatelab, public;

-- Projet de démonstration ---------------------------------------------
insert into automatelab.projects (id, name, description, slug, owner)
values (
  '00000000-0000-0000-0000-000000000001',
  'Démonstration INF3421',
  'Projet d''exemple : (a+b)*abb, déterminisation et minimisation.',
  'demo-inf3421',
  'AZAB A RANGA FRANCK MIGUEL'
)
on conflict (id) do nothing;

-- Automate AFN (a+b)*abb ----------------------------------------------
insert into automatelab.automata (project_id, name, kind, source, alphabet, states, transitions)
values (
  '00000000-0000-0000-0000-000000000001',
  'AFN (a+b)*abb',
  'NFA',
  'example',
  '["a","b"]'::jsonb,
  '[
    {"id":"q0","label":"q0","initial":true,"final":false,"x":80,"y":120},
    {"id":"q1","label":"q1","initial":false,"final":false,"x":260,"y":120},
    {"id":"q2","label":"q2","initial":false,"final":false,"x":440,"y":120},
    {"id":"q3","label":"q3","initial":false,"final":true,"x":620,"y":120}
  ]'::jsonb,
  '[
    {"id":"t1","from":"q0","to":"q0","symbol":"a"},
    {"id":"t2","from":"q0","to":"q0","symbol":"b"},
    {"id":"t3","from":"q0","to":"q1","symbol":"a"},
    {"id":"t4","from":"q1","to":"q2","symbol":"b"},
    {"id":"t5","from":"q2","to":"q3","symbol":"b"}
  ]'::jsonb
)
on conflict do nothing;

-- Workflow de démonstration -------------------------------------------
insert into automatelab.workflows (project_id, name, graph)
values (
  '00000000-0000-0000-0000-000000000001',
  'AFN → AFD → Minimiser → Export',
  '{
    "nodes": [
      {"id":"n1","type":"inputAutomaton","position":{"x":80,"y":120}},
      {"id":"n2","type":"nfaToDfa","position":{"x":340,"y":120}},
      {"id":"n3","type":"minimize","position":{"x":600,"y":120}},
      {"id":"n4","type":"export","position":{"x":860,"y":120}}
    ],
    "edges": [
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"}
    ]
  }'::jsonb
)
on conflict do nothing;
