import { FeatureCollection, Feature } from 'geojson';
import { setGeoJsonFeaturesCache } from './regionHierarchy';

// Helper type for our 4 administrative levels
export type AdminLevel = 1 | 2 | 3 | 4;

// Standard Sido 2-digit Code to Name Mapping (MOIS & KOSTAT Compatible)
export const SIDO_CODE_MAP: Record<string, string> = {
  '11': '서울특별시',
  '26': '부산광역시',
  '27': '대구광역시',
  '28': '인천광역시',
  '29': '광주광역시',
  '30': '대전광역시',
  '31': '울산광역시',
  '36': '세종특별자치시',
  '41': '경기도',
  '42': '강원특별자치도',
  '43': '충청북도',
  '44': '충청남도',
  '45': '전북특별자치도',
  '46': '전라남도',
  '47': '경상북도',
  '48': '경상남도',
  '50': '제주특별자치도',
};

// Robust Sido Resolution supporting both KOSTAT (2018 GeoJSON) & MOIS Administrative Code Standards
export function resolveSidoName(code: string, rawName: string = ''): { sidoCode: string; sidoName: string } {
  const c = String(code || '').trim();
  const name = String(rawName || '').trim();

  // 1. Direct name matching if rawName already has or belongs to a known province/city
  if (name.includes('서울') || /^(종로|용산|성동|광진|동대문|중랑|성북|강북|도봉|노원|은평|서대문|마포|양천|강서|구로|금천|영등포|동작|관악|서초|강남|송파|강동)구/.test(name)) {
    return { sidoCode: '11', sidoName: '서울특별시' };
  }
  if (name.includes('부산') || /^(부산진|영도|동래|해운대|사하|금정|연제|수영|사상|기장)/.test(name)) {
    return { sidoCode: '26', sidoName: '부산광역시' };
  }
  if (name.includes('대구') || /^(달서|달성|수성|군위)/.test(name)) {
    return { sidoCode: '27', sidoName: '대구광역시' };
  }
  if (name.includes('인천') || /^(미추홀|부평|계양|강화|옹진|연수)/.test(name)) {
    return { sidoCode: '28', sidoName: '인천광역시' };
  }
  if (name.includes('광주') && !name.includes('경기') && (name.includes('광역시') || /^(광산구)/.test(name))) {
    return { sidoCode: '29', sidoName: '광주광역시' };
  }
  if (name.includes('대전') || /^(유성|대덕)/.test(name)) {
    return { sidoCode: '30', sidoName: '대전광역시' };
  }
  if (name.includes('울산') || /^(울주)/.test(name)) {
    return { sidoCode: '31', sidoName: '울산광역시' };
  }
  if (name.includes('세종')) {
    return { sidoCode: '36', sidoName: '세종특별자치시' };
  }
  if (name.includes('경기') || /^(수원|성남|고양|용인|부천|안산|안양|남양주|화성|평택|의정부|시흥|파주|김포|광명|광주|군포|이천|양주|오산|구리|안성|포천|의왕|하남|여주|양평|동두천|과천|가평|연천)/.test(name) || /^(장안|권선|팔달|영통|수정|중원|분당|덕양|일산동|일산서|처인|기흥|수지|만안|동안|상록|단원|원미|소사|오정)구/.test(name)) {
    return { sidoCode: '41', sidoName: '경기도' };
  }
  if (name.includes('강원') || /^(춘천|원주|강릉|동해|태백|속초|삼척|홍천|횡성|영월|평창|정선|철원|화천|양구|인제|고성|양양)/.test(name)) {
    return { sidoCode: '42', sidoName: '강원특별자치도' };
  }
  if (name.includes('충북') || name.includes('충청북') || /^(청주|충주|제천|보은|옥천|영동|증평|진천|괴산|음성|단양|상당|서원|흥덕|청원)/.test(name)) {
    return { sidoCode: '43', sidoName: '충청북도' };
  }
  if (name.includes('충남') || name.includes('충청남') || /^(천안|공주|보령|아산|서산|논산|계룡|당진|금산|부여|서천|청양|홍성|예산|태안|동남|서북)/.test(name)) {
    return { sidoCode: '44', sidoName: '충청남도' };
  }
  if (name.includes('전북') || name.includes('전라북') || /^(전주|군산|익산|정읍|남원|김제|완주|진안|무주|장수|임실|순창|고창|부안|완산|덕진)/.test(name)) {
    return { sidoCode: '45', sidoName: '전북특별자치도' };
  }
  if (name.includes('전남') || name.includes('전라남') || /^(목포|여수|순천|나주|광양|담양|곡성|구례|고흥|보성|화순|장흥|강진|해남|영암|무안|함평|영광|장성|완도|진도|신안)/.test(name)) {
    return { sidoCode: '46', sidoName: '전라남도' };
  }
  if (name.includes('경북') || name.includes('경상북') || /^(포항|경주|김천|안동|구미|영주|영천|상주|문경|경산|의성|청송|영양|영덕|청도|고령|성주|칠곡|예천|봉화|울진|울릉)/.test(name)) {
    return { sidoCode: '47', sidoName: '경상북도' };
  }
  if (name.includes('경남') || name.includes('경상남') || /^(창원|진주|통영|사천|김해|밀양|거제|양산|의령|함안|창녕|고성|남해|하동|산청|함양|거창|합천|의창|성산|마산합포|마산회원|진해)/.test(name)) {
    return { sidoCode: '48', sidoName: '경상남도' };
  }
  if (name.includes('제주') || /^(서귀포)/.test(name)) {
    return { sidoCode: '50', sidoName: '제주특별자치도' };
  }

  // 2. Fall back to code interpretation
  const prefix2 = c.substring(0, 2);

  // KOSTAT 2018 mapping:
  const KOSTAT_MAP: Record<string, { sidoCode: string; sidoName: string }> = {
    '11': { sidoCode: '11', sidoName: '서울특별시' },
    '21': { sidoCode: '26', sidoName: '부산광역시' },
    '22': { sidoCode: '27', sidoName: '대구광역시' },
    '23': { sidoCode: '28', sidoName: '인천광역시' },
    '24': { sidoCode: '29', sidoName: '광주광역시' },
    '25': { sidoCode: '30', sidoName: '대전광역시' },
    '26': { sidoCode: '31', sidoName: '울산광역시' },
    '29': { sidoCode: '36', sidoName: '세종특별자치시' },
    '31': { sidoCode: '41', sidoName: '경기도' },
    '32': { sidoCode: '42', sidoName: '강원특별자치도' },
    '33': { sidoCode: '43', sidoName: '충청북도' },
    '34': { sidoCode: '44', sidoName: '충청남도' },
    '35': { sidoCode: '45', sidoName: '전북특별자치도' },
    '36': { sidoCode: '46', sidoName: '전라남도' },
    '37': { sidoCode: '47', sidoName: '경상북도' },
    '38': { sidoCode: '48', sidoName: '경상남도' },
    '39': { sidoCode: '50', sidoName: '제주특별자치도' },
  };

  // MOIS mapping (standard):
  const MOIS_MAP: Record<string, { sidoCode: string; sidoName: string }> = {
    '11': { sidoCode: '11', sidoName: '서울특별시' },
    '26': { sidoCode: '26', sidoName: '부산광역시' },
    '27': { sidoCode: '27', sidoName: '대구광역시' },
    '28': { sidoCode: '28', sidoName: '인천광역시' },
    '29': { sidoCode: '29', sidoName: '광주광역시' },
    '30': { sidoCode: '30', sidoName: '대전광역시' },
    '31': { sidoCode: '31', sidoName: '울산광역시' },
    '36': { sidoCode: '36', sidoName: '세종특별자치시' },
    '41': { sidoCode: '41', sidoName: '경기도' },
    '42': { sidoCode: '42', sidoName: '강원특별자치도' },
    '43': { sidoCode: '43', sidoName: '충청북도' },
    '44': { sidoCode: '44', sidoName: '충청남도' },
    '45': { sidoCode: '45', sidoName: '전북특별자치도' },
    '46': { sidoCode: '46', sidoName: '전라남도' },
    '47': { sidoCode: '47', sidoName: '경상북도' },
    '48': { sidoCode: '48', sidoName: '경상남도' },
    '50': { sidoCode: '50', sidoName: '제주특별자치도' },
  };

  if (['41', '42', '43', '44', '45', '46', '47', '48', '50'].includes(prefix2)) {
    return MOIS_MAP[prefix2] || { sidoCode: prefix2, sidoName: '' };
  }

  if (KOSTAT_MAP[prefix2]) {
    return KOSTAT_MAP[prefix2];
  }

  return MOIS_MAP[prefix2] || { sidoCode: prefix2, sidoName: '' };
}

