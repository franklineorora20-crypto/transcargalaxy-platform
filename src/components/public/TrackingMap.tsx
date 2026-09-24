import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TrackingData } from '../../types';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom bus icon
const busIcon = new L.DivIcon({
  html: `<div style="background-color: #f59e0b; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #000; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
         </div>`,
  className: 'custom-bus-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface TrackingMapProps {
  trackingData: TrackingData;
}

const TOWN_COORDINATES: Record<string, [number, number]> = {
  'Rongai': [-1.396, 36.76],
  'Kisii': [-0.678, 34.77],
  'Ngong': [-1.363, 36.65],
  'Kiserian': [-1.433, 36.70],
  'Oyugis': [-0.505, 34.73],
  'Kendu Bay': [-0.360, 34.65],
  'Mogongo': [-0.730, 34.80],
  'Rongo': [-0.760, 34.60],
  'Kehancha': [-1.250, 34.63],
  'Bongo': [-1.150, 34.70],
  'Nairobi': [-1.2921, 36.8219],
  'Mombasa': [-4.0435, 39.6682],
  'Eldoret': [0.5143, 35.2698],
  'Kisumu': [-0.0917, 34.7680],
  'Nakuru': [-0.3031, 36.0800],
  'Bomet': [-0.7813, 35.3416],
  'Narok': [-1.0833, 35.8667],
  'Suswa': [-1.0500, 36.3500],
  'Kimuka': [-1.3000, 36.6000],
  'Matasia': [-1.3833, 36.7167],
};

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({ trackingData }) => {
  // Use provided coordinates or try to find origin/dest coordinates
  const originCoord = TOWN_COORDINATES[trackingData.origin] || [-1.2921, 36.8219];
  const destCoord = TOWN_COORDINATES[trackingData.destination] || [-0.678, 34.77];
  
  // Use actual bus coordinates from tracking data, fallback to interpolation
  let currentCoord: [number, number] = [originCoord[0], originCoord[1]];
  if (trackingData.coordinates) {
    currentCoord = [trackingData.coordinates.lat, trackingData.coordinates.lng];
  } else {
    // Basic interpolation based on percent completed
    const pct = (trackingData.percentCompleted || 0) / 100;
    currentCoord = [
      originCoord[0] + (destCoord[0] - originCoord[0]) * pct,
      originCoord[1] + (destCoord[1] - originCoord[1]) * pct
    ];
  }

  const routePath: [number, number][] = [
    originCoord,
    currentCoord,
    destCoord
  ];

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border-2 border-neutral-200 shadow-md mt-6 relative z-0">
      <MapContainer 
        center={currentCoord} 
        zoom={9} 
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <Polyline 
          positions={routePath} 
          pathOptions={{ color: '#000000', weight: 4, opacity: 0.5, dashArray: '5, 10' }} 
        />
        
        <Polyline 
          positions={[originCoord, currentCoord]} 
          pathOptions={{ color: '#f59e0b', weight: 5, opacity: 0.9 }} 
        />

        <Marker position={originCoord}>
          <Popup>
            <strong>Origin:</strong> {trackingData.origin}
          </Popup>
        </Marker>

        <Marker position={destCoord}>
          <Popup>
            <strong>Destination:</strong> {trackingData.destination}
          </Popup>
        </Marker>

        <Marker position={currentCoord} icon={busIcon}>
          <Popup>
            <div className="text-center">
              <strong className="block text-amber-600 mb-1">{trackingData.busRegistration}</strong>
              <div>Speed: {trackingData.speedKmH} km/h</div>
              <div>Status: {trackingData.status.replace('_', ' ')}</div>
            </div>
          </Popup>
        </Marker>

        <MapUpdater center={currentCoord} />
      </MapContainer>
    </div>
  );
};
