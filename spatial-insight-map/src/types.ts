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
  lastUpdated?: string;
}

export interface LayerVisibility {
  boundary: boolean;      // Parent: 행정구역
  preference: boolean;    // 지역 선호도 (마스터)
  prefLevel1?: boolean;   // 1. 광역자치단체
  prefLevel2?: boolean;   // 2. 기초자치단체
  prefLevel3?: boolean;   // 3. 읍/면/동
}

export interface GeoJsonFeatureProperties {
  code: string;
  name: string;
  name_eng?: string;
  base_year?: string;
}
