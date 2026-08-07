import { AdminLevel } from './koreaGeoJson';
import { RegionPreference } from '../types';

export interface ChildRegionInfo {
  code: string;
  name: string;
  level: AdminLevel;
  parentCode?: string;
  parentName?: string;
}

// Global cache of features from loaded GeoJSON
let geoJsonFeaturesCache: {
  level1?: any[];
  level2?: any[];
  level3?: any[];
  level4?: any[];
} = {};

export function setGeoJsonFeaturesCache(features: {
  level1?: any[];
  level2?: any[];
  level3?: any[];
  level4?: any[];
}) {
  geoJsonFeaturesCache = features;
}

// Nationwide Fallback Hierarchy Database
export const SIDO_LIST: ChildRegionInfo[] = [
  { code: '11', name: '서울특별시', level: 1 },
  { code: '26', name: '부산광역시', level: 1 },
  { code: '27', name: '대구광역시', level: 1 },
  { code: '28', name: '인천광역시', level: 1 },
  { code: '29', name: '광주광역시', level: 1 },
  { code: '30', name: '대전광역시', level: 1 },
  { code: '31', name: '울산광역시', level: 1 },
  { code: '36', name: '세종특별자치시', level: 1 },
  { code: '41', name: '경기도', level: 1 },
  { code: '42', name: '강원특별자치도', level: 1 },
  { code: '43', name: '충청북도', level: 1 },
  { code: '44', name: '충청남도', level: 1 },
  { code: '45', name: '전북특별자치도', level: 1 },
  { code: '46', name: '전라남도', level: 1 },
  { code: '47', name: '경상북도', level: 1 },
  { code: '48', name: '경상남도', level: 1 },
  { code: '50', name: '제주특별자치도', level: 1 },
];

