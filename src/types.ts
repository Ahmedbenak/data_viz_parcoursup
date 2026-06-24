import React from 'react';

export interface OrientationData {
  "specialites": string;
  "formation": string;
  "candidats_voeu_confirme": number;
  "candidats_proposition_recue": number;
  "candidats_proposition_acceptee": number;
}

export interface Parcoursup2Data {
  filiere_generale: string;
  filiere_formation: string;
  filiere_detaillee?: string;
  etablissement: string;
  commune: string;
  departement: string;
  region: string;
  coordonnees_gps: string;
  eff_admis: number;
  eff_admis_neo?: number;
  capacite: number;
  taux_acces: number | null;
  note_moyenne: number | null;
  selectivite: string;
  pct_admis_neo_gen: number;
  pct_admis_neo_techno: number;
  pct_admis_neo_pro: number;
  lien_parcoursup?: string;
  pct_boursiers?: number;
  pct_admis_neo_boursiers?: number;
  eff_admis_boursiers_neo?: number;
  pct_admises_filles?: number;
  pct_admis_neo_sans_mention?: number;
  pct_admis_neo_mention_ab?: number;
  pct_admis_neo_mention_b?: number;
  pct_admis_neo_mention_tb?: number;
  pct_admis_neo_mention_tbf?: number;
  academie?: string;
  pct_admis_neo_meme_acad?: number;
  pct_admis_neo_meme_acad_idf?: number;
}

export interface OnboardingData {
  name: string;
  city: string;
  specialities: string[];
  averageBac: string;
  department: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  color?: "blue" | "emerald" | "amber" | "rose" | "purple" | "slate";
}
