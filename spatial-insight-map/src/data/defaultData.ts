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
export const SAMPLE_REGION_PREFERENCES: Record<string, RegionPreference> = (() => {
  const prefs: Record<string, RegionPreference> = {};

  const createPref = (
    code: string,
    name: string,
    pItems: string[] = [],
    dItems: string[] = []
  ): RegionPreference => ({
    code,
    name,
    prefItems: pItems.map((text, idx) => ({ id: `p-${code}-${idx}`, text, checked: true })),
    disprefItems: dItems.map((text, idx) => ({ id: `d-${code}-${idx}`, text, checked: true })),
  });

  // 1. 광역/주요 지역 (인천, 경기 등)
  prefs['28'] = createPref('28', '인천광역시', [], ['중국인 다수 거주지역']);
  prefs['41'] = createPref('41', '경기도', ['GTX / 광역교통 호재'], []);

  // 2. 경기도 주요 시/군 (27개)
  const gyeonggiCities: [string, string, string[], string[]][] = [
    ['41570', '김포시', [], ['중국인 다수 거주지역', '상습 교통 혼잡']],
    ['41190', '부천시', [], ['중국인 다수 거주지역', '노후주택 밀집']],
    ['41390', '시흥시', [], ['중국인 다수 거주지역']],
    ['41270', '안산시', [], ['중국인 다수 거주지역']],
    ['41271', '상록구', [], ['중국인 다수 거주지역']],
    ['41273', '단원구', [], ['중국인 다수 거주지역']],
    ['41590', '화성시', ['신축 아파트 단지', '직주근접 용이'], ['중국인 다수 거주지역']],
    ['41210', '광명시', ['지하철역 역세권'], ['중국인 다수 거주지역']],
    ['41410', '군포시', [], ['중국인 다수 거주지역']],
    ['41170', '안양시', ['우수한 학군 / 학원가'], ['중국인 다수 거주지역']],
    ['41171', '만안구', [], ['중국인 다수 거주지역', '노후주택 밀집']],
    ['41173', '동안구', ['우수한 학군 / 학원가', '상권 및 편의시설'], []],
    ['41110', '수원시', ['상권 및 편의시설'], []],
    ['41130', '성남시', ['우수한 학군 / 학원가', 'GTX / 광역교통 호재'], []],
    ['41150', '의정부시', [], ['노후주택 밀집']],
    ['41220', '평택시', ['신축 아파트 단지'], []],
    ['41250', '동두천시', [], ['노후주택 밀집']],
    ['41280', '고양시', ['공원 및 대형 녹지', 'GTX / 광역교통 호재'], []],
    ['41310', '구리시', ['지하철역 역세권'], []],
    ['41360', '남양주시', ['공원 및 대형 녹지'], []],
    ['41370', '오산시', [], []],
    ['41430', '의왕시', ['공원 및 대형 녹지'], []],
    ['41450', '하남시', ['신축 아파트 단지', '공원 및 대형 녹지'], []],
    ['41460', '용인시', ['우수한 학군 / 학원가', '신축 아파트 단지'], []],
    ['41480', '파주시', ['GTX / 광역교통 호재'], []],
    ['41500', '이천시', [], []],
    ['41550', '안성시', [], []],
    ['41610', '광주시', [], []],
    ['41630', '양주시', [], []],
    ['41650', '포천시', [], []],
    ['41670', '여주시', [], []],
  ];
  gyeonggiCities.forEach(([code, name, p, d]) => {
    prefs[code] = createPref(code, name, p, d);
  });

  // 3. 성남시 및 고양시 자치구/일반구 (6개)
  prefs['41131'] = createPref('41131', '수정구', [], ['노후주택 밀집']);
  prefs['41133'] = createPref('41133', '중원구', [], ['노후주택 밀집', '경사지 / 언덕 지형']);
  prefs['41135'] = createPref('41135', '분당구', ['우수한 학군 / 학원가', '공원 및 대형 녹지', '상권 및 편의시설'], []);
  prefs['41281'] = createPref('41281', '덕양구', ['GTX / 광역교통 호재'], []);
  prefs['41285'] = createPref('41285', '일산동구', ['공원 및 대형 녹지'], []);
  prefs['41287'] = createPref('41287', '일산서구', ['상권 및 편의시설'], []);

  // 4. 서울특별시 (11) 및 25개 자치구
  prefs['11'] = createPref('11', '서울특별시', ['우수한 학군 / 학원가', '직주근접 용이'], []);

  const seoulDistricts: [string, string, string[], string[]][] = [
    ['11110', '종로구', ['직주근접 용이', '상권 및 편의시설'], ['노후주택 밀집']],
    ['11140', '중구', ['직주근접 용이', '상권 및 편의시설'], []],
    ['11170', '용산구', ['직주근접 용이', '공원 및 대형 녹지'], []],
    ['11200', '성동구', ['직주근접 용이', '신축 아파트 단지'], []],
    ['11215', '광진구', ['지하철역 역세권', '공원 및 대형 녹지'], []],
    ['11230', '동대문구', ['지하철역 역세권'], ['노후주택 밀집']],
    ['11260', '중랑구', [], ['노후주택 밀집']],
    ['11290', '성북구', ['우수한 학군 / 학원가'], ['경사지 / 언덕 지형']],
    ['11305', '강북구', [], ['노후주택 밀집', '경사지 / 언덕 지형']],
    ['11320', '도봉구', ['공원 및 대형 녹지'], ['노후주택 밀집']],
    ['11350', '노원구', ['우수한 학군 / 학원가', '공원 및 대형 녹지'], []],
    ['11380', '은평구', ['GTX / 광역교통 호재'], ['경사지 / 언덕 지형']],
    ['11410', '서대문구', ['직주근접 용이'], ['경사지 / 언덕 지형']],
    ['11440', '마포구', ['직주근접 용이', '상권 및 편의시설', '지하철역 역세권'], []],
    ['11470', '양천구', ['우수한 학군 / 학원가'], ['중국인 다수 거주지역']],
    ['11500', '강서구', ['지하철역 역세권'], ['중국인 다수 거주지역']],
    ['11530', '구로구', ['지하철역 역세권'], ['중국인 다수 거주지역', '노후주택 밀집']],
    ['11545', '금천구', [], ['중국인 다수 거주지역', '노후주택 밀집']],
    ['11560', '영등포구', ['직주근접 용이', '지하철역 역세권'], ['중국인 다수 거주지역']],
    ['11590', '동작구', ['직주근접 용이', '지하철역 역세권'], ['경사지 / 언덕 지형']],
    ['11620', '관악구', ['지하철역 역세권'], ['중국인 다수 거주지역', '경사지 / 언덕 지형']],
    ['11650', '서초구', ['우수한 학군 / 학원가', '직주근접 용이', '공원 및 대형 녹지'], []],
    ['11680', '강남구', ['우수한 학군 / 학원가', '직주근접 용이', '상권 및 편의시설'], []],
    ['11710', '송파구', ['우수한 학군 / 학원가', '공원 및 대형 녹지', '상권 및 편의시설'], []],
    ['11740', '강동구', ['신축 아파트 단지', '공원 및 대형 녹지'], []],
  ];
  seoulDistricts.forEach(([code, name, p, d]) => {
    prefs[code] = createPref(code, name, p, d);
  });

  // 5. 강남구 행정동 (20개)
  const gangnamDongs: [string, string, string[], string[]][] = [
    ['1168051', '역삼1동', ['직주근접 용이', '상권 및 편의시설'], ['소음 / 유흥가 인접']],
    ['1168052', '역삼2동', ['우수한 학군 / 학원가', '지하철역 역세권'], []],
    ['1168053', '개포1동', ['신축 아파트 단지', '공원 및 대형 녹지'], []],
    ['1168054', '개포2동', ['신축 아파트 단지', '우수한 학군 / 학원가'], []],
    ['1168055', '개포4동', ['공원 및 대형 녹지'], []],
    ['1168056', '논현1동', ['지하철역 역세권', '상권 및 편의시설'], ['소음 / 유흥가 인접']],
    ['1168057', '논현2동', ['지하철역 역세권', '상권 및 편의시설'], []],
    ['1168058', '대치1동', ['우수한 학군 / 학원가'], []],
    ['1168059', '대치2동', ['우수한 학군 / 학원가', '상권 및 편의시설'], []],
    ['1168060', '대치4동', ['우수한 학군 / 학원가'], ['상습 교통 혼잡']],
    ['1168061', '삼성1동', ['지하철역 역세권', '상권 및 편의시설'], []],
    ['1168062', '삼성2동', ['지하철역 역세권', '우수한 학군 / 학원가'], []],
    ['1168063', '세곡동', ['공원 및 대형 녹지', '신축 아파트 단지'], []],
    ['1168064', '수서동', ['지하철역 역세권', 'GTX / 광역교통 호재'], []],
    ['1168065', '신사동', ['상권 및 편의시설', '지하철역 역세권'], []],
    ['1168066', '압구정동', ['우수한 학군 / 학원가', '상권 및 편의시설'], []],
    ['1168067', '일원1동', ['공원 및 대형 녹지'], []],
    ['1168068', '일원2동', ['공원 및 대형 녹지'], []],
    ['1168069', '일원본동', ['공원 및 대형 녹지', '우수한 학군 / 학원가'], []],
    ['1168070', '청담동', ['상권 및 편의시설', '공원 및 대형 녹지'], []],
  ];
  gangnamDongs.forEach(([code, name, p, d]) => {
    prefs[code] = createPref(code, name, p, d);
  });

  // 6. 마포구 행정동 (15개)
  const mapoDongs: [string, string, string[], string[]][] = [
    ['1144051', '공덕동', ['지하철역 역세권', '직주근접 용이'], []],
    ['1144052', '아현동', ['신축 아파트 단지', '지하철역 역세권'], []],
    ['1144053', '도화동', ['지하철역 역세권', '상권 및 편의시설'], []],
    ['1144054', '용강동', ['신축 아파트 단지', '상권 및 편의시설'], []],
    ['1144055', '대흥동', ['우수한 학군 / 학원가', '지하철역 역세권'], []],
    ['1144056', '염리동', ['신축 아파트 단지', '우수한 학군 / 학원가'], []],
    ['1144057', '신수동', ['지하철역 역세권'], []],
    ['1144058', '서교동', ['상권 및 편의시설', '지하철역 역세권'], ['소음 / 유흥가 인접']],
    ['1144059', '합정동', ['지하철역 역세권', '상권 및 편의시설'], []],
    ['1144060', '망원1동', ['상권 및 편의시설', '공원 및 대형 녹지'], []],
    ['1144061', '망원2동', ['공원 및 대형 녹지'], []],
    ['1144062', '연남동', ['상권 및 편의시설', '공원 및 대형 녹지'], []],
    ['1144063', '성산1동', ['공원 및 대형 녹지'], []],
    ['1144064', '성산2동', ['공원 및 대형 녹지', '지하철역 역세권'], []],
    ['1144065', '상암동', ['직주근접 용이', '공원 및 대형 녹지', '신축 아파트 단지'], []],
  ];
  mapoDongs.forEach(([code, name, p, d]) => {
    prefs[code] = createPref(code, name, p, d);
  });

  // 7. 분당구 행정동 (10개)
  const bundangDongs: [string, string, string[], string[]][] = [
    ['4113551', '분당동', ['공원 및 대형 녹지'], []],
    ['4113552', '수내1동', ['우수한 학군 / 학원가', '지하철역 역세권'], []],
    ['4113555', '정자동', ['상권 및 편의시설', '지하철역 역세권'], []],
    ['4113556', '정자1동', ['지하철역 역세권', '신축 아파트 단지'], []],
    ['4113558', '금곡동', ['공원 및 대형 녹지'], []],
    ['4113559', '구미동', ['공원 및 대형 녹지'], []],
    ['4113561', '삼평동', ['직주근접 용이', '신축 아파트 단지', '지하철역 역세권'], []],
    ['4113562', '백현동', ['신축 아파트 단지', '우수한 학군 / 학원가'], []],
    ['4113563', '운중동', ['공원 및 대형 녹지', '신축 아파트 단지'], []],
    ['4113567', '판교동', ['신축 아파트 단지', '공원 및 대형 녹지'], []],
  ];
  bundangDongs.forEach(([code, name, p, d]) => {
    prefs[code] = createPref(code, name, p, d);
  });

  return prefs;
})();