export const FALLBACK_CHILDREN_MAP: Record<string, ChildRegionInfo[]> = {
  // 서울특별시 (11 / 서울)
  '11': [
    { code: '11110', name: '종로구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11140', name: '중구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11170', name: '용산구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11200', name: '성동구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11215', name: '광진구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11230', name: '동대문구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11260', name: '중랑구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11290', name: '성북구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11305', name: '강북구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11320', name: '도봉구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11350', name: '노원구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11380', name: '은평구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11410', name: '서대문구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11440', name: '마포구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11470', name: '양천구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11500', name: '강서구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11530', name: '구로구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11545', name: '금천구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11560', name: '영등포구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11590', name: '동작구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11620', name: '관악구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11650', name: '서초구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11680', name: '강남구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11710', name: '송파구', level: 2, parentCode: '11', parentName: '서울특별시' },
    { code: '11740', name: '강동구', level: 2, parentCode: '11', parentName: '서울특별시' },
  ],
  // 경기도 (41)
  '41': [
    { code: '41110', name: '수원시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41130', name: '성남시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41150', name: '의정부시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41170', name: '안양시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41190', name: '부천시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41210', name: '광명시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41220', name: '평택시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41250', name: '동두천시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41270', name: '안산시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41280', name: '고양시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41310', name: '구리시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41360', name: '남양주시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41370', name: '오산시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41390', name: '시흥시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41410', name: '군포시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41430', name: '의왕시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41450', name: '하남시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41460', name: '용인시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41480', name: '파주시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41500', name: '이천시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41550', name: '안성시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41570', name: '김포시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41590', name: '화성시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41610', name: '광주시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41630', name: '양주시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41650', name: '포천시', level: 2, parentCode: '41', parentName: '경기도' },
    { code: '41670', name: '여주시', level: 2, parentCode: '41', parentName: '경기도' },
  ],
  // 성남시 (41130)
  '41130': [
    { code: '41131', name: '수정구', level: 3, parentCode: '41130', parentName: '성남시' },
    { code: '41133', name: '중원구', level: 3, parentCode: '41130', parentName: '성남시' },
    { code: '41135', name: '분당구', level: 3, parentCode: '41130', parentName: '성남시' },
  ],
  // 고양시 (41280)
  '41280': [
    { code: '41281', name: '덕양구', level: 3, parentCode: '41280', parentName: '고양시' },
    { code: '41285', name: '일산동구', level: 3, parentCode: '41280', parentName: '고양시' },
    { code: '41287', name: '일산서구', level: 3, parentCode: '41280', parentName: '고양시' },
  ],
  // 강남구 (11680 / 11230)
  '11230': [
    { code: '1123051', name: '역삼1동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123052', name: '역삼2동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123053', name: '개포1동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123054', name: '개포2동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123055', name: '개포4동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123056', name: '논현1동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123057', name: '논현2동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123058', name: '대치1동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123059', name: '대치2동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123060', name: '대치4동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123061', name: '삼성1동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123062', name: '삼성2동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123063', name: '세곡동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123064', name: '수서동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123065', name: '신사동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123066', name: '압구정동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123067', name: '일원1동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123068', name: '일원2동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123069', name: '일원본동', level: 4, parentCode: '11230', parentName: '강남구' },
    { code: '1123070', name: '청담동', level: 4, parentCode: '11230', parentName: '강남구' },
  ],
  '11680': [
    { code: '1168051', name: '역삼1동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168052', name: '역삼2동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168053', name: '개포1동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168054', name: '개포2동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168055', name: '개포4동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168056', name: '논현1동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168057', name: '논현2동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168058', name: '대치1동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168059', name: '대치2동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168060', name: '대치4동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168061', name: '삼성1동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168062', name: '삼성2동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168063', name: '세곡동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168064', name: '수서동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168065', name: '신사동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168066', name: '압구정동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168067', name: '일원1동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168068', name: '일원2동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168069', name: '일원본동', level: 4, parentCode: '11680', parentName: '강남구' },
    { code: '1168070', name: '청담동', level: 4, parentCode: '11680', parentName: '강남구' },
  ],
  // 마포구 (11140)
  '11140': [
    { code: '1114051', name: '공덕동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114052', name: '아현동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114053', name: '도화동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114054', name: '용강동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114055', name: '대흥동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114056', name: '염리동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114057', name: '신수동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114058', name: '서교동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114059', name: '합정동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114060', name: '망원1동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114061', name: '망원2동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114062', name: '연남동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114063', name: '성산1동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114064', name: '성산2동', level: 4, parentCode: '11140', parentName: '마포구' },
    { code: '1114065', name: '상암동', level: 4, parentCode: '11140', parentName: '마포구' },
  ],
  // 분당구 (41135)
  '41135': [
    { code: '4113551', name: '분당동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113552', name: '수내1동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113553', name: '수내2동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113554', name: '수내3동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113555', name: '정자동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113556', name: '정자1동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113557', name: '정자2동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113558', name: '금곡동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113559', name: '구미동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113560', name: '구미1동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113561', name: '삼평동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113562', name: '백현동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113563', name: '운중동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113564', name: '야탑1동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113565', name: '야탑2동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113566', name: '야탑3동', level: 4, parentCode: '41135', parentName: '분당구' },
    { code: '4113567', name: '판교동', level: 4, parentCode: '41135', parentName: '분당구' },
  ]
};

