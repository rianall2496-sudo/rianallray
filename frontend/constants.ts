import { Branch, Subordinate, SpecialApplicant, MercenaryUnit, MapBase } from './types.ts';

export const RANKS = [
  '이병', '일병', '상병', '병장', // 0-3
  '하사', '중사', '상사', '원사', // 4-7
  '준위', // 8
  '소위', '중위', '대위', // 9-11 (Start at 9)
  '소령', '중령', '대령', // 12-14 (Production unlocks at 12)
  '준장', '소장', '중장', '대장', // 15-18
  '원수' // 19
];

export const getRankIcon = (index: number) => {
  const icons = [
    '━', '━━', '━━━', '━━━━', // 0-3: 이병~병장
    'V', 'VV', 'VVV', '★VVV', // 4-7: 하사~원사
    '◇', // 8: 준위
    '◆', '◆◆', '◆◆◆', // 9-11: 소위~대위
    '❁', '❁❁', '❁❁❁', // 12-14: 소령~대령
    '★', '★★', '★★★', '★★★★', // 15-18: 준장~대장
    '★★★★★' // 19: 원수
  ];
  return icons[index] || '';
};

export const STARTING_RANK_INDEX = 9; // 소위 (2nd Lieutenant)
export const PRODUCTION_UNLOCK_RANK_INDEX = 12; // 소령 (Major)

export const UNIT_SIZES = [
  { name: '분대 (Squad)', min: 0 },
  { name: '소대 (Platoon)', min: 36 },
  { name: '중대 (Company)', min: 108 },
  { name: '대대 (Battalion)', min: 432 },
  { name: '연대/여단 (Regiment/Brigade)', min: 1728 },
  { name: '사단 (Division)', min: 10000 },
  { name: '군단 (Corps)', min: 40000 },
  { name: '야전군 (Field Army)', min: 160000 },
  { name: '총사령부 (Supreme Command)', min: 640000 }
];

export const getUnitName = (troops: number) => {
  let currentUnit = UNIT_SIZES[0].name;
  for (const unit of UNIT_SIZES) {
    if (troops >= unit.min) {
      currentUnit = unit.name;
    } else {
      break;
    }
  }
  return currentUnit;
};

export const XP_REQUIREMENTS = [
  0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000, // 0-9
  7000, 10000, 15000, 22000, 30000, 45000, 60000, 80000, 120000, 200000 // 10-19
];

export const EQUIPMENT_CATALOG = {
  [Branch.ARMY]: [
    { id: 'm16', name: 'M16 소총', cost: 1000000, type: 'WEAPON' },
    { id: 'mortar', name: '박격포', cost: 5000000, type: 'WEAPON' },
    { id: 'jeep', name: '군용 짚차', cost: 20000000, type: 'VEHICLE' },
    { id: 'truck', name: '군용 트럭', cost: 50000000, type: 'VEHICLE' },
    { id: 'tank', name: 'K2 흑표 전차', cost: 5000000000, type: 'VEHICLE' },
    { id: 'missile', name: '현무 미사일', cost: 20000000000, type: 'WEAPON' }
  ],
  [Branch.NAVY]: [
    { id: 'patrol', name: '참수리급 고속정', cost: 1000000000, type: 'SHIP' },
    { id: 'frigate', name: '호위함', cost: 50000000000, type: 'SHIP' },
    { id: 'destroyer', name: '이지스 구축함', cost: 200000000000, type: 'SHIP' },
    { id: 'submarine', name: '잠수함', cost: 300000000000, type: 'SHIP' },
    { id: 'carrier', name: '항공모함', cost: 1000000000000, type: 'SHIP' }
  ],
  [Branch.AIR_FORCE]: [
    { id: 'trainer', name: 'T-50 훈련기', cost: 20000000000, type: 'AIRCRAFT' },
    { id: 'fighter', name: 'KF-21 전투기', cost: 80000000000, type: 'AIRCRAFT' },
    { id: 'bomber', name: '폭격기', cost: 150000000000, type: 'AIRCRAFT' },
    { id: 'awacs', name: '조기경보기', cost: 300000000000, type: 'AIRCRAFT' },
    { id: 'stealth', name: 'F-35 스텔스기', cost: 120000000000, type: 'AIRCRAFT' }
  ]
};

