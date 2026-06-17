# Documentation Technique du Projet "L'Étudiant - Data Explorer"

Ce document détaille l'architecture globale, les implémentations techniques et la logique de requêtage du projet. Il est destiné aux développeurs front-end, back-end et ingénieurs de données souhaitant s'approprier la stack technique.

---

## 1. Architecture Système et Stack Technologique

L'architecture est entièrement **Serverless / Jamstack**, supprimant le besoin d'un middle-tier (ex: API Node.js / Express intermédiaire) en s'appuyant sur l'infrastructure **Supabase** comme "Backend-as-a-Service".

### 1.1. Frontend (Client Javascript)
- **Framework :** React 19 avec TypeScript pour un typage strict des données entrantes.
- **Build Tool :** Vite pour le Hot Module Replacement (HMR) ultra-rapide et l'optimisation des bundles de production via Rollup.
- **Styling :** Tailwind CSS avec approche Mobile-First, assurant une construction de l'UI directement dans les composants React.
- **Composants visuels :** Framer Motion (animations), Recharts (data-visualisation optimisée SVG), et React-Leaflet (composants de cartographie avec tiles OpenStreetMap).

### 1.2. Backend & Data Layer (Supabase / PostgreSQL)
La couche de données repose sur **Supabase**, qui agit comme sur-couche d'une instance **PostgreSQL**.
- **PostgreSQL :** Moteur relationnel pour la persistance des jeux de données (Parcoursup, InserJeunes).
- **PostgREST :** Couche middleware générée automatiquement par Supabase. Elle introspecte le schéma PostgreSQL et expose instantanément une API RESTful sécurisée.
- **Row Level Security (RLS) :** Sécurité configurée nativement au niveau de la ligne de la BDD. L'accès public (anonyme) est restreint en lecture seule (Select) sur les tables spécifiques à l'application.

---

## 2. Démarrage Rapide (Onboarding)

Pour qu'un développeur (Front ou Fullstack) puisse faire tourner le projet localement, voici les étapes opérationnelles :