/**
 * Ensures all entries in regionPreferences are strictly keyed by their unique administrative code (code).
 * Normalizes any legacy or inconsistent data structures where keys may have been region names.
 */
export function sanitizeRegionPreferences(
  rawPrefs: Record<string, any> | undefined | null
): Record<string, RegionPreference> {
  if (!rawPrefs || typeof rawPrefs !== 'object') {
    return { ...SAMPLE_REGION_PREFERENCES };
  }

  const cleanMap: Record<string, RegionPreference> = {};

  Object.entries(rawPrefs).forEach(([key, val]) => {
    if (!val || typeof val !== 'object') return;

    const explicitCode = String(val.code || '').trim();
    const isKeyNumeric = /^\d+$/.test(key);
    const resolvedCode = explicitCode || (isKeyNumeric ? key : '');

    const sanitizedEntry: RegionPreference = {
      code: resolvedCode || key,
      name: val.name || key || `행정구역 ${resolvedCode || key}`,
      prefItems: Array.isArray(val.prefItems) ? val.prefItems : [],
      disprefItems: Array.isArray(val.disprefItems) ? val.disprefItems : [],
      lastUpdated: val.lastUpdated || new Date().toISOString(),
    };

    if (val.customColor && typeof val.customColor === 'string' && val.customColor.trim()) {
      sanitizedEntry.customColor = val.customColor.trim();
    }

    cleanMap[resolvedCode || key] = sanitizedEntry;
  });

  return cleanMap;
}