export const TRAINING_CATALOG = {
  [Branch.ARMY]: [
    { id: 't_army_1', name: '유격 훈련 (Ranger)', durationMs: 2000, minRank: 9, cost: 5000000, baseXp: 150 },
    { id: 't_army_2', name: '혹한기 전술훈련', durationMs: 2000, minRank: 9, cost: 8000000, baseXp: 200 },
    { id: 't_army_3', name: '혹서기 전술훈련', durationMs: 2000, minRank: 9, cost: 8000000, baseXp: 200 },
    { id: 't_army_9', name: '화생방 (CBRN) 훈련', durationMs: 2000, minRank: 9, cost: 3000000, baseXp: 100 },
    { id: 't_army_6', name: '전차포 실사격 훈련', durationMs: 2000, minRank: 10, cost: 30000000, baseXp: 350 },
    { id: 't_army_7', name: '도하 훈련 (River Crossing)', durationMs: 2000, minRank: 10, cost: 15000000, baseXp: 250 },
    { id: 't_army_10', name: '시가지 전투 (CQB)', durationMs: 2000, minRank: 10, cost: 10000000, baseXp: 280 },
    { id: 't_army_4', name: 'KCTC 과학화 전투훈련', durationMs: 2000, minRank: 11, cost: 50000000, baseXp: 500 },
    { id: 't_army_5', name: '공수기본훈련 (Airborne)', durationMs: 2000, minRank: 11, cost: 20000000, baseXp: 300 },
    { id: 't_army_8', name: '대테러 진압 훈련', durationMs: 2000, minRank: 12, cost: 25000000, baseXp: 400 }
  ],
  [Branch.NAVY]: [
    { id: 't_navy_1', name: '해상기동훈련', durationMs: 2000, minRank: 9, cost: 10000000, baseXp: 180 },
    { id: 't_navy_2', name: '순항훈련', durationMs: 2000, minRank: 9, cost: 15000000, baseXp: 220 },
    { id: 't_navy_5', name: '혹한기 해상생존훈련', durationMs: 2000, minRank: 9, cost: 8000000, baseXp: 150 },
    { id: 't_navy_6', name: '함포 실사격 훈련', durationMs: 2000, minRank: 10, cost: 40000000, baseXp: 350 },
    { id: 't_navy_7', name: '대잠수함 탐색 훈련', durationMs: 2000, minRank: 10, cost: 25000000, baseXp: 300 },
    { id: 't_navy_8', name: '기뢰 탐색 및 소해', durationMs: 2000, minRank: 10, cost: 20000000, baseXp: 280 },
    { id: 't_navy_3', name: '잠수함 회피훈련', durationMs: 2000, minRank: 11, cost: 30000000, baseXp: 400 },
    { id: 't_navy_4', name: 'UDT/SEAL 기초훈련', durationMs: 2000, minRank: 11, cost: 20000000, baseXp: 350 },
    { id: 't_navy_9', name: '해병대 연합 상륙훈련', durationMs: 2000, minRank: 12, cost: 80000000, baseXp: 600 },
    { id: 't_navy_10', name: '심해 잠수 구조훈련', durationMs: 2000, minRank: 12, cost: 35000000, baseXp: 450 }
  ],
  [Branch.AIR_FORCE]: [
    { id: 't_air_2', name: '비상대기 훈련', durationMs: 2000, minRank: 9, cost: 5000000, baseXp: 150 },
    { id: 't_air_3', name: '방공포병 사격훈련', durationMs: 2000, minRank: 9, cost: 15000000, baseXp: 200 },
    { id: 't_air_5', name: '혹서기 기지방호훈련', durationMs: 2000, minRank: 9, cost: 8000000, baseXp: 180 },
    { id: 't_air_6', name: '야간 전술비행 훈련', durationMs: 2000, minRank: 10, cost: 30000000, baseXp: 350 },
    { id: 't_air_7', name: '공중급유 훈련', durationMs: 2000, minRank: 10, cost: 40000000, baseXp: 380 },
    { id: 't_air_8', name: '정밀타격(JDAM) 훈련', durationMs: 2000, minRank: 10, cost: 50000000, baseXp: 450 },
    { id: 't_air_4', name: '생환훈련 (Survival)', durationMs: 2000, minRank: 11, cost: 10000000, baseXp: 300 },
    { id: 't_air_1', name: '레드플래그 (Red Flag)', durationMs: 2000, minRank: 11, cost: 100000000, baseXp: 800 },
    { id: 't_air_9', name: '전자전(EW) 대응 훈련', durationMs: 2000, minRank: 12, cost: 60000000, baseXp: 500 },
    { id: 't_air_10', name: '탐색구조(SAR) 훈련', durationMs: 2000, minRank: 12, cost: 35000000, baseXp: 400 }
  ]
};

