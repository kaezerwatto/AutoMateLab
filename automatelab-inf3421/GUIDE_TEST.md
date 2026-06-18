# Guide de test — AutoMateLab INF3421

Ce document explique **de A à Z**, pas à pas, comment installer, lancer et
**tester interactivement** chaque fonctionnalité de l'application, ainsi que
comment vérifier que **toutes les opérations exigées par le TP INF3421** sont
bien implémentées.

> Aucune connaissance préalable de Next.js n'est nécessaire : il suffit de
> suivre les commandes dans l'ordre.

---

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Installation](#2-installation)
3. [Lancer l'application](#3-lancer-lapplication)
4. [Découverte de l'interface](#4-découverte-de-linterface)
5. [Automate Studio — tester chaque opération](#5-automate-studio--tester-chaque-opération)
6. [Workflow Studio — pipeline visuel + liens animés](#6-workflow-studio--pipeline-visuel--liens-animés)
7. [Regex Studio — Thompson & Glushkov](#7-regex-studio--thompson--glushkov)
8. [Equation Studio — systèmes & Arden](#8-equation-studio--systèmes--arden)
9. [Closure Studio — opérations de clôture](#9-closure-studio--opérations-de-clôture)
10. [Report Center — exports](#10-report-center--exports)
11. [Persistance (Supabase ou local)](#11-persistance-supabase-ou-local)
12. [Tests automatisés, lint et build](#12-tests-automatisés-lint-et-build)
13. [Tableau de conformité au TP](#13-tableau-de-conformité-au-tp)
14. [Dépannage](#14-dépannage)

---

## 1. Prérequis

| Outil | Version conseillée | Vérifier |
|---|---|---|
| **Bun** | ≥ 1.1 | `bun --version` |
| Navigateur moderne | Chrome / Firefox / Edge récent | — |

Installer Bun si besoin :

```bash
curl -fsSL https://bun.sh/install | bash
```

Puis recharger le terminal (`source ~/.bashrc` ou `source ~/.zshrc`).

---

## 2. Installation

Depuis la racine du dépôt :

```bash
cd automatelab-inf3421
bun install
```

L'installation télécharge les dépendances (Next.js, React Flow, Zustand, Zod,
dagre, Vitest…). Compter 1 à 2 minutes la première fois.

---

## 3. Lancer l'application

### Mode développement (recommandé pour tester)

```bash
bun run dev
```

Ouvrir ensuite **http://localhost:3000** dans le navigateur.
La page se recharge automatiquement à chaque modification du code.

### Mode production (pour vérifier le build final)

```bash
bun run build   # compile et vérifie les types
bun run start   # sert l'application optimisée sur http://localhost:3000
```

---

## 4. Découverte de l'interface

- **Barre latérale gauche** (repliable via l'icône en haut) : navigation entre
  les six modules, regroupés par sections (Espace, Éditeurs, Algèbre, Sortie).
- **Barre supérieure** : titre du module, indicateur de persistance
  (« Supabase connecté » ou « Stockage local ») et bouton « Démo ».
- **Zone centrale** : le canvas ou le formulaire du module courant.

> Astuce : sur le **tableau de bord** (accueil), la section « Exemples du cours
> & TD » permet de charger un automate d'un clic ; il est alors envoyé vers
> l'Automate Studio.

---

## 5. Automate Studio — tester chaque opération

Aller dans **Automate Studio** (menu de gauche, icône cercle).

### 5.1 Charger un exemple

1. Cliquer sur **Exemples** dans la barre d'outils.
2. Choisir **AFN — (a+b)\*abb**.
   → Le graphe s'affiche : 4 états `q0…q3`, `q0` initial (flèche entrante),
   `q3` final (double cercle).

### 5.2 Éditer le graphe (création manuelle)

- **Ajouter un état** : bouton **État**. Un nouvel état apparaît ; le glisser
  pour le positionner.
- **Créer une transition (2 méthodes)** :
  - *Glisser-déposer* : passer la souris sur le bord d'un état (un point rond
    apparaît), cliquer-glisser vers un autre état, puis saisir le symbole
    (`ε` pour une transition spontanée).
  - *Formulaire* : dans l'**Inspecteur** (panneau droit), section
    **Transitions**, choisir l'état « De », l'état « Vers », taper le symbole
    et cliquer **Ajouter**. La liste en dessous permet de cliquer pour
    sélectionner ou de supprimer chaque transition.
- **Ajouter un état** : bouton **État** (barre d'outils) ou **Ajouter un état**
  (Inspecteur).
- **Éditer un état** : le sélectionner ; le panneau **Inspecteur** (à droite)
  permet de le marquer initial/final, de le renommer ou de le supprimer.
- **Auto-layout** : bouton **Auto-layout** pour réorganiser proprement le
  graphe automatiquement (dagre).

### 5.3 Tester les opérations (chaque bouton ouvre une fenêtre de résultat)

Charger l'exemple indiqué, cliquer sur le bouton, observer le **graphe
résultat + métriques + trace pédagogique**. Le bouton **Appliquer** remplace
l'automate courant par le résultat.

| Bouton | Exemple à charger | Résultat attendu |
|---|---|---|
| **Accessibles** | *Automate avec état inutile* | états atteignables depuis l'initial coloriés + liste dans la trace |
| **Co-accessibles** | *Automate avec état inutile* | états menant à un final coloriés ; `q2` exclu |
| **Utiles (analyse)** | *Automate avec état inutile* | tableau accessible / co-accessible / utile ; métrique `utiles = 2` |
| **Émonder** | *Automate avec état inutile* | `q2 (inutile)` disparaît du graphe |
| **Compléter (AFDC)** | *AFD incomplet* | ajout d'un état puits `⊥` ; toutes les transitions définies |
| **AFN → AFD** | *AFN — (a+b)\*abb* | automate déterministe (états = sous-ensembles), un seul état initial |
| **ε-AFN → AFD** | *ε-AFN — chaîne ε* | AFD équivalent sans ε |
| **AFD → AFN** | *AFD incomplet* | même structure, type passe à AFN |
| **AFN → ε-AFN** | *AFN — (a+b)\*abb* | type passe à ε-AFN (trivial) |
| **AFD → ε-AFN** | *AFD incomplet* | type passe à ε-AFN (trivial) |
| **ε-AFN → AFN** | *ε-AFN — chaîne ε* | ε-transitions éliminées (formule `δ(Eclose(q),a)`), langage préservé |
| **ε-fermeture** | *ε-AFN — chaîne ε* | sans sélection : table de toutes les fermetures ; **avec un état sélectionné** : `Eclose(q0) = {q0,q1,q2}` ciblé et colorié |
| **Minimiser** | *AFD à minimiser* | nombre d'états réduit (états équivalents fusionnés) |
| **Canoniser** | n'importe lequel | états renommés `q0, q1, …` de façon stable |
| **→ Regex** | *AFN — (a+b)\*abb* | une expression régulière équivalente (chaîne) |
| **Complément** | *AFD incomplet* | AFD complet avec finaux inversés |

### 5.4 Import / export d'un automate (JSON)

- **Exporter** : télécharge l'automate courant au format JSON.
- **Importer** : recharge un fichier JSON (utile pour rejouer un cas précis).

---

## 6. Workflow Studio — pipeline visuel + liens animés

Aller dans **Workflow Studio**. C'est le canvas façon n8n : on **enchaîne** les
opérations en reliant des nœuds.

### 6.1 Construire un pipeline

1. Dans la **palette de gauche**, cliquer sur **Importer automate** → un nœud
   source apparaît sur le canvas (il utilise l'automate courant comme entrée).
2. Cliquer sur **AFN → AFD**, puis **Minimiser**, puis **Exporter**.
3. **Relier les nœuds** : tirer un lien depuis le point de sortie (à droite d'un
   nœud) vers le point d'entrée (à gauche du suivant), dans l'ordre :
   `Importer automate → AFN → AFD → Minimiser → Exporter`.

> **L'effet sur les liens** : chaque lien est une courbe avec un **point
> lumineux qui circule** le long du fil (sens de propagation des données).
> Au survol, le lien s'illumine ; le lien sélectionné devient plus épais avec
> un halo. Les couleurs changent selon l'état du nœud cible : gris (inactif),
> corail (en cours), vert (succès), rouge (erreur).

### 6.2 Exécuter

1. Vérifier en haut le badge **« Source : … »** (l'automate utilisé en entrée).
2. Cliquer sur **Lancer le workflow**.
   → Les nœuds passent en « en cours » puis « succès/erreur », les liens
   s'animent, et l'onglet **Logs** (panneau droit) affiche le détail
   (`OK …` en vert, `ERREUR …` en rouge).
3. Onglet **Inspecteur** → sélectionner un nœud → **Voir le résultat** pour
   ouvrir le graphe/trace de ce nœud. **Appliquer** renvoie le résultat vers
   l'Automate Studio.

### 6.3 Autres actions

- **Réinitialiser** : remet les statuts à zéro.
- **Enregistrer** : sauvegarde le workflow (Supabase si configuré, sinon local).
- Sélectionner un nœud ou un lien puis **Suppr/Backspace** pour le retirer.

---

## 7. Regex Studio — Thompson & Glushkov

Aller dans **Regex Studio**.

1. Saisir une expression régulière, par exemple **`(a+b)*abb`**
   (opérateurs : `+` union, `*` étoile, concaténation par juxtaposition,
   parenthèses ; `ε` mot vide).
2. **Construction de Thompson** → génère un **ε-AFN** avec un état initial et
   un état final uniques.
3. **Algorithme de Glushkov** → génère un **automate de positions** (sans ε).

Autres expressions à essayer : `ab*`, `(a+b)*`, `a(a+b)*b`, `(ab)*`.

---

## 8. Equation Studio — systèmes & Arden

Aller dans **Equation Studio**.

1. Saisir un système, une équation par ligne. Exemple :

   ```
   X = aX + b
   ```

2. Lancer la résolution → l'**expression régulière** de la variable initiale
   est affichée. Pour `X = aX + b`, on obtient **`a*b`** (lemme d'Arden).

Autre exemple (système à deux variables) :

```
X = aX + bY + ε
Y = aY + bX
```

---

## 9. Closure Studio — opérations de clôture

Aller dans **Closure Studio**.

1. Choisir **Automate A** et **Automate B** dans les listes déroulantes
   (automate courant ou exemples).
2. **Opérations binaires** : **Union** `A ∪ B`, **Intersection** `A ∩ B`,
   **Concaténation** `A · B`, **Différence** `A \ B`.
3. **Opérations unaires** (sur A) : **Étoile** `A*`, **Complément** `∁A`.

Le résultat s'affiche avec son graphe et sa trace ; **Appliquer** l'envoie vers
l'Automate Studio.

---

## 10. Report Center — exports

Aller dans **Report Center**.

- **Exporter le graphe** courant en **PNG** / **SVG**.
- **Exporter** l'automate en **JSON**.
- Consulter l'**historique** des résultats appliqués et le **plan de rapport**.

Ces exports servent à illustrer le rapport de groupe (captures de graphes,
traces d'algorithmes).

---

## 11. Persistance (Supabase ou local)

L'application fonctionne **sans backend** : par défaut, les projets/automates
sont stockés dans le **localStorage** du navigateur.

Pour activer **Supabase (PostgreSQL)** :

1. Le fichier `.env.local` contient déjà l'URL du projet et la clé
   *publishable*.
2. Dans le tableau de bord Supabase → **SQL Editor**, exécuter le contenu de
   `supabase/schema.sql` (puis, en option, `supabase/seed.sql`).
3. Dans **Settings → API → Exposed schemas**, ajouter `automatelab`.
4. Relancer `bun run dev`. Le badge en haut indique **« Supabase connecté »**.

> Si le schéma n'est pas encore créé, l'application **bascule automatiquement**
> sur le stockage local : aucune erreur bloquante.

---

## 12. Tests automatisés, lint et build

Depuis `automatelab-inf3421/` :

```bash
bun run test        # tests unitaires du moteur (Vitest)
bun run test:watch  # mode interactif
bun run lint        # ESLint
bun run typecheck   # vérification TypeScript stricte
bun run build       # build de production complet
```

Les tests couvrent : validation, accessibilité/émondage, complétion,
déterminisation, ε-fermeture, **ε-AFN → AFN**, minimisation, regex (parser,
Thompson, Glushkov), automate → regex, Arden et clôtures.

Résultat attendu : **tous les tests au vert** et un **build sans erreur**.

---

## 13. Tableau de conformité au TP

| Exigence du TP | Module / bouton pour la tester |
|---|---|
| Système d'équations → expression régulière | **Equation Studio** |
| Conversion AFN → AFD | Automate Studio « AFN → AFD » / Workflow |
| Extraction d'expression régulière d'un automate | Automate Studio « → Regex » |
| Conversion AFD → AFDC | Automate Studio « Compléter (AFDC) » |
| États accessibles / co-accessibles / utiles | Automate Studio « Accessibles » / « Co-accessibles » / « Utiles (analyse) » |
| Émondage | Automate Studio « Émonder » |
| Conversion AFD → AFN | Automate Studio « AFD → AFN » |
| Conversion AFN ↔ ε-AFN | « AFN → ε-AFN » et « ε-AFN → AFN » |
| Calcul des ε-fermetures (pour un état donné) | Sélectionner un état puis « ε-fermeture » |
| Conversion ε-AFN → AFD | Automate Studio « ε-AFN → AFD » |
| Conversion AFD → ε-AFN | Automate Studio « AFD → ε-AFN » |
| Construction de Thompson (pure) | **Regex Studio** |
| Minimisation | Automate Studio « Minimiser » |
| Algorithme de Glushkov | **Regex Studio** |
| Canonisation | Automate Studio « Canoniser » |
| Opérations de clôture (∪, ∩, complément, ·, \*, différence) | **Closure Studio** |

---

## 14. Dépannage

| Problème | Solution |
|---|---|
| `bun: command not found` | Réinstaller Bun puis recharger le terminal |
| Le port 3000 est occupé | `bun run dev -- -p 3001` puis ouvrir le port 3001 |
| Une opération affiche une erreur (ex. « nécessite un AFD ») | Convertir d'abord l'automate (ex. AFN → AFD avant de minimiser) |
| Le badge reste sur « Stockage local » | Vérifier `.env.local` et l'application du `schema.sql` (section 11) |
| Le graphe est illisible | Cliquer sur **Auto-layout** |

---

*Bon test ! Pour toute opération, la fenêtre de résultat fournit une trace*
*pédagogique pas à pas, idéale pour illustrer le rapport.*
