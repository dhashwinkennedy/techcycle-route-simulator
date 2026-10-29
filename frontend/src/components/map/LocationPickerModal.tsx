import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { createLocationPickerIcon } from './mapIcons';
import { MapPin, Check } from 'lucide-react';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  title?: string;
}

const MapClickHandler: React.FC<{ onPositionChange: (lat: number, lng: number) => void }> = ({
  onPositionChange,
}) => {
  useMapEvents({
    click(e) {
      onPositionChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
};

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat = 13.0827,
  initialLng = 80.2707,
  title = 'Pick Location on Map',
}) => {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
    }
  }, [initialLat, initialLng, isOpen]);

  const geoapifyKey = import.meta.env.VITE_GEOAPIFY_MAP_KEY;
  const isGeoapifyConfigured = Boolean(geoapifyKey && geoapifyKey !== 'your_geoapify_map_key');

  const tileUrl = isGeoapifyConfigured
    ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${geoapifyKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = isGeoapifyConfigured
    ? 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const handleConfirm = () => {
    onSelectLocation(position[0], position[1]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Click anywhere on the map to place the location pin, then confirm."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-700 relative">
          {isOpen && (
            <MapContainer
              center={position}
              zoom={13}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer url={tileUrl} attribution={attribution} />
              <Marker
                position={position}
                icon={createLocationPickerIcon()}
                draggable={true}
                eventHandlers={{
                  dragend(e) {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    setPosition([Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6))]);
                  },
                }}
              />
              <MapClickHandler
                onPositionChange={(lat, lng) => setPosition([lat, lng])}
              />
            </MapContainer>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Selected Coordinates:</span>
            <span className="font-mono text-emerald-300 font-medium">
              Lat: {position[0]}, Lng: {position[1]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              icon={<Check className="w-4 h-4" />}
            >
              Use this Location
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