export const BADGE_REQUIREMENTS: Record<string, { id: string, name: string, icon: string, threshold: number }> = {
  't_army_1': { id: 'b_ranger', name: '유격', icon: '🦅', threshold: 10 },
  't_army_2': { id: 'b_winter', name: '혹한기', icon: '❄️', threshold: 10 },
  't_army_3': { id: 'b_summer', name: '혹서기', icon: '☀️', threshold: 10 },
  't_army_4': { id: 'b_kctc', name: 'KCTC', icon: '🎯', threshold: 10 },
  't_army_5': { id: 'b_airborne', name: '공수', icon: '🪂', threshold: 10 },
  't_army_6': { id: 'b_tank', name: '기갑', icon: '🚜', threshold: 10 },
  't_army_7': { id: 'b_river', name: '도하', icon: '🌉', threshold: 10 },
  't_army_8': { id: 'b_ct', name: '대테러', icon: '🥷', threshold: 10 },
  't_army_9': { id: 'b_cbrn', name: '화생방', icon: '☣️', threshold: 10 },
  't_army_10': { id: 'b_cqb', name: '시가지', icon: '🏢', threshold: 10 },
  
  't_navy_1': { id: 'b_navy_1', name: '해상', icon: '🌊', threshold: 10 },
  't_navy_2': { id: 'b_navy_2', name: '순항', icon: '🚢', threshold: 10 },
  't_navy_3': { id: 'b_navy_3', name: '잠수함', icon: '🦈', threshold: 10 },
  't_navy_4': { id: 'b_udt', name: 'UDT', icon: '🔱', threshold: 10 },
  't_navy_5': { id: 'b_navy_5', name: '해상생존', icon: '🛟', threshold: 10 },
  't_navy_6': { id: 'b_navy_6', name: '함포', icon: '💥', threshold: 10 },
  't_navy_7': { id: 'b_navy_7', name: '대잠', icon: '📡', threshold: 10 },
  't_navy_8': { id: 'b_navy_8', name: '소해', icon: '💣', threshold: 10 },
  't_navy_9': { id: 'b_navy_9', name: '상륙', icon: '🏖️', threshold: 10 },
  't_navy_10': { id: 'b_navy_10', name: '구조', icon: '🚁', threshold: 10 },

  't_air_1': { id: 'b_redflag', name: '레드플래그', icon: '🚩', threshold: 10 },
  't_air_2': { id: 'b_air_2', name: '비상대기', icon: '⏱️', threshold: 10 },
  't_air_3': { id: 'b_air_3', name: '방공', icon: '🚀', threshold: 10 },
  't_air_4': { id: 'b_air_4', name: '생환', icon: '🏕️', threshold: 10 },
  't_air_5': { id: 'b_air_5', name: '기지방호', icon: '🛡️', threshold: 10 },
  't_air_6': { id: 'b_air_6', name: '야간비행', icon: '🦉', threshold: 10 },
  't_air_7': { id: 'b_air_7', name: '공중급유', icon: '⛽', threshold: 10 },
  't_air_8': { id: 'b_air_8', name: '정밀타격', icon: '🎯', threshold: 10 },
  't_air_9': { id: 'b_air_9', name: '전자전', icon: '⚡', threshold: 10 },
  't_air_10': { id: 'b_air_10', name: '탐색구조', icon: '🚑', threshold: 10 }
};

export const MEDALS = [
  { id: 'm_taegeuk', name: '태극 무공훈장', icon: '🎖️' },
  { id: 'm_eulji', name: '을지 무공훈장', icon: '🏅' },
  { id: 'm_chungmu', name: '충무 무공훈장', icon: '🥇' },
  { id: 'm_hwarang', name: '화랑 무공훈장', icon: '🥈' },
  { id: 'm_inheon', name: '인헌 무공훈장', icon: '🥉' },
  { id: 'm_tongil', name: '통일 보국훈장', icon: '🏵️' },
  { id: 'm_gukseon', name: '국선 보국훈장', icon: '💠' },
  { id: 'm_cheonsu', name: '천수 보국훈장', icon: '⚜️' },
  { id: 'm_samil', name: '삼일 보국훈장', icon: '🔱' },
  { id: 'm_gwangbok', name: '광복 보국훈장', icon: '🔆' }
];

