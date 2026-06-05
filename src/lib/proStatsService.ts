// =============================================================================
// src/lib/proStatsService.ts
//
// Service d'accès aux statistiques Bac Pro pré-agrégées.
// Toutes les fonctions retournent des objets typés et lisent UNE OU QUELQUES
// LIGNES seulement dans `parcoursup_pro_stats_aggregated`.
//
// Remplace les requêtes massives sur `parcoursup_fine_clean` qui chargeaient
// des milliers de lignes pour faire des AVG côté client.
// =============================================================================

import { getSupabase } from './supabase';

// ---------- Types -----------------------------------------------------------

export interface ProStatsRow {
  annee: string;
  libelle_formation: string;
  total_etablissements: number;
  total_formations_uniques: number | null;
  avg_taux_emploi_6mois: number | null;
  avg_taux_emploi_12mois: number | null;
  avg_taux_emploi_18mois: number | null;
  avg_taux_emploi_24mois: number | null;
  avg_devenir_part_emploi_6mois: number | null;
  avg_devenir_part_poursuite_etudes: number | null;
  avg_devenir_part_autre_situation_6mois: number | null;
}

export interface TrajectoirePoint {
  label: '6 mois' | '12 mois' | '18 mois' | '24 mois';
  value: number | null;
}

export interface DevenirSlice {
  label: 'Emploi' | "Poursuite d'études" | 'Autre situation';
  value: number | null;
}

export interface EvolutionPoint {
  annee: string;
  taux_emploi_6mois: number | null;
  taux_emploi_12mois: number | null;
  taux_emploi_18mois: number | null;
  taux_emploi_24mois: number | null;
}

export interface TopFormation {
  libelle_formation: string;
  avg_taux_emploi_6mois: number;
  total_etablissements: number;
}

// ---------- Constantes ------------------------------------------------------

const TABLE = 'parcoursup_pro_stats_aggregated';

/** Année par défaut pour les KPI et les graphiques cumulés. */
export const CURRENT_CUMUL = 'cumul 2023-2024';

/** Années (non cumulées) utilisées pour le graphique d'évolution. */
export const HISTORICAL_YEARS = [
  'cumul 2018-2019',
  'cumul 2019-2020',
  'cumul 2020-2021',
  'cumul 2021-2022',
  'cumul 2022-2023',
  'cumul 2023-2024',
] as const;

/** Valeur sentinelle pour la ligne agrégée "toutes formations confondues". */
export const GLOBAL_KEY = 'global';

// ---------- Helpers ---------------------------------------------------------

/** Convertit une réponse Supabase (string|number|null) en number|null. */
function n(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const num = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(num) ? num : null;
}

function normalizeRow(raw: any): ProStatsRow {
  return {
    annee: raw.annee,
    libelle_formation: raw.libelle_formation,
    total_etablissements: Number(raw.total_etablissements ?? 0),
    total_formations_uniques: raw.total_formations_uniques == null
      ? null
      : Number(raw.total_formations_uniques),
    avg_taux_emploi_6mois: n(raw.avg_taux_emploi_6mois),
    avg_taux_emploi_12mois: n(raw.avg_taux_emploi_12mois),
    avg_taux_emploi_18mois: n(raw.avg_taux_emploi_18mois),
    avg_taux_emploi_24mois: n(raw.avg_taux_emploi_24mois),
    avg_devenir_part_emploi_6mois: n(raw.avg_devenir_part_emploi_6mois),
    avg_devenir_part_poursuite_etudes: n(raw.avg_devenir_part_poursuite_etudes),
    avg_devenir_part_autre_situation_6mois: n(raw.avg_devenir_part_autre_situation_6mois),
  };
}

// ---------- API publique ----------------------------------------------------

/**
 * KPI globaux (carte d'en-tête) : cumul courant, toutes formations confondues.
 * Lit 1 seule ligne.
 */
export async function fetchGlobalProStats(): Promise<ProStatsRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('annee', CURRENT_CUMUL)
    .eq('libelle_formation', GLOBAL_KEY)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeRow(data) : null;
}

