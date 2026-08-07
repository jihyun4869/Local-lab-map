import { CheckItem, RegionPreference } from '../types';

export const DEFAULT_PREF_ITEMS: CheckItem[] = [];

export const DEFAULT_DISPREF_ITEMS: CheckItem[] = [
  { id: 'dispref-china', text: '중국인 다수 거주지역', checked: false },
];

// Helper to get or initialize region preference
export function getInitialRegionPref(code: string, name: string): RegionPreference {
  return {
    code,
    name,
    prefItems: [],
    disprefItems: DEFAULT_DISPREF_ITEMS.map((item) => ({ ...item })),
  };
}

const createChinaDisprefRegion = (code: string, name: string): RegionPreference => ({
  code,
  name,
  prefItems: [],
  disprefItems: [
    { id: 'dispref-china', text: '중국인 다수 거주지역', checked: true },
  ],
});

// Sample initial preferences configured according to specified non-preferred regions
export const SAMPLE_REGION_PREFERENCES: Record<string, RegionPreference> = {
  // 인천광역시
  '28': createChinaDisprefRegion('28', '인천광역시'),
  // 김포시
  '41570': createChinaDisprefRegion('41570', '김포시'),
  // 부천시
  '41190': createChinaDisprefRegion('41190', '부천시'),
  // 시흥시
  '41390': createChinaDisprefRegion('41390', '시흥시'),
  // 안산시
  '41270': createChinaDisprefRegion('41270', '안산시'),
  // 안산시 상록구
  '41271': createChinaDisprefRegion('41271', '상록구'),
  // 안산시 단원구
  '41273': createChinaDisprefRegion('41273', '단원구'),
  // 화성시
  '41590': createChinaDisprefRegion('41590', '화성시'),
  // 광명시
  '41210': createChinaDisprefRegion('41210', '광명시'),
  // 군포시
  '41410': createChinaDisprefRegion('41410', '군포시'),
  // 안양시
  '41170': createChinaDisprefRegion('41170', '안양시'),
  // 안양시 만안구
  '41171': createChinaDisprefRegion('41171', '만안구'),
  // 안양시 동안구
  '41173': createChinaDisprefRegion('41173', '동안구'),
  // 서울 강서구
  '11500': createChinaDisprefRegion('11500', '강서구'),
  // 서울 양천구
  '11470': createChinaDisprefRegion('11470', '양천구'),
  // 서울 구로구
  '11530': createChinaDisprefRegion('11530', '구로구'),
  // 서울 영등포구
  '11560': createChinaDisprefRegion('11560', '영등포구'),
  // 서울 금천구
  '11545': createChinaDisprefRegion('11545', '금천구'),
  // 서울 관악구
  '11620': createChinaDisprefRegion('11620', '관악구'),
};