export const COMBAT_ZONES = [
  // Level 1 (소대~중대급)
  { id: 'cz_af_1', name: '아프리카 소말리아 해적 소탕', level: 1, desc: '해상 및 연안 게릴라 소탕', reward: 100000000, minRank: 9, enemyTroops: 50, enemyUnit: '2개 소대' },
  { id: 'cz_af_2', name: '아프리카 말리 반군 진압', level: 1, desc: '사막 지대 반군 거점 타격', reward: 120000000, minRank: 9, enemyTroops: 80, enemyUnit: '3개 소대' },
  { id: 'cz_af_3', name: '아프리카 콩고 평화유지', level: 1, desc: 'UN 평화유지군 거점 방어', reward: 150000000, minRank: 9, enemyTroops: 120, enemyUnit: '1개 중대' },
  // Level 2 (중대~대대급)
  { id: 'cz_me_1', name: '중동 시리아 시가전', level: 2, desc: '폐허가 된 도심지 소탕 작전', reward: 300000000, minRank: 10, enemyTroops: 200, enemyUnit: '2개 중대' },
  { id: 'cz_me_2', name: '중동 예멘 반군 요새 타격', level: 2, desc: '산악 지대 반군 요새 점령', reward: 350000000, minRank: 10, enemyTroops: 350, enemyUnit: '3개 중대' },
  { id: 'cz_me_3', name: '중동 이라크 유전 방어', level: 2, desc: '주요 전략 자원 시설 방어', reward: 400000000, minRank: 10, enemyTroops: 500, enemyUnit: '1개 대대' },
  // Level 3 (대대~연대급)
  { id: 'cz_ir_1', name: '이란-이스라엘 접경 국지전', level: 3, desc: '고강도 드론 및 포격전', reward: 800000000, minRank: 11, enemyTroops: 1000, enemyUnit: '2개 대대' },
  { id: 'cz_ir_2', name: '호르무즈 해협 봉쇄 해제', level: 3, desc: '해상 교통로 확보 작전', reward: 900000000, minRank: 11, enemyTroops: 1500, enemyUnit: '3개 대대' },
  { id: 'cz_ir_3', name: '레바논 후티 반군 본거지 타격', level: 3, desc: '적 지휘부 정밀 타격 및 섬멸', reward: 1000000000, minRank: 11, enemyTroops: 2000, enemyUnit: '1개 연대' },
  // Level 4 (연대~사단급)
  { id: 'cz_uk_1', name: '우크라이나 동부 참호전', level: 4, desc: '대규모 포격 및 기갑전', reward: 2000000000, minRank: 13, enemyTroops: 5000, enemyUnit: '2개 연대' },
  { id: 'cz_uk_2', name: '우크라이나 크림반도 상륙', level: 4, desc: '적 후방 교란 및 상륙 작전', reward: 2500000000, minRank: 13, enemyTroops: 8000, enemyUnit: '3개 연대' },
  { id: 'cz_uk_3', name: '우크라이나 키이우 방어전', level: 4, desc: '수도 방위를 위한 총력전', reward: 3000000000, minRank: 13, enemyTroops: 12000, enemyUnit: '1개 사단' },
  // Level 5 (사단~군단급)
  { id: 'cz_ww3_1', name: '제3차 세계대전: 동아시아 전선', level: 5, desc: '주변 강대국과의 전면전', reward: 5000000000, minRank: 15, enemyTroops: 30000, enemyUnit: '3개 사단' },
  { id: 'cz_ww3_2', name: '제3차 세계대전: 태평양 해전', level: 5, 적: '적 항모전단 격멸 작전', reward: 8000000000, minRank: 15, enemyTroops: 50000, enemyUnit: '1개 군단' },
  { id: 'cz_ww3_3', name: '제3차 세계대전: 적 수도 진격', level: 5, desc: '전쟁 종결을 위한 최후의 진격', reward: 15000000000, minRank: 15, enemyTroops: 100000, enemyUnit: '2개 군단' }
];

