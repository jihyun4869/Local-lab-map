export interface CheckItem {
  id: string;
  text: string;
  checked: boolean;
  isCustom?: boolean;
}

export interface RegionPreference {
  code: string;
  name: string;
  prefItems: CheckItem[];
  disprefItems: CheckItem[];
  customColor?: string; // Optional per-region custom color override
  lastUpdated?: string;
}

export interface DrawnPoint {
  lat: number;
  lng: number;
}

export interface DrawnShape {
  id: string;
  type: 'line' | 'arrow' | 'rectangle' | 'circle' | 'triangle' | 'blockArrow' | 'text' | 'freeline' | 'freepoly';
  points: DrawnPoint[]; // LatLng objects [{ lat, lng }] - safe for Firestore (no nested arrays)
  text?: string;
  strokeColor: string;
  fillColor: string; // 'none', 'semi' or hex/rgba
  strokeWidth: number;
  fontSize?: number;
}

export type ShapeToolType =
  | 'pointer'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'blockArrow'
  | 'text'
  | 'freeline'
  | 'freepoly';

export interface ColoringPreset {
  id: string;
  name: string;
  preferences: Record<string, RegionPreference>;
  shapes?: DrawnShape[];
  createdAt: string;
}

export interface LayerVisibility {
  boundary: boolean;      // Parent: 행정구역
  preference: boolean;    // 지역 선호도 (마스터)
  prefLevel1?: boolean;   // 1. 광역자치단체
  prefLevel2?: boolean;   // 2. 기초자치단체
  prefLevel3?: boolean;   // 3. 읍/면/동
  shapes?: boolean;       // 4. 도형삽입
}

export interface GeoJsonFeatureProperties {
  code: string;
  name: string;
  name_eng?: string;
  base_year?: string;
}

export interface LegendColors {
  prefColor: string;    // Base hex color for 선호 우세 (default #3b82f6)
  tieColor: string;     // Base hex color for 선호/비선호 동률 (default #a855f7)
  disprefColor: string; // Base hex color for 비선호 우세 (default #ef4444)
}

export const DEFAULT_LEGEND_COLORS: LegendColors = {
  prefColor: '#3b82f6',
  tieColor: '#a855f7',
  disprefColor: '#ef4444',
};
