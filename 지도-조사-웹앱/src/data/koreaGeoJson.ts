import { FeatureCollection, Feature } from 'geojson';
import { setGeoJsonFeaturesCache } from './regionHierarchy';

// Helper type for our 4 administrative levels
export type AdminLevel = 1 | 2 | 3 | 4;

export interface AdminLevelInfo {
  level: AdminLevel;
  name: string;
  descriptionMain: string;
  descriptionSub?: string;
  zoomCondition: string;
  zoomLabel: string;
  description: string;
  zoomRangeText: string;
}

export const ADMIN_LEVEL_INFOS: Record<AdminLevel, AdminLevelInfo> = {
  1: {
    level: 1,
    name: '광역자치단체',
    descriptionMain: '특별시 · 광역시 · 도 · 특별자치시 · 특별자치도',
    descriptionSub: '',
    zoomCondition: 'Zoom < 9.5',
    zoomLabel: '(축소 레벨)',
    description: '특별시 · 광역시 · 도 · 특별자치시 · 특별자치도',
    zoomRangeText: 'Zoom < 9.5 (축소 레벨)',
  },
  2: {
    level: 2,
    name: '기초자치단체',
    descriptionMain: '자치시 · 자치군 · 자치구 · 일반구',
    descriptionSub: '(통합 자치시 경계)',
    zoomCondition: '9.5 ≤ Zoom < 12.5',
    zoomLabel: '(중간 레벨)',
    description: '자치시 · 자치군 · 자치구 · 일반구',
    zoomRangeText: '9.5 ≤ Zoom < 12.5 (중간 레벨)',
  },
  3: {
    level: 3,
    name: '3단계 행정구역',
    descriptionMain: '전국 읍 · 면 · 동',
    descriptionSub: '(행정동 / 법정동)',
    zoomCondition: 'Zoom ≥ 12.5',
    zoomLabel: '(확대 레벨)',
    description: '전국 읍 · 면 · 동 (행정동 / 법정동)',
    zoomRangeText: 'Zoom ≥ 12.5 (확대 레벨)',
  },
  4: {
    level: 4,
    name: '3단계 행정구역',
    descriptionMain: '전국 읍 · 면 · 동',
    descriptionSub: '(행정동 / 법정동)',
    zoomCondition: 'Zoom ≥ 12.5',
    zoomLabel: '(확대 레벨)',
    description: '전국 읍 · 면 · 동 (행정동 / 법정동)',
    zoomRangeText: 'Zoom ≥ 12.5 (확대 레벨)',
  },
};

// 일반구(비자치구) 이름 키워드 - Level 2(기초자치단체) 필터링 및 Level 3 분류용
export const NON_AUTONOMOUS_DISTRICT_NAMES = new Set([
  '장안구', '권선구', '팔달구', '영통구', // 수원시
  '수정구', '중원구', '분당구',          // 성남시
  '덕양구', '일산동구', '일산서구',      // 고양시
  '처인구', '기흥구', '수지구',          // 용인시
  '만안구', '동안구',                    // 안양시
  '상록구', '단원구',                    // 안산시
  '원미구', '소사구', '오정구',          // 부천시
  '상당구', '서원구', '흥덕구', '청원구', // 청주시
  '동남구', '서북구',                    // 천안시
  '완산구', '덕진구',                    // 전주시
  '남구', '북구',                       // 포항시 등
  '의창구', '성산구', '마산합포구', '마산회원구', '진해구' // 창원시
]);

// 행정동 이름(e.g., "화정1동", "역삼2동", "상계3.4동", "신당제1동", "반포본동")을 법정동 이름(e.g., "화정동", "역삼동", "상계동", "신당동", "반포동")으로 변환하는 함수
export function getLegalDongName(hdongName: string): string {
  if (!hdongName) return '';
  return hdongName
    .replace(/제?\d+(\.\d+)?동$/, '동')
    .replace(/본동$/, '동')
    .replace(/\d+동$/, '동')
    .replace(/제\d+동$/, '동');
}

// 초기에 비어있거나 경계가 명확한 실크 형태의 기본 GeoJSON 껍데기
export const LEVEL_1_SIDO_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: []
};

export const LEVEL_2_SIGUNGU_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: []
};

export const LEVEL_3_DISTRICT_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: []
};

export const LEVEL_4_SUBDISTRICT_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: []
};

// ==========================================
// Remote Fetching Helper to load full nationwide GeoJSON (Sido, Sigungu, Eup/Myeon/Dong)
// ==========================================
export async function fetchNationwideGeoJson(): Promise<{
  level1?: FeatureCollection;
  level2?: FeatureCollection;
  level3?: FeatureCollection;
  level4?: FeatureCollection;
}> {
  try {
    const [resSido, resSigungu, resSubmun] = await Promise.all([
      fetch('https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-geo.json').catch(() => null),
      fetch('https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json').catch(() => null),
      fetch('https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-submunicipalities-2018-geo.json').catch(() => null),
    ]);

    let level1: FeatureCollection | undefined;
    let level2: FeatureCollection | undefined;
    let level3: FeatureCollection | undefined;
    let level4: FeatureCollection | undefined;

    // 1. 광역자치단체 (시/도)
    if (resSido && resSido.ok) {
      const data = await resSido.json();
      if (data && data.features) {
        level1 = {
          type: 'FeatureCollection',
          features: data.features.map((f: Feature) => {
            const name = f.properties?.name || f.properties?.CTP_KOR_NM || f.properties?.code || '시/도';
            return {
              ...f,
              properties: {
                ...f.properties,
                name: name,
                type: '광역자치단체',
                level: 1,
              }
            };
          })
        };
      }
    }

    // 2. 기초자치단체 (시/군/구 및 일반구) -> Level 2
    if (resSigungu && resSigungu.ok) {
      const data = await resSigungu.json();
      if (data && data.features) {
        const l2Features: Feature[] = data.features.map((f: Feature) => {
          const rawName: string = f.properties?.name || f.properties?.SIG_KOR_NM || '';
          return {
            ...f,
            properties: {
              ...f.properties,
              name: rawName,
              type: '기초자치단체',
              level: 2,
            }
          };
        });

        level2 = { type: 'FeatureCollection', features: l2Features };
      }
    }

    // 3. 전국 읍/면/동 -> Level 3 (3단계 행정구역)
    if (resSubmun && resSubmun.ok) {
      const data = await resSubmun.json();
      if (data && data.features) {
        const l3Features: Feature[] = data.features.map((f: Feature) => {
          const rawName: string = f.properties?.name || f.properties?.EMD_KOR_NM || '읍/면/동';
          const nameParts = rawName.split(' ');
          const dongName = nameParts[nameParts.length - 1]; // 마지막 단어 (예: 화정동, 삼성동)
          return {
            ...f,
            properties: {
              ...f.properties,
              name: dongName || rawName,
              fullName: rawName,
              type: '3단계 행정구역(읍/면/동)',
              level: 3,
            }
          };
        });

        level3 = { type: 'FeatureCollection', features: l3Features };
        level4 = level3;
      }
    }

    setGeoJsonFeaturesCache({
      level1: level1?.features,
      level2: level2?.features,
      level3: level3?.features,
      level4: level4?.features,
    });

    return { level1, level2, level3, level4 };
  } catch (e) {
    console.warn('Failed to fetch nationwide GeoJSON:', e);
    return {};
  }
}