export const CIVIL_SUPPORT_MISSIONS = [
  { id: 'cs_flood', name: '수해 복구 지원', desc: '침수 지역 도로 및 가옥 복구', reward: 150000000 },
  { id: 'cs_snow', name: '폭설 제설 작전', desc: '주요 보급로 및 도심 제설', reward: 100000000 },
  { id: 'cs_fire', name: '대형 산불 진화', desc: '산불 진화 및 주민 대피 지원', reward: 200000000 },
  { id: 'cs_medical', name: '대민 의료 지원', desc: '전염병 창궐 지역 의료진 파견', reward: 250000000 },
  { id: 'cs_allied', name: '동맹군 합동 훈련 지원', desc: '다국적 연합 작전 및 군수 지원', reward: 500000000 }
];

export const MOS_LIST = [
  { id: 'mos_rifle', name: '소총수', cost: 2000000, baseCount: 10 },
  { id: 'mos_medic', name: '의무병', cost: 5000000, baseCount: 5 },
  { id: 'mos_comms', name: '통신병', cost: 4000000, baseCount: 5 },
  { id: 'mos_eng', name: '공병', cost: 6000000, baseCount: 5 },
  { id: 'mos_heavy', name: '중화기병', cost: 8000000, baseCount: 5 }
];

export const RD_PROJECTS = [
  { id: 'rd_missile', name: '중장거리 미사일 개발', baseCost: 500000000, desc: '타격력 증가 (작전 성공률 +2%)' },
  { id: 'rd_tank', name: '차세대 전차 개발', baseCost: 800000000, desc: '기갑 전력 강화 (작전 성공률 +2%)' },
  { id: 'rd_patriot', name: '패트리어트 방공망', baseCost: 1000000000, desc: '생존성 증가 (작전 성공률 +2%)' }
];

export const SPECIAL_FORCES_TYPES = ['UDT/SEAL', '해병대 수색대', '707 특수임무단', '화이트부대 (정보사)', '기동타격대'];

const MERCENARY_NAMES = ['블랙워터', '바그너 그룹', '아카데미', 'G4S', '데프콘', '쉐도우 컴퍼니', '아이언 사이트', '로그 스피어'];

const KOREAN_NAMES = [
  '김민준', '이서준', '박도윤', '최예준', '정시우', '강하준', '조지호', '윤지훈', '장우진', '임건우',
  '한현우', '오연우', '서동현', '신승민', '권준서', '황민재', '안성현', '송준우', '전지훈', '홍성민',
  '유진우', '백도현', '문건우', '최지훈', '정우진', '강민재', '조성현', '윤준우', '장지훈', '임성민',
  '박지성', '이동국', '손흥민', '김민재', '이강인', '황희찬', '이재성', '정우영', '황인범', '조규성'
];

export const KOREA_MAP_BASES: MapBase[] = [
  { id: 'mb_1', name: '제1군단 사령부', type: '군단', x: 35, y: 20, troops: 40000, commander: '김군단 중장', status: '경계' },
  { id: 'mb_2', name: '제5군단 사령부', type: '군단', x: 55, y: 15, troops: 40000, commander: '이군단 중장', status: '경계' },
  { id: 'mb_3', name: '제7기동군단', type: '군단', x: 60, y: 35, troops: 50000, commander: '박기동 중장', status: '훈련중' },
  { id: 'mb_4', name: '제9보병사단', type: '사단', x: 30, y: 25, troops: 10000, commander: '최사단 소장', status: '경계' },
  { id: 'mb_5', name: '제60동원보병사단', type: '사단', x: 40, y: 30, troops: 8000, commander: '정동원 소장', status: '대기' },
  { id: 'mb_6', name: '제7공수특전여단', type: '여단', x: 70, y: 60, troops: 3000, commander: '강공수 준장', status: '작전중' },
  { id: 'mb_7', name: '제1해병사단', type: '사단', x: 80, y: 70, troops: 12000, commander: '조해병 소장', status: '훈련중' },
  { id: 'mb_8', name: '수도방위사령부', type: '군단', x: 45, y: 28, troops: 30000, commander: '윤수방 중장', status: '경계' },
  { id: 'mb_9', name: '제11기동사단', type: '사단', x: 65, y: 25, troops: 10000, commander: '장기동 소장', status: '훈련중' },
  { id: 'mb_10', name: '제32보병사단', type: '사단', x: 50, y: 50, troops: 9000, commander: '임보병 소장', status: '경계' },
  { id: 'mb_11', name: '제31보병사단', type: '사단', x: 35, y: 75, troops: 9000, commander: '한보병 소장', status: '대기' },
  { id: 'mb_12', name: '제39보병사단', type: '사단', x: 65, y: 80, troops: 9000, commander: '오보병 소장', status: '경계' },
  { id: 'mb_13', name: '제1특전대대', type: '대대', x: 72, y: 58, troops: 400, commander: '김특전 중령', status: '작전중' },
  { id: 'mb_14', name: '제2기갑대대', type: '대대', x: 62, y: 38, troops: 450, commander: '이기갑 중령', status: '훈련중' },
  { id: 'mb_15', name: '제3수색중대', type: '중대', x: 32, y: 22, troops: 120, commander: '박수색 대위', status: '경계' },
  { id: 'mb_16', name: '제1기동소대', type: '소대', x: 48, y: 26, troops: 40, commander: '최기동 소위', status: '대기' }
];

