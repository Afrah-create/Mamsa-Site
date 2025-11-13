'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type MapLocation = {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
};

type MapLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (location: MapLocation) => void;
  height?: number;
};

type GoogleLatLngLiteral = { lat: number; lng: number };

type GoogleLatLng = { lat(): number; lng(): number };

type GoogleMapsEvent = { latLng: GoogleLatLng | null };

type GoogleMarker = {
  setPosition: (position: GoogleLatLngLiteral | null) => void;
};

type GoogleMap = {
  panTo: (position: GoogleLatLngLiteral) => void;
  setZoom: (zoom: number) => void;
  addListener: (eventName: string, handler: (event: GoogleMapsEvent) => void) => void;
};

type GoogleAutocompletePlace = {
  geometry?: { location?: GoogleLatLng };
  formatted_address?: string;
};

type GoogleAutocomplete = {
  addListener: (eventName: string, handler: () => void) => void;
  getPlace: () => GoogleAutocompletePlace;
};

type GoogleMapsNamespace = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: {
        center: GoogleLatLngLiteral;
        zoom: number;
        mapTypeControl: boolean;
        streetViewControl: boolean;
        fullscreenControl: boolean;
        clickableIcons: boolean;
      }
    ) => GoogleMap;
    Marker: new (options: { position: GoogleLatLngLiteral | null; map: GoogleMap; draggable: boolean }) => GoogleMarker;
    places: {
      Autocomplete: new (input: HTMLInputElement, options: { fields: string[]; types: string[] }) => GoogleAutocomplete;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
  }
  const google: GoogleMapsNamespace;
}

let googleMapsPromise: Promise<void> | null = null;

const loadGoogleMapsScript = (apiKey: string) => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window is undefined'));

  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.getElementById('google-maps-sdk') as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-sdk';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
};

const DEFAULT_CENTER = { lat: 0, lng: 0 };

export default function MapLocationPicker({
  latitude,
  longitude,
  onLocationChange,
  height = 340,
}: MapLocationPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'missing-key'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialCenter = useMemo(() => {
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      return { lat: latitude, lng: longitude };
    }
    return DEFAULT_CENTER;
  }, [latitude, longitude]);

  useEffect(() => {
    if (!apiKey) {
      setStatus('missing-key');
      setErrorMessage('Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.');
      return;
    }

    let cancelled = false;

    const initialiseMap = async () => {
      try {
        setStatus('loading');
        await loadGoogleMapsScript(apiKey);
        if (cancelled) return;

        const googleNamespace = window.google;
        if (!googleNamespace) {
          throw new Error('Google Maps SDK did not initialise correctly.');
        }

        const mapInstance = new googleNamespace.maps.Map(mapContainerRef.current as HTMLDivElement, {
          center: initialCenter,
          zoom: typeof latitude === 'number' && typeof longitude === 'number' ? 13 : 2,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });

        mapRef.current = mapInstance;

        const marker = new googleNamespace.maps.Marker({
          position:
            typeof latitude === 'number' && typeof longitude === 'number'
              ? { lat: latitude, lng: longitude }
              : null,
          map: mapInstance,
          draggable: false,
        });

        markerRef.current = marker;

        mapInstance.addListener('click', ({ latLng }) => {
          if (!latLng) return;
          const newLocation = {
            latitude: latLng.lat(),
            longitude: latLng.lng(),
          };
          updateMarker(newLocation);
          onLocationChange(newLocation);
        });

        if (searchInputRef.current) {
          const autocomplete = new googleNamespace.maps.places.Autocomplete(searchInputRef.current, {
            fields: ['geometry', 'formatted_address'],
            types: ['geocode'],
          });

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
              return;
            }

            const { lat, lng } = place.geometry.location;
            const literal = { lat: lat(), lng: lng() };

            const selectedLocation = {
              latitude: literal.lat,
              longitude: literal.lng,
              formattedAddress: place.formatted_address,
            };

            mapInstance.panTo(literal);
            mapInstance.setZoom(15);
            updateMarker(selectedLocation);
            onLocationChange(selectedLocation);
          });
        }

        setStatus('ready');
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load map.');
        }
      }
    };

    initialiseMap();

    return () => {
      cancelled = true;
    };
  }, [apiKey, initialCenter, latitude, longitude, onLocationChange]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      const position = { lat: latitude, lng: longitude };
      markerRef.current.setPosition(position);
      mapRef.current.panTo(position);
    }
  }, [latitude, longitude]);

  const updateMarker = (location: MapLocation) => {
    if (!markerRef.current) return;
    markerRef.current.setPosition({ lat: location.latitude, lng: location.longitude });
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Search for an address or drop a pin</label>
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Search by address, place, or coordinates..."
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        disabled={status !== 'ready' && status !== 'loading'}
      />

      <div
        ref={mapContainerRef}
        className="w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
        style={{ height }}
      />

      {status === 'missing-key' && (
        <p className="text-sm text-red-600">
          Google Maps API key is missing. Please provide <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment.
        </p>
      )}

      {status === 'error' && errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {status === 'loading' && (
        <p className="text-sm text-gray-500">Loading map…</p>
      )}
    </div>
  );
}


