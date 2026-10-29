import L from 'leaflet';
import { PickupPoint, Facility } from '../../types';

// Helper to create HTML div icons
export function createFacilityIcon() {
  return L.divIcon({
    className: 'custom-facility-pin',
    html: `
      <div style="
        background-color: #059669;
        color: white;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
          <path d="M10 6h4"/>
          <path d="M10 10h4"/>
          <path d="M10 14h4"/>
          <path d="M10 18h4"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

export function createPickupIcon(point: PickupPoint, stopNumber?: number) {
  const status = point.status.toLowerCase();
  
  // Status background & border colors
  let bg = '#334155'; // normal
  let border = '#64748b';
  let badgeText = '';

  if (status === 'critical') {
    bg = '#e11d48'; // rose
    border = '#fda4af';
    badgeText = '!';
  } else if (status === 'urgent') {
    bg = '#d97706'; // amber
    border = '#fde68a';
    badgeText = '▲';
  } else if (status === 'due') {
    bg = '#ca8a04'; // yellow
    border = '#fef08a';
    badgeText = '●';
  }

  // Category glyph
  const cat = (point.category || '').toLowerCase();
  let iconSvg = '';
  if (cat.includes('apart') || cat.includes('resident')) {
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
  } else if (cat.includes('college') || cat.includes('school') || cat.includes('hospital')) {
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/></svg>';
  } else {
    // business / it shop / office
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
  }

  const stopBadge = stopNumber !== undefined ? `
    <div style="
      position: absolute;
      top: -8px;
      right: -8px;
      background: #0284c7;
      color: white;
      font-weight: bold;
      font-size: 11px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    ">
      ${stopNumber}
    </div>
  ` : '';

  return L.divIcon({
    className: 'custom-pickup-pin',
    html: `
      <div style="
        position: relative;
        background-color: ${bg};
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid ${border};
        box-shadow: 0 3px 8px rgba(0,0,0,0.5);
      ">
        ${iconSvg}
        ${stopBadge}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

export function createLocationPickerIcon() {
  return L.divIcon({
    className: 'custom-picker-pin',
    html: `
      <div style="
        background-color: #3b82f6;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

export const ROUTE_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#3b82f6', // blue
];