export const getTroopsForRole = (role: string): number => {
  if (role.includes('야전군')) return 160000;
  if (role.includes('군단')) return 40000;
  if (role.includes('사단')) return 10000;
  if (role.includes('연대') || role.includes('여단')) return 1728;
  if (role.includes('대대')) return 432;
  if (role.includes('중대')) return 108;
  if (role.includes('소대')) return 36;
  if (role.includes('분대')) return 12;
  return 5; // 참모 등
};

export const generateSubordinate = (role: string, rankIndex: number): Subordinate => {
  const randomName = KOREAN_NAMES[Math.floor(Math.random() * KOREAN_NAMES.length)];
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: randomName,
    rankIndex,
    xp: XP_REQUIREMENTS[rankIndex] || 0,
    role,
    troops: getTroopsForRole(role),
    status: '양호'
  };
};

export const generateSpecialApplicant = (): SpecialApplicant => {
  const randomName = KOREAN_NAMES[Math.floor(Math.random() * KOREAN_NAMES.length)];
  const type = SPECIAL_FORCES_TYPES[Math.floor(Math.random() * SPECIAL_FORCES_TYPES.length)];
  const rankIndex = Math.floor(Math.random() * 6) + 9; // 9 (소위) to 14 (대령)
  const int = Math.floor(Math.random() * 50) + 50;
  const sta = Math.floor(Math.random() * 50) + 50;
  const cha = Math.floor(Math.random() * 50) + 50;
  
  const rankMultiplier = rankIndex - 8; // 1 to 6
  const combatPower = (rankMultiplier * 150) + int + sta + cha + Math.floor(Math.random() * 100);
  const cost = (rankMultiplier * 300000000) + Math.floor(Math.random() * 200000000);
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: randomName,
    rankIndex,
    type,
    stats: { intelligence: int, stamina: sta, charisma: cha, reputation: 0 },
    combatPower,
    cost
  };
};

export const generateMercenary = (): MercenaryUnit => {
  const isBattalion = Math.random() > 0.5;
  const size = isBattalion ? '대대' : '중대';
  const troops = isBattalion ? 432 : 108;
  const combatPower = isBattalion ? Math.floor(Math.random() * 15000) + 15000 : Math.floor(Math.random() * 5000) + 5000;
  const cost = isBattalion ? Math.floor(Math.random() * 4000000000) + 4000000000 : Math.floor(Math.random() * 2000000000) + 1000000000;
  const remainingUses = Math.floor(Math.random() * 3) + 3; // 3~5 uses
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: MERCENARY_NAMES[Math.floor(Math.random() * MERCENARY_NAMES.length)],
    size,
    troops,
    combatPower,
    cost,
    remainingUses
  };
};

