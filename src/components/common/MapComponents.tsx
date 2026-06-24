import React, { useEffect, useRef } from 'react';
import { useMap, Marker } from 'react-leaflet';
import L from 'leaflet';

export function MapUpdater({ center, zoom, department, formations }: { center: [number, number], zoom: number, department?: string, formations: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    // 1. If we have a specific department, focus on it
    if (department && department.toLowerCase() !== 'toute la france' && formations.length > 0 && center[0] === 46.603354) {
      const departmentMarkers = formations.filter(f => 
        f.departement.toLowerCase() === department.toLowerCase() && f.position
      );
      
      if (departmentMarkers.length > 0) {
        const bounds = L.latLngBounds(departmentMarkers.map(f => f.position));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
        return;
      }
    }
    
    // 2. Otherwise use the center and zoom provided
    map.setView(center, zoom);
  }, [center, zoom, department, formations, map]);
  
  return null;
}

export function MarkerWithAutoPopup({ position, icon, children, timestamp }: any) {
  const markerRef = useRef<L.Marker>(null);
  
  useEffect(() => {
    if (timestamp && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [timestamp]);
  
  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
}