/**
 * Stats pour une formation donnée (ou globales si non fournie), cumul courant.
 * Lit 1 seule ligne. Sert à alimenter "Trajectoire pro" et "Devenir des diplômés".
 */
export async function fetchCurrentStats(
  libelleFormation?: string | null,
): Promise<ProStatsRow | null> {
  const supabase = getSupabase();
  const target = libelleFormation && libelleFormation.trim() !== ''
    ? libelleFormation
    : GLOBAL_KEY;

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('annee', CURRENT_CUMUL)
    .eq('libelle_formation', target)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeRow(data) : null;
}

/**
 * Reformate une `ProStatsRow` en série prête à brancher dans le LineChart
 * "Trajectoire professionnelle".
 */
export function toTrajectoireSeries(row: ProStatsRow | null): TrajectoirePoint[] {
  if (!row) return [];
  return [
    { label: '6 mois',  value: row.avg_taux_emploi_6mois },
    { label: '12 mois', value: row.avg_taux_emploi_12mois },
    { label: '18 mois', value: row.avg_taux_emploi_18mois },
    { label: '24 mois', value: row.avg_taux_emploi_24mois },
  ];
}

/**
 * Reformate une `ProStatsRow` en parts pour le donut "Devenir des diplômés".
 */
export function toDevenirSlices(row: ProStatsRow | null): DevenirSlice[] {
  if (!row) return [];
  return [
    { label: 'Emploi',              value: row.avg_devenir_part_emploi_6mois },
    { label: "Poursuite d'études",  value: row.avg_devenir_part_poursuite_etudes },
    { label: 'Autre situation',     value: row.avg_devenir_part_autre_situation_6mois },
  ];
}

/**
 * Évolution annuelle du taux d'emploi à 6 mois (6 années).
 * Lit jusqu'à 6 lignes. Filtre optionnel par formation.
 */
export async function fetchEmploymentEvolution(
  libelleFormation?: string | null,
): Promise<EvolutionPoint[]> {
  const supabase = getSupabase();
  const target = libelleFormation && libelleFormation.trim() !== ''
    ? libelleFormation
    : GLOBAL_KEY;

  const { data, error } = await supabase
    .from(TABLE)
    .select('annee, avg_taux_emploi_6mois, avg_taux_emploi_12mois, avg_taux_emploi_18mois, avg_taux_emploi_24mois')
    .eq('libelle_formation', target)
    .in('annee', HISTORICAL_YEARS as unknown as string[])
    .order('annee', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(r => ({
    annee: r.annee,
    taux_emploi_6mois: n(r.avg_taux_emploi_6mois),
    taux_emploi_12mois: n(r.avg_taux_emploi_12mois),
    taux_emploi_18mois: n(r.avg_taux_emploi_18mois),
    taux_emploi_24mois: n(r.avg_taux_emploi_24mois),
  }));
}

/**
 * Top N formations par taux d'emploi à 6 mois (cumul courant).
 * Lit N lignes (10 par défaut), déjà triées par Supabase grâce à l'index.
 */
export async function fetchTopFormations(limit = 10): Promise<TopFormation[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select('libelle_formation, avg_taux_emploi_6mois, total_etablissements')
    .eq('annee', CURRENT_CUMUL)
    .neq('libelle_formation', GLOBAL_KEY)
    .not('avg_taux_emploi_6mois', 'is', null)
    .order('avg_taux_emploi_6mois', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(r => ({
    libelle_formation: r.libelle_formation,
    avg_taux_emploi_6mois: Number(r.avg_taux_emploi_6mois),
    total_etablissements: Number(r.total_etablissements ?? 0),
  }));
}

/**
 * Liste alphabétique des formations disponibles (pour le menu déroulant).
 * Lit ~N lignes (1 par formation) mais ne ramène qu'une seule colonne.
 */
export async function fetchFormationsList(): Promise<string[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select('libelle_formation')
    .eq('annee', CURRENT_CUMUL)
    .neq('libelle_formation', GLOBAL_KEY)
    .order('libelle_formation', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(r => r.libelle_formation as string);
}