export const generateCommandTree = (parentRank: number, roleType?: string): Subordinate[] => {
  let subs: Subordinate[] = [];

  const buildHierarchy = (roleName: string, rankIdx: number, childType: string | null, childCount: number, childRank: number, prefix: string, currentDepth: number, maxDepth: number): Subordinate => {
    const sub = generateSubordinate(`${prefix}${roleName}`, rankIdx);
    if (childType && currentDepth < maxDepth) {
      sub.subordinates = [];
      for (let i = 1; i <= childCount; i++) {
        let nextType = null, nextCount = 0, nextRank = 0;
        if (childType === '야전군사령관') { nextType = '군단장'; nextCount = 4; nextRank = 17; }
        else if (childType === '군단장') { nextType = '사단장'; nextCount = 4; nextRank = 16; }
        else if (childType === '사단장') { nextType = '연대장'; nextCount = 4; nextRank = 14; }
        else if (childType === '연대장') { nextType = '대대장'; nextCount = 4; nextRank = 13; }
        else if (childType === '대대장') { nextType = '중대장'; nextCount = 4; nextRank = 11; }
        else if (childType === '중대장') { nextType = '소대장'; nextCount = 4; nextRank = 9; }
        else if (childType === '소대장') { nextType = '분대장'; nextCount = 3; nextRank = 4; }

        sub.subordinates.push(buildHierarchy(childType, childRank, nextType, nextCount, nextRank, `${i}`, currentDepth + 1, maxDepth));
      }
    }
    return sub;
  };

  if (roleType === 'MAJOR_OPS') {
    subs.push(generateSubordinate('작전장교', 11));
    subs.push(generateSubordinate('군수장교', 11));
    return subs;
  }
  if (roleType === 'BG_STAFF') {
    subs.push(generateSubordinate('작전처장', 14));
    subs.push(generateSubordinate('정보처장', 14));
    subs.push(generateSubordinate('군수처장', 14));
    return subs;
  }

  const maxD = 4; // Limit depth to prevent memory issues on high ranks

  switch (parentRank) {
    case 19: // 원수
      for(let i=1; i<=4; i++) subs.push(buildHierarchy('야전군사령관', 18, '군단장', 4, 17, `${i}`, 1, maxD));
      break;
    case 18: // 대장
      for(let i=1; i<=4; i++) subs.push(buildHierarchy('군단장', 17, '사단장', 4, 16, `${i}`, 1, maxD));
      break;
    case 17: // 중장
      for(let i=1; i<=4; i++) subs.push(buildHierarchy('사단장', 16, '연대장', 4, 14, `${i}`, 1, maxD));
      subs.push(buildHierarchy('동원사단장', 16, '연대장', 4, 14, '', 1, maxD));
      break;
    case 16: // 소장
      subs.push(generateSubordinate('부사단장', 15));
      for(let i=1; i<=4; i++) subs.push(buildHierarchy('연대장', 14, '대대장', 4, 13, `${i}`, 1, maxD));
      break;
    case 15: // 준장 (여단장)
      for(let i=1; i<=4; i++) subs.push(buildHierarchy('대대장', 13, '중대장', 4, 11, `${i}`, 1, maxD));
      break;
    case 14: // 대령
      for(let i=1; i<=4; i++) subs.push(buildHierarchy('대대장', 13, '중대장', 4, 11, `${i}`, 1, maxD));
      break;
    case 13: // 중령
      for(let i=1; i<=4; i++) subs.push(buildHierarchy('중대장', 11, '소대장', 4, 9, `${i}`, 1, maxD));
      break;
    case 12: // 소령 (중대장)
      for(let i=1; i<=2; i++) subs.push(buildHierarchy('중대장', 11, '소대장', 4, 9, `${i}`, 1, maxD));
      break;
    case 11: // 대위
      for(let i=1; i<=4; i++) subs.push(buildHierarchy('소대장', 9, '분대장', 3, 4, `${i}`, 1, maxD));
      break;
    case 10: // 중위
      for(let i=1; i<=2; i++) subs.push(buildHierarchy('소대장', 9, '분대장', 3, 4, `${i}`, 1, maxD));
      break;
    case 9: // 소위
      for(let i=1; i<=3; i++) subs.push(buildHierarchy('분대장', 4, null, 0, 0, `${i}`, 1, maxD));
      break;
  }
  return subs;
};

export const getPlayerRoleName = (rankIndex: number, currentRole?: string): string => {
  switch (rankIndex) {
    case 9:
    case 10: return '소대장';
    case 11: return '중대장';
    case 12: return currentRole === 'MAJOR_OPS' ? '작전참모' : (currentRole === 'MAJOR_CMD' ? '중대장' : '');
    case 13: return '대대장';
    case 14: return '여단장';
    case 15: return currentRole === 'BG_STAFF' ? '작전참모장' : (currentRole === 'BG_CMD' ? '여단장' : '');
    case 16: return '사단장';
    case 17: return '군단장';
    case 18: return '야전군사령관';
    case 19: return '총사령관';
    default: return '';
  }
};
