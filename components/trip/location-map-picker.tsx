'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Layers, Loader2, Sparkles } from 'lucide-react';

interface LocationMapPickerProps {
  initialLocation: string;
  onLocationSelected: (locationName: string, coords?: { lat: number; lng: number }) => void;
}

type TileProvider = 'google_streets' | 'google_terrain' | 'google_satellite' | 'osm';

export function LocationMapPicker({
  initialLocation,
  onLocationSelected,
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const [tileProvider, setTileProvider] = useState<TileProvider>('google_terrain');
  const [isLocating, setIsLocating] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState(initialLocation);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 9.9312,
    lng: 76.2673, // Default to Kochi, Kerala
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Tile URL definitions
  const tileConfigs: Record<TileProvider, { url: string; label: string; maxZoom: number }> = {
    google_terrain: {
      url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      label: 'Google Terrain',
      maxZoom: 20,
    },
    google_streets: {
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      label: 'Google Roads',
      maxZoom: 20,
    },
    google_satellite: {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      label: 'Google Satellite',
      maxZoom: 20,
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      label: 'OpenStreetMap',
      maxZoom: 19,
    },
  };

  // Reverse geocode coordinate into city/region name
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            'User-Agent': 'WanderlyApp/1.0',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.suburb ||
          data.address?.county ||
          data.name ||
          'Selected Location';
        const state = data.address?.state ? `, ${data.address.state}` : '';
        const fullName = `${city}${state}`;

        setSelectedPlaceName(fullName);
        onLocationSelected(fullName, { lat, lng });
      } else {
        const fallback = `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`;
        setSelectedPlaceName(fallback);
        onLocationSelected(fallback, { lat, lng });
      }
    } catch {
      const fallback = `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`;
      setSelectedPlaceName(fallback);
      onLocationSelected(fallback, { lat, lng });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      if (!isMounted) return;

      // Clean existing instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Create custom pin icon (Clean Black & White High-Contrast Pin)
      const customPin = L.divIcon({
        className: 'custom-wanderly-pin',
        html: `
          <div style="
            position: relative;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              position: absolute;
              width: 36px;
              height: 36px;
              background: rgba(0, 0, 0, 0.25);
              border-radius: 50%;
              animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 28px;
              height: 28px;
              background: #090D16;
              border: 2.5px solid #FFFFFF;
              border-radius: 50%;
              box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #FFFFFF;
            ">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3" fill="#FFFFFF"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Default center: India (Kochi, Kerala: 9.9312, 76.2673)
      const initialLat = selectedCoords.lat;
      const initialLng = selectedCoords.lng;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 11,
        zoomControl: false,
      });

      // Add zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add base tile layer
      const currentConfig = tileConfigs[tileProvider];
      const tiles = L.tileLayer(currentConfig.url, {
        maxZoom: currentConfig.maxZoom,
        attribution: '&copy; Google / OpenStreetMap',
      }).addTo(map);

      tileLayerRef.current = tiles;

      // Add marker
      const marker = L.marker([initialLat, initialLng], {
        icon: customPin,
        draggable: true,
      }).addTo(map);

      // Marker drag event
      marker.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setSelectedCoords({ lat, lng });
        reverseGeocode(lat, lng);
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Click to pick location
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setSelectedCoords({ lat, lng });
        reverseGeocode(lat, lng);
      });
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch tile layer
  const handleTileChange = async (provider: TileProvider) => {
    setTileProvider(provider);
    if (!mapInstanceRef.current) return;

    const L = (await import('leaflet')).default;
    const config = tileConfigs[provider];

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newTiles = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: '&copy; Google / OpenStreetMap',
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTiles;
  };

  // Fly to user GPS
  const handleFlyToGPS = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedCoords({ lat, lng });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 13, { duration: 1.5 });
          markerRef.current.setLatLng([lat, lng]);
        }

        reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 5000 }
    );
  };

  return (
    <div className="bg-white rounded-[22px] p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3">
      {/* Map Control Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-900 font-sans">Pinpoint On Map</span>
        </div>

        {/* Tile Provider Switcher */}
        <div className="flex items-center gap-1">
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => handleTileChange('google_terrain')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                tileProvider === 'google_terrain'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Terrain
            </button>
            <button
              type="button"
              onClick={() => handleTileChange('google_streets')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                tileProvider === 'google_streets'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Roads
            </button>
            <button
              type="button"
              onClick={() => handleTileChange('google_satellite')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                tileProvider === 'google_satellite'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Selected location feedback pill */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 px-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 truncate block">
              {isGeocoding ? 'Detecting place...' : selectedPlaceName || 'Tap map to choose location'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">
              {selectedCoords.lat.toFixed(4)}°N, {selectedCoords.lng.toFixed(4)}°E
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFlyToGPS}
          disabled={isLocating}
          className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all shrink-0 cursor-pointer"
        >
          {isLocating ? <Loader2 className="w-3 h-3 animate-spin text-emerald-600" /> : <Navigation className="w-3 h-3 text-emerald-600" />}
          <span>Use GPS</span>
        </button>
      </div>

      {/* Interactive Map Container */}
      <div className="relative w-full h-56 rounded-[18px] overflow-hidden border border-slate-200 shadow-inner z-0">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Tap hint overlay */}
        <div className="absolute bottom-2 left-2 right-2 pointer-events-none z-[1000] flex justify-center">
          <div className="bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-white/10">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Tap map to drop pin & select starting place</span>
          </div>
        </div>
      </div>
    </div>
  );
}