// Main Helper: Get child regions for a given parent
export function getChildRegionsFor(
  parentCode: string,
  parentName: string,
  parentLevel?: AdminLevel
): ChildRegionInfo[] {
  const pCode = String(parentCode || '').trim();
  const pName = String(parentName || '').trim();

  // 1. Try key lookup in FALLBACK_CHILDREN_MAP
  let children: ChildRegionInfo[] = [];
  if (pCode && FALLBACK_CHILDREN_MAP[pCode]) {
    children = [...FALLBACK_CHILDREN_MAP[pCode]];
  } else if (pName && FALLBACK_CHILDREN_MAP[pName]) {
    children = [...FALLBACK_CHILDREN_MAP[pName]];
  } else {
    // Try matching key by name (e.g. '서울특별시' or '강남구' or '마포구' or '분당구')
    const key = Object.keys(FALLBACK_CHILDREN_MAP).find(k => {
      const targetList = FALLBACK_CHILDREN_MAP[k];
      return targetList.some(item => item.parentName === pName || item.parentCode === pCode);
    });
    if (key) {
      children = [...FALLBACK_CHILDREN_MAP[key]];
    }
  }

  // 2. Try dynamically extracting from cached GeoJSON features
  if (geoJsonFeaturesCache) {
    const dynamicList: ChildRegionInfo[] = [];

    // If Level 1 (e.g. '서울특별시', code '11') -> extract Level 2/3 features
    if (parentLevel === 1 || pCode.length <= 2 || pName.includes('서울') || pName.includes('경기') || pName.includes('인천')) {
      const l2 = geoJsonFeaturesCache.level2 || [];
      const l3 = geoJsonFeaturesCache.level3 || [];

      [...l2, ...l3].forEach(f => {
        const props = f.properties || {};
        const code = String(props.code || props.SIG_CD || '').trim();
        const name = String(props.name || props.SIG_KOR_NM || '').trim();
        const ctpName = String(props.CTP_KOR_NM || props.sidoName || '').trim();

        if (code.startsWith(pCode) || (pName && (ctpName.includes(pName) || pName.includes(ctpName) || (pName.includes('서울') && name.endsWith('구'))))) {
          if (name && !dynamicList.some(x => x.name === name)) {
            dynamicList.push({
              code: code || name,
              name,
              level: props.level || 2,
              parentCode: pCode,
              parentName: pName
            });
          }
        }
      });
    }

    // If Level 2 / 3 (e.g. '강남구', '분당구') -> extract Level 4 features
    if (parentLevel === 2 || parentLevel === 3 || pCode.length >= 4) {
      const l4 = geoJsonFeaturesCache.level4 || [];

      l4.forEach(f => {
        const props = f.properties || {};
        const code = String(props.code || props.EMD_CD || '').trim();
        const name = String(props.name || props.EMD_KOR_NM || '').trim();
        const fullName = String(props.fullName || '').trim();

        const matchByCode = pCode && code.startsWith(pCode.substring(0, 4));
        const matchByName = pName && (fullName.includes(pName) || props.SIG_KOR_NM === pName);

        if (matchByCode || matchByName) {
          if (name && !dynamicList.some(x => x.name === name)) {
            dynamicList.push({
              code: code || name,
              name,
              level: 4,
              parentCode: pCode,
              parentName: pName
            });
          }
        }
      });
    }

    if (dynamicList.length > 0) {
      // Merge unique
      dynamicList.forEach(item => {
        if (!children.some(c => c.name === item.name)) {
          children.push(item);
        }
      });
    }
  }

  return children;
}

// Recursively collect all descendant codes/names for preference aggregation
export function getAllDescendantsFor(
  parentCode: string,
  parentName: string,
  parentLevel?: AdminLevel
): ChildRegionInfo[] {
  const directChildren = getChildRegionsFor(parentCode, parentName, parentLevel);
  const allDescendants: ChildRegionInfo[] = [...directChildren];

  directChildren.forEach(child => {
    if (child.level < 4) {
      const grandChildren = getAllDescendantsFor(child.code, child.name, child.level);
      grandChildren.forEach(gc => {
        if (!allDescendants.some(x => x.name === gc.name || (x.code && gc.code && x.code === gc.code))) {
          allDescendants.push(gc);
        }
      });
    }
  });

  return allDescendants;
}

// Calculate total aggregated preferences (parent + all descendants)
export function getAggregatedPreferenceScores(
  regionCode: string,
  regionName: string,
  level: AdminLevel | undefined,
  regionPreferences: Record<string, RegionPreference>
): { prefCount: number; disprefCount: number; netScore: number } {
  let prefCount = 0;
  let disprefCount = 0;

  // 1. Parent's own direct preferences
  const direct = regionPreferences[regionCode] || regionPreferences[regionName];
  if (direct) {
    prefCount += direct.prefItems ? direct.prefItems.filter(i => i.checked).length : 0;
    disprefCount += direct.disprefItems ? direct.disprefItems.filter(i => i.checked).length : 0;
  }

  // 2. All descendant regions' preferences
  const descendants = getAllDescendantsFor(regionCode, regionName, level);

  descendants.forEach(desc => {
    const descPref = regionPreferences[desc.code] || regionPreferences[desc.name];
    if (descPref) {
      prefCount += descPref.prefItems ? descPref.prefItems.filter(i => i.checked).length : 0;
      disprefCount += descPref.disprefItems ? descPref.disprefItems.filter(i => i.checked).length : 0;
    }
  });

  return {
    prefCount,
    disprefCount,
    netScore: prefCount - disprefCount
  };
}