export function getSidoNameByCode(sidoCode: string): string {
  const resolved = resolveSidoName(sidoCode);
  return resolved.sidoName;
}

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
            const code = String(f.properties?.code || f.properties?.CTPRVN_CD || f.properties?.CTP_CD || f.id || '').trim();
            const rawName = String(f.properties?.name || f.properties?.CTP_KOR_NM || '').trim();
            const { sidoCode, sidoName } = resolveSidoName(code, rawName);
            const name = rawName || sidoName || '시/도';
            return {
              ...f,
              properties: {
                ...f.properties,
                code: sidoCode || code,
                name: name,
                fullName: name,
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
          const rawName: string = String(f.properties?.name || f.properties?.SIG_KOR_NM || '').trim();
          const code: string = String(f.properties?.code || f.properties?.SIG_CD || f.properties?.SIGUNGU_CD || f.id || '').trim();
          const { sidoCode, sidoName } = resolveSidoName(code, rawName);
          const fullName = sidoName && !rawName.includes(sidoName) ? `${sidoName} ${rawName}` : rawName;

          return {
            ...f,
            properties: {
              ...f.properties,
              code: code,
              name: rawName,
              fullName: fullName,
              parentCode: sidoCode,
              parentName: sidoName,
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
          const rawName: string = String(f.properties?.name || f.properties?.EMD_KOR_NM || '읍/면/동').trim();
          const code: string = String(f.properties?.code || f.properties?.EMD_CD || f.id || '').trim();
          const { sidoCode, sidoName } = resolveSidoName(code, rawName);
          const nameParts = rawName.split(' ');
          const dongName = nameParts[nameParts.length - 1]; // 마지막 단어 (예: 청운효자동, 역삼동)
          const sigunguCode = code.length >= 5 ? code.substring(0, 5) : '';

          return {
            ...f,
            properties: {
              ...f.properties,
              code: code,
              name: dongName || rawName,
              fullName: rawName,
              parentCode: sigunguCode,
              parentName: sidoName,
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
