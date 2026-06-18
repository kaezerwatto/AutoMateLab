<div align="center">

<img src="public/icon.svg" alt="AutomateLab" width="96" />

# AutoMateLab INF3421

**Laboratoire web de manipulation d'automates finis et d'expressions régulières.**

Visualiser · Convertir · Analyser — dans une interface claire inspirée des éditeurs de workflow.

<br/>

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)
![React Flow](https://img.shields.io/badge/React%20Flow-12-FF4F81)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-22%20tests-6E9F18?logo=vitest&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.3-000000?logo=bun&logoColor=white)

</div>

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Aperçu des modules](#2-aperçu-des-modules)
3. [Stack technique](#3-stack-technique)
4. [Architecture du projet](#4-architecture-du-projet)
5. [Modèle de données](#5-modèle-de-données)
6. [Diagrammes](#6-diagrammes)
7. [Algorithmes implémentés](#7-algorithmes-implémentés)
8. [Installation (Bun)](#8-installation-bun)
9. [Configuration de la base Supabase](#9-configuration-de-la-base-supabase)
10. [Guide d'utilisation pas à pas](#10-guide-dutilisation-pas-à-pas)
11. [Tests](#11-tests)
12. [Build et déploiement](#12-build-et-déploiement)
13. [Auteurs et participation](#13-auteurs-et-participation)

---

## 1. Présentation

**AutoMateLab** est une application **Next.js (App Router)** développée pour l'UE
**INF3421 — Langages formels et compilation** de l'Université de Yaoundé I. Elle
transforme les notions théoriques du cours (AFD, AFN, ε-AFN, expressions
régulières) en un **outil pratique, visuel et pédagogique**.

L'utilisateur construit un automate sur un **canvas interactif**, enchaîne des
opérations comme des **nœuds de workflow**, observe les **graphes résultats**, lit
des **traces pédagogiques** détaillées et **exporte** le tout pour son rapport.

> Le moteur algorithmique (`src/core`) est **du TypeScript pur, sans React**, ce
> qui le rend entièrement **testable** (22 tests Vitest) et réutilisable.

### Objectifs couverts par le TP

- Résolution de systèmes d'équations (lemme d'Arden) → expression régulière ;
- conversion **AFN → AFD** et **ε-AFN → AFD** ;
- extraction d'expression régulière depuis un automate (AFN ou AFD) ;
- complétion **AFD → AFDC** (état puits) ;
- identification des états **accessibles / co-accessibles / utiles** (boutons distincts) ;
- **émondage** (automate réduit à ses états utiles) ;
- conversion **AFD → AFN** (triviale, pour la modularité) ;
- conversions **AFN ↔ ε-AFN** (dont l'élimination des ε-transitions ε-AFN → AFN) ;
- **ε-fermeture** d'un état donné (sélectionné) ou de tous les états ;
- conversion **AFD → ε-AFN** ;
- **construction de Thompson** (regex → ε-AFN) ;
- **minimisation** (AFD minimal) et **canonisation** ;
- **algorithme de Glushkov** (regex → automate de positions) ;
- **opérations de clôture** (union, intersection, complément, concaténation, étoile, différence).

---

## 2. Aperçu des modules

| Module | Rôle |
| --- | --- |
| **Automate Studio** (`/lab`) | Édition graphique d'états/transitions : initial, final, boucles, multi-transitions, **ajout de transition par formulaire** (sélecteurs De/Vers + symbole), import/export JSON, auto-layout, validation en direct, exécution d'algorithmes avec comparaison avant/après. |
| **Workflow Studio** (`/workflow`) | Canvas type n8n : déposer des nœuds d'opérations, les connecter par des **liens animés (tirets corail)**, lancer le pipeline et voir chaque nœud passer en succès/erreur, avec logs. |
| **Regex Studio** (`/regex`) | Thompson (ε-AFN) et Glushkov (automate de positions) depuis une expression régulière. |
| **Equation Studio** (`/equations`) | Résolution de systèmes d'équations de langages par élimination de Gauss + lemme d'Arden. |
| **Closure Studio** (`/closure`) | Opérations de clôture entre deux langages. |
| **Report Center** (`/report`) | Exports (JSON / PNG / texte), historique des opérations, plan du rapport, tableau de participation, configuration Supabase. |

---

## 3. Stack technique

| Besoin | Technologie | Rôle |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | Routing, layouts, pages, build, déploiement |
| Langage | **TypeScript strict** | Sûreté de types sur automates et résultats |
| Style | **Tailwind CSS v4** | Design sombre neutre, accent corail, esprit n8n (cartes-nœuds, liens en tirets animés) |
| Graphes / canvas | **@xyflow/react** (React Flow 12) | Nœuds, arcs courbes, connecteurs ronds, zoom, drag and drop |
| Layout auto | **dagre** | Disposition automatique des automates |
| État global | **Zustand** | Automate courant, workflow, historique |
| Validation | **Zod** | Schémas JSON, import sécurisé |
| Icônes | **lucide-react** | Icônes vectorielles |
| Export image | **html-to-image** + **file-saver** | Captures PNG / SVG pour le rapport |
| Persistance | **Supabase / PostgreSQL** | Projets, automates, workflows (optionnel) |
| Tests | **Vitest** | Vérification du moteur algorithmique |
| Runtime / gestion de paquets | **Bun** | Installation et scripts |

---

## 4. Architecture du projet

```
automatelab-inf3421/
├── src/
│   ├── app/                  # Pages App Router
│   │   ├── layout.tsx        # Layout global (AppShell)
│   │   ├── page.tsx          # Tableau de bord
│   │   ├── lab/              # Automate Studio
│   │   ├── workflow/         # Workflow Studio (n8n)
│   │   ├── regex/            # Regex Studio
│   │   ├── equations/        # Equation Studio
│   │   ├── closure/          # Closure Studio
│   │   └── report/           # Report Center
│   ├── components/
│   │   ├── layout/           # AppShell, SidebarNav, Topbar, Logo
│   │   ├── automata/         # AutomatonCanvas, StateNode, TransitionEdge, Inspector
│   │   ├── workflow/         # WorkflowCanvas, OperationNode, Palette, Inspector
│   │   ├── algorithms/       # TracePanel, ResultView
│   │   └── ui/               # Primitives (Button, Card, Tabs, Dialog, Badge, …)
│   ├── core/                 # MOTEUR PUR (sans React) + tests
│   │   ├── types.ts          # Automaton, State, Transition, AlgorithmResult…
│   │   ├── validators.ts     # Zod + validation métier
│   │   ├── graph-utils.ts    # parcours, move, clonage
│   │   ├── accessible.ts     # accessibles / co-accessibles / utiles
│   │   ├── trim.ts           # émondage
│   │   ├── complete-dfa.ts   # AFD → AFDC
│   │   ├── nfa-to-dfa.ts     # déterminisation (AFN → AFD)
│   │   ├── dfa-to-nfa.ts     # AFD → AFN, AFN → ε-AFN, AFD → ε-AFN (triviales)
│   │   ├── enfa-to-nfa.ts    # ε-AFN → AFN (élimination des ε-transitions)
│   │   ├── epsilon-closure.ts# ε-fermeture (état donné ou tous)
│   │   ├── enfa-to-dfa.ts    # ε-AFN → AFD
│   │   ├── minimize.ts       # minimisation
│   │   ├── canonize.ts       # canonisation
│   │   ├── regex-parser.ts   # parser → AST
│   │   ├── thompson.ts       # regex → ε-AFN
│   │   ├── glushkov.ts       # regex → automate de positions
│   │   ├── automaton-to-regex.ts  # élimination d'états
│   │   ├── arden-solver.ts   # systèmes d'équations
│   │   ├── closure-operations.ts  # union, ∩, complément…
│   │   ├── operations.ts     # registre + moteur d'exécution du workflow
│   │   └── examples.ts       # exemples du cours / TD
│   ├── store/                # Zustand (automaton-store, workflow-store)
│   └── lib/                  # utils, export, layout, persistence, supabase
├── supabase/
│   ├── schema.sql            # Schéma PostgreSQL complet
│   └── seed.sql              # Données d'amorçage
├── public/                   # icon.svg (favicon / marque SVG)
└── .env.local.example        # Variables d'environnement
```

---

## 5. Modèle de données

### Automate (JSON canonique)

```json
{
  "id": "A1",
  "name": "AFN (a+b)*abb",
  "kind": "NFA",
  "alphabet": ["a", "b"],
  "states": [
    { "id": "q0", "label": "q0", "initial": true,  "final": false, "x": 80,  "y": 120 },
    { "id": "q1", "label": "q1", "initial": false, "final": false, "x": 260, "y": 120 },
    { "id": "q3", "label": "q3", "initial": false, "final": true,  "x": 620, "y": 120 }
  ],
  "transitions": [
    { "id": "t1", "from": "q0", "to": "q0", "symbol": "a" },
    { "id": "t3", "from": "q0", "to": "q1", "symbol": "a" },
    { "id": "t5", "from": "q2", "to": "q3", "symbol": "b" }
  ]
}
```

### Résultat d'algorithme

Chaque algorithme renvoie un `AlgorithmResult` uniforme :

```ts
interface AlgorithmResult<T = Automaton | string> {
  result: T;                 // automate ou expression régulière
  steps: TraceStep[];        // trace pédagogique (titre, description, table…)
  warnings: string[];        // avertissements non bloquants
  metrics?: Record<string, number | string>;
}
```

---

## 6. Diagrammes

### 6.1 Architecture applicative

```mermaid
flowchart LR
  subgraph UI["Interface (Client Components)"]
    A[Pages App Router] --> B[Automate Canvas]
    A --> C[Workflow Canvas]
    A --> D[Formulaires & Panneaux]
  end
  subgraph STATE["État"]
    S1[(Zustand: automaton-store)]
    S2[(Zustand: workflow-store)]
  end
  subgraph CORE["Moteur pur src/core"]
    E[Algorithmes] --> F[Trace builder]
  end
  subgraph DATA["Données"]
    G[Zod schemas]
    H[(Supabase / PostgreSQL)]
    I[Export PNG/SVG/JSON]
  end
  B --> S1
  C --> S2
  S1 --> E
  S2 --> E
  G --> E
  E --> F --> I
  S1 --> H
  S2 --> H
```

### 6.2 Pipeline du Workflow Studio

```mermaid
flowchart LR
  N1[["Importer automate"]] --> N2[["AFN → AFD"]]
  N2 --> N3[["Compléter (AFDC)"]]
  N3 --> N4[["Minimiser"]]
  N4 --> N5[["Canoniser"]]
  N5 --> N6[["Exporter"]]
```

### 6.3 Diagramme de classes du domaine

```mermaid
classDiagram
  class Automaton {
    +string id
    +string name
    +AutomatonKind kind
    +string[] alphabet
    +State[] states
    +Transition[] transitions
  }
  class State {
    +string id
    +string label
    +bool initial
    +bool final
    +number x
    +number y
  }
  class Transition {
    +string id
    +string from
    +string to
    +string symbol
  }
  class AlgorithmResult {
    +T result
    +TraceStep[] steps
    +string[] warnings
    +metrics
  }
  class Workflow {
    +WorkflowNode[] nodes
    +WorkflowEdge[] edges
  }
  Automaton "1" o-- "1..*" State
  Automaton "1" o-- "0..*" Transition
  Workflow "1" o-- "0..*" WorkflowNode
  WorkflowNode --> AlgorithmResult
```

### 6.4 Séquence : exécuter un workflow

```mermaid
sequenceDiagram
  actor U as Utilisateur
  participant C as Workflow Canvas
  participant S as Zustand Store
  participant E as Core Engine
  participant T as Trace / Result
  U->>C: Clique « Lancer le workflow »
  C->>S: Récupère nœuds + arcs
  S->>E: Tri topologique + exécution
  E->>E: run(operation) pour chaque nœud
  E-->>S: Statut + AlgorithmResult par nœud
  S-->>C: Met à jour (vert / rouge)
  C->>T: Affiche graphe, trace, logs
```

### 6.5 Schéma de la base de données

```mermaid
erDiagram
  projects ||--o{ automata : contient
  projects ||--o{ workflows : contient
  projects ||--o{ operation_results : produit
  projects ||--o{ exports : génère
  workflows ||--o{ workflow_runs : exécute

  projects {
    uuid id PK
    text name
    text description
    timestamptz updated_at
  }
  automata {
    uuid id PK
    uuid project_id FK
    automaton_kind kind
    jsonb alphabet
    jsonb states
    jsonb transitions
  }
  workflows {
    uuid id PK
    uuid project_id FK
    jsonb graph
  }
  workflow_runs {
    uuid id PK
    uuid workflow_id FK
    run_status status
    jsonb node_results
  }
```

---

## 7. Algorithmes implémentés

| Algorithme | Fichier | Idée | Exemple |
| --- | --- | --- | --- |
| Accessibles / co-accessibles / utiles | `accessible.ts` | BFS direct + BFS inversé puis intersection | `q2` isolé → non accessible |
| Émondage | `trim.ts` | Garder les états utiles et leurs transitions | supprime l'état mort |
| Complétion AFDC | `complete-dfa.ts` | Ajout d'un état puits ⊥ | transition manquante → ⊥ |
| AFN → AFD | `nfa-to-dfa.ts` | Construction par sous-ensembles | `{q0,q1}` devient un état |
| AFD → AFN / AFN → ε-AFN / AFD → ε-AFN | `dfa-to-nfa.ts` | Conversions triviales (changement de type, structure conservée) | uniformisation des pipelines |
| ε-AFN → AFN | `enfa-to-nfa.ts` | Élimination des ε : `δ_N(q,a)=Eclose(δ(Eclose(q),a))` | retire les ε en préservant le langage |
| ε-fermeture | `epsilon-closure.ts` | États atteignables par ε (un état donné ou tous) | `Eclose(q0)={q0,q1,q2}` |
| ε-AFN → AFD | `enfa-to-dfa.ts` | ε-fermeture + sous-ensembles | — |
| Minimisation | `minimize.ts` | Raffinement de partitions | fusion d'états équivalents |
| Canonisation | `canonize.ts` | Renommage stable `q0, q1, …` (BFS) | sortie déterministe |
| Thompson | `thompson.ts` | Regex → ε-AFN (initial/final uniques) | `(a+b)*abb` |
| Glushkov | `glushkov.ts` | Positions : nullable/first/last/follow | `ab*` sans ε |
| Automate → regex | `automaton-to-regex.ts` | Élimination d'états | `R(i,f)` |
| Arden | `arden-solver.ts` | `X = AX + B ⟹ X = A*B` | `X = aX + b → a*b` |
| Clôtures | `closure-operations.ts` | union, ∩, complément, ·, *, différence | — |

---

## 8. Installation (Bun)

> Prérequis : [Bun](https://bun.sh) ≥ 1.3 (ou Node ≥ 18 avec npm).

```bash
# 1. Installer les dépendances
bun install

# 2. Lancer le serveur de développement
bun run dev
#   → http://localhost:3000
```

Autres scripts :

```bash
bun run build        # build de production
bun run start        # serveur de production
bun run test         # tests Vitest
bun run typecheck    # vérification TypeScript
bun run lint         # ESLint
```

L'application **fonctionne immédiatement sans base de données** : la persistance
se fait alors dans le `localStorage` du navigateur.

---

## 9. Configuration de la base Supabase

La base PostgreSQL est **optionnelle**. Pour l'activer :

### Étape 1 — Créer le projet

Créez un projet sur [supabase.com](https://supabase.com) (ici : projet
`AutomateLab`, région `eu-west-1`).

### Étape 2 — Créer le schéma

Dans **SQL Editor**, exécutez successivement :

```bash
supabase/schema.sql     # tables, types, triggers, index, vue, RLS
supabase/seed.sql       # projet de démonstration + (a+b)*abb
```

Le schéma crée 6 tables dans le schéma `automatelab` :
`projects`, `automata`, `workflows`, `workflow_runs`, `operation_results`,
`exports` — avec déclencheurs `updated_at`, index, vue `project_overview` et
politiques **RLS** permissives (le TP n'exige pas d'authentification).

### Étape 3 — Exposer le schéma

**Settings → API → Exposed schemas** : ajoutez `automatelab`.

### Étape 4 — Variables d'environnement

Copiez `.env.local.example` en `.env.local` et renseignez :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_REF.supabase.co
# Clé « publishable » (nouveau format) ou clé « anon public » (format JWT historique).
# Settings → API Keys. La clé publishable est sûre côté navigateur si la RLS est activée.
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_SUPABASE_SCHEMA=automatelab
```

> ⚠️ Ne mettez **jamais** la clé `secret` (`sb_secret_...`) dans une variable
> `NEXT_PUBLIC_*` : elle est réservée au back-end.

### Étape 5 — Relancer

```bash
bun run dev
```

Le badge **« Supabase connecté »** apparaît dans la barre du haut. Sinon, le
badge **« Stockage local »** indique le mode hors-ligne.

> **Repli automatique** : si le schéma n'est pas encore appliqué ou si une
> requête échoue, la couche de persistance bascule **silencieusement** sur le
> `localStorage`. L'application ne plante jamais pour cette raison.

> Pour appliquer le schéma en ligne de commande :
> ```bash
> psql "postgresql://postgres.VOTRE_REF:MOT_DE_PASSE@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" \
>   -f supabase/schema.sql -f supabase/seed.sql
> ```

---

## 10. Guide d'utilisation pas à pas

### Scénario de démonstration : `(a+b)*abb`

1. **Tableau de bord** → cliquez sur l'exemple **« AFN — (a+b)*abb »** : il
   s'ouvre dans l'**Automate Studio**.
2. **Automate Studio** :
   - cliquez sur **AFN → AFD** : la déterminisation s'affiche avec la table de
     transition et le graphe résultat ;
   - cliquez sur **Minimiser** : comparez l'AFD avant/après ;
   - testez **Accessibles**, **Co-accessibles**, **Utiles (analyse)** pour la
     coloration et la liste des états.
3. **Regex Studio** : saisissez `(a+b)*abb`, cliquez **Thompson** pour obtenir
   l'ε-AFN, puis **Charger dans le Studio**.
4. **Workflow Studio** :
   - construisez `Importer → AFN→AFD → Minimiser → Exporter` et reliez les
     nœuds (liens en tirets corail animés) ;
   - cliquez **Lancer le workflow** : chaque nœud passe au vert, les logs
     s'affichent ;
   - onglet **Inspecteur** → sélectionnez un nœud → **Voir le résultat** pour la
     trace complète.
5. **Report Center** : exportez l'automate en **JSON** / **PNG**, copiez la
   trace, et consultez le **plan du rapport** et le **tableau de participation**.

### Créer un automate à la main

- **+ État** (barre d'outils) ou **Ajouter un état** (Inspecteur) crée un état.
- **Transition** — deux méthodes :
  - *glisser-déposer* : tirer du bord d'un état vers un autre, puis saisir le
    symbole (`ε` pour spontanée) ;
  - *formulaire* : dans l'**Inspecteur**, section **Transitions**, choisir
    « De » / « Vers », taper le symbole et cliquer **Ajouter**. La liste permet
    de sélectionner ou supprimer chaque transition.
- l'**Inspecteur** permet de renommer, fixer l'alphabet, marquer initial/final,
  supprimer, et affiche la **validation en direct**.
- **ε-fermeture d'un état donné** : sélectionnez un état puis cliquez
  **ε-fermeture** — la fermeture de cet état est calculée et coloriée.

### Syntaxe des expressions régulières

| Notation | Sens |
| --- | --- |
| `a` | symbole |
| `e1 e2` | concaténation (implicite) |
| `e1 + e2` ou `e1 | e2` | union |
| `e*` | étoile |
| `( … )` | groupe |
| `ε` ou `&` | mot vide |
| `∅` | langage vide |

---

## 11. Tests

Les tests **Vitest** couvrent le moteur algorithmique pur.

```bash
bun run test           # exécution unique
bun run test:watch     # mode watch
```

### Couverture (22 tests)

| Catégorie | Cas testés |
| --- | --- |
| Validation | AFN détecté, transition vers état inconnu, ε interdit dans un AFD |
| Accessibilité | état accessible mais non co-accessible, émondage, métriques, rapports accessibles/co-accessibles |
| Complétion | ajout d'un puits quand une transition manque |
| Déterminisation | AFN → AFD reconnaît `abb`, ε-fermeture, ε-AFN → AFD |
| Conversions ε | ε-AFN → AFN (élimination des ε), ε-fermeture d'un état donné |
| Minimisation | réduction d'un AFD à états équivalents |
| Regex | parsing, Thompson (initial/final uniques), Glushkov sans ε, automate → regex |
| Arden | `X = aX + b` donne `a*b` |
| Clôtures | union (ε-AFN), complément (AFD complet), intersection (produit) |
| Canonisation | renommage en `q0, q1, …` |

### Résultat attendu

```text
 Test Files  1 passed (1)
      Tests  22 passed (22)
```

### Ajouter un test

Créez un fichier `src/core/__tests__/mon-algo.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { nfaToDfa } from "../index";

describe("ma fonctionnalité", () => {
  it("produit un AFD déterministe", () => {
    const r = nfaToDfa(monAutomate);
    expect(r.result.kind).toBe("DFA");
  });
});
```

---

## 12. Build et déploiement

```bash
bun run build
bun run start
```

### Déploiement sur Vercel

1. Poussez le dépôt sur GitHub.
2. Importez le projet dans [Vercel](https://vercel.com).
3. Ajoutez les variables `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `NEXT_PUBLIC_SUPABASE_SCHEMA`.
4. Déployez : Vercel détecte Next.js automatiquement.

---

## 13. Auteurs et participation

| Membre | Tâches | % |
| --- | --- | --- |
| **AZAB A RANGA FRANCK MIGUEL** (23V2227) | Cahier des charges, architecture, moteur algorithmique, intégration UI, base de données, rapport | — |
| Membre 2 | À compléter | — |
| Membre 3 | À compléter | — |
| Membre 4 | À compléter | — |

> Le tableau de participation est également disponible et exportable depuis le
> **Report Center** de l'application.

---

<div align="center">

**UE INF3421 — Langages formels et compilation**
Faculté des Sciences · Département d'Informatique · Université de Yaoundé I · 2025–2026

</div>
