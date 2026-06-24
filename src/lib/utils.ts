import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OrientationData, Parcoursup2Data } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getFormationPotential = (f: Parcoursup2Data, userNote: number | null): 'secure' | 'realiste' | 'ambitieux' | 'sans_note' => {
  if (userNote === null || userNote === 0 || isNaN(userNote) || f.note_moyenne === null || isNaN(f.note_moyenne)) {
    return 'sans_note';
  }
  if (f.note_moyenne <= userNote - 0.5) {
    return 'secure';
  }
  if (f.note_moyenne > userNote - 0.5 && f.note_moyenne <= userNote + 0.5) {
    return 'realiste';
  }
  return 'ambitieux';
};

export const getPotentialColor = (potential: string) => {
  switch (potential) {
    case 'secure': return '#10b981'; // emerald-500
    case 'realiste': return '#fbbf24'; // amber-400
    case 'ambitieux': return '#f43f5e'; // rose-500
    default: return '#94a3b8'; // slate-400
  }
};

export const mapSupabaseData = (rawData: any[]): OrientationData[] => {
  return rawData.map(row => ({
    "specialites": row.specialites || "",
    "formation": row.formation || "",
    "candidats_voeu_confirme": Number(row.candidats_voeu_confirme || 0),
    "candidats_proposition_recue": Number(row.candidats_proposition_recue || 0),
    "candidats_proposition_acceptee": Number(row.candidats_proposition_acceptee || 0),
  }));
};

export function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}
