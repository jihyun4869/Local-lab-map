import { CheckItem, RegionPreference } from '../types';

export const DEFAULT_PREF_ITEMS: CheckItem[] = [];

export const DEFAULT_DISPREF_ITEMS: CheckItem[] = [];

// Helper to get or initialize region preference
export function getInitialRegionPref(code: string, name: string): RegionPreference {
  return {
    code,
    name,
    prefItems: [],
    disprefItems: [],
  };
}

// Sample initial preferences for demonstration (without example text)
export const SAMPLE_REGION_PREFERENCES: Record<string, RegionPreference> = {
  // 서울 강남구 (11230)
  '11230': {
    code: '11230',
    name: '강남구',
    prefItems: [{ id: 'p_pref', text: '선호', checked: true }],
    disprefItems: []
  },
  // 서울 마포구 (11140)
  '11140': {
    code: '11140',
    name: '마포구',
    prefItems: [{ id: 'p_pref', text: '선호', checked: true }],
    disprefItems: []
  },
  // 성남시 분당구 (41135)
  '41135': {
    code: '41135',
    name: '성남시 분당구',
    prefItems: [{ id: 'p_pref', text: '선호', checked: true }],
    disprefItems: []
  },
  // 역삼1동 (1123051)
  '1123051': {
    code: '1123051',
    name: '역삼1동',
    prefItems: [{ id: 'p_pref', text: '선호', checked: true }],
    disprefItems: []
  }
};