### 2.1. Prérequis
- **Node.js** (version 18 ou supérieure recommandée).
- **npm** (ou yarn/pnpm) installé.
- Un accès au projet **Supabase** (URL de l'API et clef publique "anon key").

### 2.2. Installation Locale
1. Cloner le dépôt ou récupérer les sources du projet.
2. Naviguer dans le dossier du projet via le terminal.
3. Installer les dépendances NPM : `npm install`

### 2.3. Variables d'Environnement
Créer un fichier `.env.local` à la racine du projet (ce fichier ne doit **jamais** être versionné/commité). Ce fichier permet à Vite.js de se connecter au cloud Supabase.
```env
VITE_SUPABASE_URL="https://votre-projet.supabase.co"
VITE_SUPABASE_ANON_KEY="votre-clef-publique-anon-key"
```

### 2.4. Lancement du Serveur de Développement
Démarrer le serveur de développement local via Vite :
```bash
npm run dev
```
L'application Front-end sera accessible sur `http://localhost:3000` (ou port similaire), avec le Hot Module Replacement (HMR) actif pour un rechargement instantané à chaque modification de code.

---

## 3. Modélisation et Schéma de Base de Données

Afin de comprendre ce que l'application consulte, voici la modélisation à l'intérieur de l'instance PostgreSQL Supabase.

### 3.1. Approche de la Donnée (Open Data)
Nous exploitons des données massives hétérogènes (les Vœux Parcoursup et l'Insertion InserJeunes). Plutôt que de conserver le schéma brut complexe de l'Open Data français, des tables dédiées (et dénormalisées pour faciliter la lecture des graphiques) ont été construites lors des pipelines d'ingestion.

### 3.2. Tables Principales et Schéma Logique

- **`parcoursup_1` et `parcoursup_2`** : Tables granulaires contenant le détail des vœux par formations. Utilisées pour les affichages fins (taux d'acceptation, pourcentage de filles/garçons, taux de boursiers, notes du dernier appelé).
- **`inserjeunes_brut`** : Table massive recensant les statistiques brutes granulaires d'insertion professionnelle pour l'ensemble des lycées et formations de France et d'Outre-mer (anciennement nommée `parcoursup_fine_clean`).
  - *Champs clés :* `numero_uai` (identifiant lycée), `secteur`, `libelle_formation`, `annee`, `taux_emploi_6_mois`, `taux_poursuite_etudes`.
- **`inserjeunes_stats_aggregated` (Vue ou Table Matérialisée)** : Entité cruciale du projet. Elle agglomère les données de milliers d'établissements pour produire des **Moyennes Nationales par spécialité**. C’est cette entité qui est le plus souvent interrogée par les graphiques *Recharts*.

### 3.3. Intégrité et Sécurité des Données
- **Typage Strict SQL :** Les champs utilisent des contraintes fortes (`numeric`, `boolean`, référentiels `text`).
- **Mode Read-Only (RLS) :** La politique *Row Level Security* configurée sur Supabase stipule que l'accès par API (utilisant l'`anon_key`) ne peut y effectuer que des `SELECT`. Aucune requête `INSERT`, `UPDATE` ou `DELETE` front-end passera le pare-feu du niveau base de données.

---

## 4. Accès à la Donnée : Supabase & Requêtes Avancées

L'enjeu principal du projet réside dans le traitement d'un volume de données massif (Open Data Parcoursup, InserJeunes). La stratégie est de **déporter la charge de calcul (filtres, tris, agrégations) vers la base de données SQL** afin de minimiser le payload HTTP et la charge CPU côté client.

### 4.1. Fonctionnement du SDK Supabase (PostgREST)

Le front-end utilise `@supabase/supabase-js`. Ce SDK crée dynamiquement des requêtes HTTP vers l'API PostgREST en convertissant le chaînage TypeScript en un équivalent SQL.

Exemple de requête REST générée en d’arrière plan par Supabase pour lire les valeurs du Taux d'emploi :
`GET /rest/v1/inserjeunes_stats_aggregated?select=annee,avg_taux_emploi_6mois&libelle_formation=eq.Bac%20Pro...&annee=in.(cumul%202018-2019...)`

### 4.2. Exemples d'Implémentations Techniques Backend/Frontend

Dans le fichier `src/lib/proStatsService.ts`, le SDK Supabase gère directement les jointures logiques et les filtres côté serveur. 

**Exemple 1 : Requête avec Filtre Strict et Tri Logique**
```typescript
// Récupération de l'évolution du taux d'emploi par année pour une formation spécifique
export async function fetchEmploymentEvolution(libelleFormation?: string): Promise<EvolutionPoint[]> {
  const supabase = getSupabase();
  
  // 1. Définition du Query Builder : Cible la vue ou la table pré-agrégée
  const { data, error } = await supabase
    .from('inserjeunes_stats_aggregated')
    // 2. Projection (SELECT) : on ne récupère QUE les colonnes nécessaires (Data sparsing)
    .select('annee, avg_taux_emploi_6mois, avg_taux_emploi_12mois, avg_taux_emploi_18mois, avg_taux_emploi_24mois')
    // 3. Clause WHERE (EQ) : if libelleFormation existe
    .eq('libelle_formation', libelleFormation)
    // 4. Clause WHERE IN : On s'assure d'exclure d'éventuelles "mauvaises" années
    .in('annee', ['cumul 2018-2019', 'cumul 2019-2020', 'cumul 2020-2021', 'cumul 2021-2022'])
    // 5. ORDER BY : La BDD trie les années chronologiquement, le Javascript n'a plus rien à faire
    .order('annee', { ascending: true });

  if (error) {
    console.error('Erreur SQL lors de fetchEmploymentEvolution:', error);
    return [];
  }
  return data;
}
```

*Equivalent SQL exécuté sur PostgreSQL :*
```sql
SELECT annee, avg_taux_emploi_6mois, avg_taux_emploi_12mois, avg_taux_emploi_18mois, avg_taux_emploi_24mois
FROM inserjeunes_stats_aggregated
WHERE libelle_formation = 'Le nom de la formation' 
  AND annee IN ('cumul 2018-2019', 'cumul 2019-2020', 'cumul 2020-2021', 'cumul 2021-2022')
ORDER BY annee ASC;
```

**Exemple 2 : Comparaisons Complexes et Limites (Top 10)**
Dans les KPI d'insertion ou le composant "Top Formations", le client ne traite pas toutes les formations. Il demande directement la liste finale au moteur SQL :

```typescript
// Fetch the top 10 formations with the best employment rate
export async function fetchTopFormations(limit: number = 10): Promise<FormationStats[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('inserjeunes_stats_aggregated')
    .select('libelle_formation, avg_taux_emploi_6mois, avg_taux_en_emploi_24_mois, avg_taux_poursuite_etudes')
    .eq('annee', 'cumul 2021-2022') // focus sur la dernière année disponible
    .not('avg_taux_emploi_6mois', 'is', null) // Clause IS NOT NULL pour éviter de fausser le classement
    .order('avg_taux_emploi_6mois', { ascending: false }) // Tri décroissant (les meilleurs en haut)
    .limit(limit); // SQL LIMIT
  // ...
}
```

### 4.3. Vues et Tables Agrégées (L'Optique "Data Engineering")

Pour maintenir des performances d'affichage sous la barre des 100ms, les données frontières issues de la source initiale ne sont pas toujours exploitées en brut (Raw data). 

Les requêtes complexes nécessitent des **Materialized Views** ou des tables agrégées (`inserjeunes_stats_aggregated`) générées au niveau du serveur DB (par exemple, des routines PL/pgSQL).
- **Gain de performances :** Les moyennes (`AVG()`) ne sont pas calculées "à la volée" lors de l'appel HTTP. Elles sont pré-calculées la nuit ou lors de l'ingestion par un trigger BDD.
- **Indexation :** Les colonnes fréquemment recherchées, comme `libelle_formation`, font l'objet d'index (ex: Index B-Tree normaux ou GIN pour de la recherche full-text) côté PostgreSQL, ce qui garantit des requêtes qui scaleront même avec des millions de lignes.

---

## 5. Tests, Déploiement, Éco-Conception

### 5.1. Philosophie Jamstack & Mises à disposition
L'intégration "Client Direct vers Base Supabase" a pour principal avantage :
- L'absence de serveur `Express/Apollo/Fastify` à provisionner, scaler ou patcher.
- Un front-end construit en tant qu'Assets statiques (HTML/CSS/JS compilés), ce qui le rend apte à être hébergé sur des réseaux CDN mondiaux (Vercel, Cloudflare Pages, Netlify).

### 5.2. Code Quality (Linter & Build)
Le projet dispose d'une suite de CI/CD minimale paramétrée via les scripts `npm`:
- `npm run lint` va valider strictement que le typage TypeScript concorde avec le modèle de donnée SQL pour éviter tout "Type Error" au runtime.
- `npm run build` gère le code splitting de Vite.js pour ne charger au client que le code strict nécessaire pour peindre les graphiques demandés à l'instant `t`.

### 5.3. Pipeline de Tests (Unitaires et E2E)
Pour garantir la robustesse des prochaines itérations, plusieurs couches de tests doivent être considérées dans la stack :
- **Tests Unitaires et Intégration (Vitest / React Testing Library) :** À lancer avec un script de type `npm run test`. Ils valident le comportement isolé d'un composant (ex: un *Tooltip* complexe ou le filtrage dynamique régional) et intègrent généralement un *mock* du service `@supabase/supabase-js` pour ne pas consommer l'API lors de l'intégration continue.
- **Tests E2E (Playwright / Cypress) :** Valident le flux "Lycéen" complet, depuis la page d'accueil, le workflow de questions (Onboarding), jusqu'au chargement des cartographies *Leaflet* et des métriques d'emploi.

### 5.4. Stratégie de Déploiement et Environnements
Pour une gestion saine du cycle de vie du projet (Cloud Run, Vercel ou Netlify), 3 piliers d'environnements sont conseillés :
1. **Local (Développement) :** L'ordinateur du développeur, connecté à une base Supabase distincte (mode *Staging* ou instance Docker locale).
2. **Preview (Staging / QA) :** À chaque *Pull Request* sur le dépôt, un build temporaire est généré. Il permet aux Product Owners (ou collègues) de tester en conditions réelles avant la mise en production.
3. **Production (Main Branch) :** Le site grand public. Mise à jour automatique (Continuous Deployment) lors d'une fusion sur la branche `main`. Ce déploiement tape sur l'instance de base de données Prod, cachée derrière un Content Delivery Network (CDN) limitant drastiquement les requêtes BDD directes.

### 5.5. Éco-Conception
- **Network Reduction :** En forçant la DB Supabase avec `.select('colonne1, colonne2')` au lieu d'un simple `SELECT *`, le traffic réseau est optimisé et permet aux étudiants équipés de forfaits data limités ou dans des zones à faible couverture réseau (3G) de charger l'application de façon fluide.
- **Client Processing :** Dépouillés des contraintes de devoir manipuler de lourds Arrays Javascript pour filtrer et nettoyer l'Open Data, les processeurs de smartphones sous-licencient moins d'énergie. L'éco-conception est donc rendue effective par un choix d'architecture technique axée sur la délégation Cloud vers la BDD.

---
*Ce document de référence doit servir de documentation canonique pour tout développeur back/front effectuant des modifications sur le dépôt.*
